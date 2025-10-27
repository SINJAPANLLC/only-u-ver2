// Storage Migration Script: Replit Object Storage → Firebase Storage
// This script migrates all existing files from Replit Object Storage to Firebase Storage

import { Client as ReplitStorageClient } from '@replit/object-storage';
import { storage } from '../server/firebase.js';

async function migrateStorage() {
  console.log('🚀 Starting storage migration from Replit to Firebase...\n');

  try {
    // Initialize Replit Object Storage client
    const replitClient = new ReplitStorageClient();
    const bucket = storage.bucket();

    // Get all files from Replit Object Storage
    console.log('📂 Listing files in Replit Object Storage...');
    const publicFiles = await listReplitFiles(replitClient, 'public');
    const privateFiles = await listReplitFiles(replitClient, 'private');
    
    const allFiles = [...publicFiles, ...privateFiles];
    console.log(`✅ Found ${allFiles.length} files to migrate\n`);

    if (allFiles.length === 0) {
      console.log('⚠️  No files found to migrate. Exiting...');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Migrate each file
    for (let i = 0; i < allFiles.length; i++) {
      const filePath = allFiles[i];
      console.log(`[${i + 1}/${allFiles.length}] Migrating: ${filePath}`);

      try {
        // Download from Replit
        const result = await replitClient.downloadAsBytes(filePath);
        
        if (!result.ok) {
          console.log(`  ⚠️  Skipped: Failed to download`);
          failCount++;
          continue;
        }

        const [fileBuffer] = result.value;
        
        if (!fileBuffer || fileBuffer.length === 0) {
          console.log(`  ⚠️  Skipped: Empty file`);
          continue;
        }

        // Determine content type from extension
        const ext = filePath.toLowerCase().split('.').pop() || '';
        let contentType = 'application/octet-stream';
        if (['mp4', 'mov'].includes(ext)) contentType = 'video/quicktime';
        else if (ext === 'webm') contentType = 'video/webm';
        else if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'gif') contentType = 'image/gif';

        // Upload to Firebase Storage
        const file = bucket.file(filePath);
        await file.save(fileBuffer, {
          contentType,
          metadata: {
            metadata: {
              migratedFrom: 'replit-object-storage',
              migratedAt: new Date().toISOString(),
            }
          }
        });

        // Make public if in public directory
        if (filePath.startsWith('public/')) {
          await file.makePublic();
        }

        console.log(`  ✅ Uploaded successfully (${formatBytes(fileBuffer.length)})`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failCount++;
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed: ${failCount} files`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

async function listReplitFiles(client: ReplitStorageClient, prefix: string): Promise<string[]> {
  try {
    const files: string[] = [];
    const result = await client.list({ prefix });
    
    if (!result.ok) {
      console.warn(`⚠️  Could not list files with prefix "${prefix}"`);
      return [];
    }

    // result.value is an array of file objects
    for (const fileObj of result.value) {
      if (fileObj && typeof fileObj === 'object' && 'key' in fileObj) {
        files.push(fileObj.key as string);
      }
    }
    
    return files;
  } catch (error) {
    console.warn(`⚠️  Could not list files with prefix "${prefix}":`, error);
    return [];
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Run migration
migrateStorage().catch(console.error);
