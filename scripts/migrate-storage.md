# Replit Object Storage → Cloudflare R2 移行ガイド

このガイドでは、既存のReplit Object Storageのデータを Cloudflare R2（またはAWS S3）に移行する手順を説明します。

## 📋 前提条件

- Cloudflareアカウント
- R2へのアクセス権限
- 既存のReplit Object Storageデータ

## 🚀 ステップ1: Cloudflare R2の設定

### 1. R2バケットの作成

1. Cloudflareダッシュボードにログイン
2. **R2** セクションに移動
3. **Create bucket** をクリック
4. バケット名を入力（例: `only-u-storage`）
5. リージョンを選択（推奨: Asia Pacific）
6. **Create bucket** をクリック

### 2. APIトークンの作成

1. R2 → **Manage R2 API Tokens**
2. **Create API token** をクリック
3. 権限を設定:
   - Object Read & Write
   - Bucket: `only-u-storage`（作成したバケット）
4. **Create API Token** をクリック
5. 以下の情報を保存:
   ```
   Access Key ID: xxxxxxxxxxxxx
   Secret Access Key: xxxxxxxxxxxxx
   Account ID: xxxxxxxxxxxxx
   ```

### 3. 公開URLの設定（オプション）

1. バケット設定 → **Settings**
2. **Public Access** を有効化（必要に応じて）
3. カスタムドメインを設定可能: `https://cdn.only-u.fun`

## 🔧 ステップ2: 環境変数の設定

`.env.production`に以下を追加：

```env
# Cloudflare R2設定
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=only-u-storage
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

## 📦 ステップ3: AWS SDK S3のインストール

R2はAWS S3互換APIを使用するため、AWS SDKをインストール：

```bash
npm install @aws-sdk/client-s3
```

## 🔄 ステップ4: ストレージアダプターの実装

`server/storage-adapter.ts`に実装を追加：

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

class R2StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME!;
    this.publicUrl = process.env.R2_PUBLIC_URL!;
    
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    });
    
    await this.s3Client.send(command);
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    const response = await this.s3Client.send(command);
    const bytes = await response.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    await this.s3Client.send(command);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
```

## 🗂️ ステップ5: 既存データの移行

### オプション A: 手動移行（少量のファイル）

Replit Object Storageから手動でダウンロードし、R2にアップロード

### オプション B: スクリプトによる自動移行

移行スクリプトを作成（`scripts/migrate-data.ts`）:

```typescript
import { Client as ReplitClient } from '@replit/object-storage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const replitClient = new ReplitClient();
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function migrateFile(key: string) {
  try {
    // Replitから読み取り
    const data = await replitClient.downloadAsBytes(`public/${key}`);
    
    // R2にアップロード
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(data),
    });
    
    await s3Client.send(command);
    console.log(`✅ Migrated: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to migrate ${key}:`, error);
  }
}

async function main() {
  // Firestoreから全ファイルのリストを取得
  // 各ファイルを移行
  const files = [
    // ファイルリスト
  ];
  
  for (const file of files) {
    await migrateFile(file);
  }
  
  console.log('Migration complete!');
}

main();
```

実行：
```bash
npm install tsx
npx tsx scripts/migrate-data.ts
```

## 🧪 ステップ6: テスト

### 1. ローカルでテスト
```bash
# .env.productionを使用
npm run build
npm start
```

### 2. アップロードテスト
- 新しい画像/動画をアップロード
- R2にファイルが保存されることを確認

### 3. ダウンロードテスト
- アップロードしたファイルを表示
- URLが正しく生成されることを確認

## 📊 ステップ7: Firestoreの更新

既存の投稿のファイルURLを更新：

```typescript
import { db } from './firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function updatePostUrls() {
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);
  
  for (const postDoc of snapshot.docs) {
    const data = postDoc.data();
    
    if (data.files && Array.isArray(data.files)) {
      const updatedFiles = data.files.map(file => ({
        ...file,
        url: file.url.replace('/api/proxy/public/', `${process.env.R2_PUBLIC_URL}/`),
        secure_url: file.secure_url.replace('/api/proxy/public/', `${process.env.R2_PUBLIC_URL}/`),
      }));
      
      await updateDoc(doc(db, 'posts', postDoc.id), {
        files: updatedFiles
      });
      
      console.log(`Updated post: ${postDoc.id}`);
    }
  }
}
```

## 💰 コスト比較

### Cloudflare R2:
- ストレージ: $0.015/GB/月
- データ転送: **無料**（R2の最大の利点）
- 操作: $4.50/100万リクエスト

### AWS S3:
- ストレージ: $0.023/GB/月
- データ転送: $0.09/GB（転送料金が高い）
- 操作: $0.40/100万リクエスト

### 100GBのデータ、10TB/月の転送の場合：
- **R2**: 約 $1.50/月
- **S3**: 約 $922/月

→ R2が圧倒的にコスト効率が良い！

## ⚠️ 注意事項

### 1. CORS設定
R2でCORSを有効化：
```json
{
  "AllowedOrigins": ["https://only-u.fun"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

### 2. キャッシュ設定
Cloudflare CDNを活用してキャッシュを最適化

### 3. バックアップ
定期的なバックアップを設定（R2 → S3など）

## 🎉 移行完了チェックリスト

- [ ] R2バケットの作成
- [ ] APIトークンの取得・設定
- [ ] AWS SDK S3のインストール
- [ ] ストレージアダプターの実装
- [ ] 既存データの移行
- [ ] アップロード/ダウンロードのテスト
- [ ] FirestoreのURL更新
- [ ] CORS設定
- [ ] 本番環境でのテスト

---

## 📞 サポート

問題が発生した場合：
1. Cloudflareドキュメント: https://developers.cloudflare.com/r2/
2. R2コミュニティ: https://community.cloudflare.com/
