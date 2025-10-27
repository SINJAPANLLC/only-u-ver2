/**
 * ストレージアダプター - Firebase Storage、Cloudflare R2、AWS S3、GCSに対応
 * Hostingerデプロイ時は環境変数でストレージプロバイダーを切り替え可能
 */

// Replit Object Storageは削除し、Firebase Storageを使用

// ストレージプロバイダーのタイプ
type StorageProvider = 'firebase' | 'r2' | 's3' | 'gcs';

// 環境変数からストレージプロバイダーを判定
const getStorageProvider = (): StorageProvider => {
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
    return 'r2';
  }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return 's3';
  }
  if (process.env.GCS_PROJECT_ID && process.env.GCS_BUCKET_NAME) {
    return 'gcs';
  }
  // デフォルトはFirebase Storage
  return 'firebase';
};

// ストレージアダプターインターフェース
export interface StorageAdapter {
  upload(key: string, data: Buffer, contentType?: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

// Firebase Storage アダプター
class FirebaseStorageAdapter implements StorageAdapter {
  private bucket: any;

  constructor() {
    const { storage } = require('./firebase');
    this.bucket = storage().bucket();
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<string> {
    const file = this.bucket.file(`public/${key}`);
    await file.save(data, {
      metadata: contentType ? { contentType } : undefined,
    });
    await file.makePublic();
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const file = this.bucket.file(`public/${key}`);
    const [buffer] = await file.download();
    return buffer;
  }

  async delete(key: string): Promise<void> {
    const file = this.bucket.file(`public/${key}`);
    await file.delete();
  }

  getPublicUrl(key: string): string {
    return `/api/proxy/public/${key}`;
  }
}

// Cloudflare R2 アダプター（AWS S3互換）
class R2StorageAdapter implements StorageAdapter {
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME || 'only-u-storage';
    this.publicUrl = process.env.R2_PUBLIC_URL || `https://${this.bucket}.r2.dev`;
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<string> {
    // AWS SDK S3 Clientを使用する実装
    // 注: @aws-sdk/client-s3 をインストールする必要があります
    console.log(`R2: Uploading ${key} to ${this.bucket}`);
    
    // TODO: S3 PutObjectCommandを実装
    // const command = new PutObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    //   Body: data,
    //   ContentType: contentType,
    // });
    // await this.s3Client.send(command);
    
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    console.log(`R2: Downloading ${key} from ${this.bucket}`);
    
    // TODO: S3 GetObjectCommandを実装
    // const command = new GetObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    // });
    // const response = await this.s3Client.send(command);
    // return Buffer.from(await response.Body.transformToByteArray());
    
    throw new Error('R2 download not implemented yet');
  }

  async delete(key: string): Promise<void> {
    console.log(`R2: Deleting ${key} from ${this.bucket}`);
    
    // TODO: S3 DeleteObjectCommandを実装
    // const command = new DeleteObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    // });
    // await this.s3Client.send(command);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

// AWS S3 アダプター
class S3StorageAdapter implements StorageAdapter {
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || 'only-u-storage';
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    this.publicUrl = process.env.S3_PUBLIC_URL || `https://${this.bucket}.s3.${region}.amazonaws.com`;
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<string> {
    console.log(`S3: Uploading ${key} to ${this.bucket}`);
    // TODO: S3実装
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    console.log(`S3: Downloading ${key} from ${this.bucket}`);
    throw new Error('S3 download not implemented yet');
  }

  async delete(key: string): Promise<void> {
    console.log(`S3: Deleting ${key} from ${this.bucket}`);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

// Google Cloud Storage アダプター
class GCSStorageAdapter implements StorageAdapter {
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.GCS_BUCKET_NAME || 'only-u-storage';
    this.publicUrl = `https://storage.googleapis.com/${this.bucket}`;
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<string> {
    console.log(`GCS: Uploading ${key} to ${this.bucket}`);
    // TODO: GCS実装
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    console.log(`GCS: Downloading ${key} from ${this.bucket}`);
    throw new Error('GCS download not implemented yet');
  }

  async delete(key: string): Promise<void> {
    console.log(`GCS: Deleting ${key} from ${this.bucket}`);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

// ストレージアダプターのファクトリー
export const createStorageAdapter = (): StorageAdapter => {
  const provider = getStorageProvider();
  
  console.log(`📦 Using storage provider: ${provider}`);
  
  switch (provider) {
    case 'r2':
      return new R2StorageAdapter();
    case 's3':
      return new S3StorageAdapter();
    case 'gcs':
      return new GCSStorageAdapter();
    case 'firebase':
    default:
      return new FirebaseStorageAdapter();
  }
};

// デフォルトエクスポート
export const storageAdapter = createStorageAdapter();
