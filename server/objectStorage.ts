// Reference: blueprint:javascript_object_storage integration
// Object Storage Service for managing large video and image uploads
// Uses Replit's official @replit/object-storage SDK
import { Client } from "@replit/object-storage";
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// Initialize Replit Object Storage client for uploads
export const replitClient = new Client();

// Google Cloud Storage client for downloads and ACL management
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service
export class ObjectStorageService {
  private detectedBucket: string | null = null;

  constructor() {}

  // Auto-detect the active Replit Object Storage bucket
  private async detectBucket(): Promise<string> {
    if (this.detectedBucket) {
      return this.detectedBucket;
    }

    try {
      // Try to get bucket from environment variable first
      const envBucket = process.env.REPLIT_OBJSTORE_BUCKET;
      if (envBucket) {
        console.log('[ObjectStorage] Using bucket from REPLIT_OBJSTORE_BUCKET:', envBucket);
        this.detectedBucket = envBucket;
        return envBucket;
      }

      // List all buckets and find the replit-objstore one
      const [buckets] = await objectStorageClient.getBuckets();
      const replitBucket = buckets.find(b => b.name.startsWith('replit-objstore-'));
      
      if (replitBucket) {
        console.log('[ObjectStorage] Auto-detected bucket:', replitBucket.name);
        this.detectedBucket = replitBucket.name;
        return replitBucket.name;
      }

      throw new Error('No Replit Object Storage bucket found');
    } catch (error) {
      console.error('[ObjectStorage] Failed to detect bucket:', error);
      throw new Error('Unable to detect Object Storage bucket. Please check your Replit Object Storage setup.');
    }
  }

  // Gets the public object search paths
  async getPublicObjectSearchPaths(): Promise<Array<string>> {
    // Always try to auto-detect bucket first
    try {
      const bucket = await this.detectBucket();
      const autoPath = `/${bucket}/public`;
      console.log('[ObjectStorage] Auto-detected public path:', autoPath);
      return [autoPath];
    } catch (error) {
      console.warn('[ObjectStorage] Failed to auto-detect bucket, falling back to env var:', error);
      
      // Fallback to environment variable
      const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
      const paths = Array.from(
        new Set(
          pathsStr
            .split(",")
            .map((path) => path.trim())
            .filter((path) => path.length > 0)
        )
      );
      
      if (paths.length > 0) {
        return paths;
      }
      
      throw new Error('No Object Storage bucket found and PUBLIC_OBJECT_SEARCH_PATHS not set');
    }
  }

  // Gets the private object directory
  async getPrivateObjectDir(): Promise<string> {
    // Always try to auto-detect bucket first
    try {
      const bucket = await this.detectBucket();
      const autoDir = `/${bucket}/public`;
      console.log('[ObjectStorage] Auto-detected private dir:', autoDir);
      return autoDir;
    } catch (error) {
      console.warn('[ObjectStorage] Failed to auto-detect bucket, falling back to env var:', error);
      
      // Fallback to environment variable
      const dir = process.env.PRIVATE_OBJECT_DIR || "";
      if (dir) {
        return dir;
      }
      
      throw new Error('No Object Storage bucket found and PRIVATE_OBJECT_DIR not set');
    }
  }

  // Legacy sync version for backward compatibility
  getPrivateObjectDirSync(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths
  async searchPublicObject(filePath: string): Promise<File | null> {
    const searchPaths = await this.getPublicObjectSearchPaths();
    for (const searchPath of searchPaths) {
      const fullPath = `${searchPath}/${filePath}`;

      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file path from File object
      const filePath = `/${file.bucket.name}/${file.name}`;
      console.log('[downloadObject] Downloading file:', filePath);
      
      // Download using Replit SDK (has proper permissions)
      // Replit SDK returns { ok: true, value: [Buffer] }
      const result = await replitClient.downloadAsBytes(filePath);
      
      if (!result.ok || !result.value || result.value.length === 0) {
        throw new Error('Failed to download file from storage');
      }
      
      const fileBuffer = result.value[0];
      console.log('[downloadObject] Downloaded successfully, size:', fileBuffer.length, 'bytes');
      
      // Determine content type from filename
      const filename = file.name.split('/').pop() || '';
      const ext = filename.toLowerCase().split('.').pop();
      let contentType = 'application/octet-stream';
      if (ext === 'mov' || ext === 'mp4') contentType = 'video/quicktime';
      else if (ext === 'webm') contentType = 'video/webm';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      
      res.set({
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      });

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Upload a file to Object Storage using Replit SDK
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    userId: string,
    contentType?: string,
    visibility: 'public' | 'private' = 'public'
  ): Promise<{ objectPath: string; storageUri: string }> {
    let targetDir: string;
    
    if (visibility === 'public') {
      const publicPaths = await this.getPublicObjectSearchPaths();
      if (!publicPaths || publicPaths.length === 0) {
        throw new Error(
          "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
            "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var."
        );
      }
      targetDir = publicPaths[0];
    } else {
      const privateObjectDir = await this.getPrivateObjectDir();
      if (!privateObjectDir) {
        throw new Error(
          "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
            "tool and set PRIVATE_OBJECT_DIR env var."
        );
      }
      targetDir = privateObjectDir;
    }

    // Generate unique object path
    const objectId = randomUUID();
    const extension = fileName.split('.').pop();
    const fullStoragePath = `${targetDir}/${objectId}.${extension}`;

    console.log('[uploadFile] Uploading to:', fullStoragePath);

    // Use Replit SDK for upload (has proper permissions)
    try {
      await replitClient.uploadFromBytes(fullStoragePath, fileBuffer);
      console.log('[uploadFile] Upload successful via Replit SDK!');
    } catch (error) {
      console.error('[uploadFile] Failed to upload via Replit SDK:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Verify file exists and set ACL using Google Cloud Storage API
    const { bucketName, objectName } = parseObjectPath(fullStoragePath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    // Set ACL policy (best effort, don't fail upload if this fails)
    try {
      await setObjectAclPolicy(file, {
        owner: userId,
        visibility: visibility,
      });
      console.log('[uploadFile] ACL policy set successfully');
    } catch (aclError) {
      console.warn('[uploadFile] Failed to set ACL policy (non-critical):', aclError);
      // Don't fail the upload if ACL setting fails
    }
    
    // Return both the storage path and object entity path
    const entityPath = `/objects/${objectName.split('/').slice(1).join('/')}`;
    
    return {
      objectPath: entityPath,       // /objects/<uuid>.<ext> for API references
      storageUri: fullStoragePath   // /only-u-media/public/<uuid>.<ext> for storage
    };
  }

  // Gets the object entity file from the object path
  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    console.log('[getObjectEntityFile] entityId:', entityId);
    
    // Try public directories first
    const publicPaths = await this.getPublicObjectSearchPaths();
    
    for (const publicPath of publicPaths) {
      let entityDir = publicPath;
      if (!entityDir.endsWith("/")) {
        entityDir = `${entityDir}/`;
      }
      const objectEntityPath = `${entityDir}${entityId}`;
      const { bucketName, objectName } = parseObjectPath(objectEntityPath);
      console.log('[getObjectEntityFile] Checking bucket:', bucketName, 'object:', objectName);
      const bucket = objectStorageClient.bucket(bucketName);
      const objectFile = bucket.file(objectName);
      
      try {
        // Try to download using Replit SDK to check if file exists
        await replitClient.downloadAsBytes(objectEntityPath);
        console.log('[getObjectEntityFile] File found via Replit SDK');
        return objectFile;
      } catch (error: any) {
        // File doesn't exist, try next path
        console.log('[getObjectEntityFile] File not found at:', objectEntityPath);
      }
    }
    
    // If not found in public, try private directory
    const privateDir = await this.getPrivateObjectDir();
    let entityDir = privateDir;
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    
    try {
      // Try to download using Replit SDK to check if file exists
      await replitClient.downloadAsBytes(objectEntityPath);
      console.log('[getObjectEntityFile] File found in private dir via Replit SDK');
      return objectFile;
    } catch (error: any) {
      // File doesn't exist
      throw new ObjectNotFoundError();
    }
  }

  async normalizeObjectEntityPath(rawPath: string): Promise<string> {
    // Handle Google Cloud Storage signed URLs
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(rawPath);
      const pathParts = url.pathname.split("/").filter(part => part);
      
      // Path format: /bucket-name/object-path
      if (pathParts.length >= 2) {
        // Skip bucket name, get object path
        const objectPath = pathParts.slice(1).join("/");
        
        // Try public directories first
        const publicPaths = await this.getPublicObjectSearchPaths();
        for (const publicPath of publicPaths) {
          let publicDir = publicPath;
          if (publicDir.startsWith("/")) {
            publicDir = publicDir.slice(1);
          }
          if (publicDir.endsWith("/")) {
            publicDir = publicDir.slice(0, -1);
          }
          
          // publicDir format: bucket-name/dir
          const publicDirParts = publicDir.split("/");
          if (publicDirParts.length >= 2) {
            const expectedPrefix = publicDirParts.slice(1).join("/");
            if (objectPath.startsWith(expectedPrefix + "/")) {
              const entityId = objectPath.slice(expectedPrefix.length + 1);
              return `/objects/${entityId}`;
            }
          }
        }
        
        // Try private directory
        const privateDir = await this.getPrivateObjectDir();
        let privateDirPath = privateDir;
        if (privateDirPath.startsWith("/")) {
          privateDirPath = privateDirPath.slice(1);
        }
        if (privateDirPath.endsWith("/")) {
          privateDirPath = privateDirPath.slice(0, -1);
        }
        
        // privateDir format: bucket-name/dir
        const privateDirParts = privateDirPath.split("/");
        if (privateDirParts.length >= 2) {
          const expectedPrefix = privateDirParts.slice(1).join("/");
          if (objectPath.startsWith(expectedPrefix + "/")) {
            const entityId = objectPath.slice(expectedPrefix.length + 1);
            return `/objects/${entityId}`;
          }
        }
      }
    }

    // If already in /objects/ format, return as-is
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    return rawPath;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = await this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}
