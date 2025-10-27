# Hostingerへのデプロイガイド

このガイドでは、Only-UアプリケーションをHostingerにデプロイする手順を説明します。

## 📋 前提条件

1. **Hostingerアカウント**
   - VPSプランまたはビジネスプラン（Node.jsサポート必須）
   - 推奨: Cloud Hosting または VPS（Node.js 20対応）

2. **必要なサービス**
   - Firebase プロジェクト（既存のものを使用）
   - Stripe アカウント（既存のものを使用）
   - ストレージサービス（後述）

## 🔧 ステップ1: ストレージの移行

現在Replit Object Storageを使用しているため、代替サービスが必要です：

### オプション A: Cloudflare R2（推奨）
- コスト効率が良い（転送料金無料）
- S3互換API
- 料金: $0.015/GB/月

### オプション B: AWS S3
- 最も一般的
- 料金: $0.023/GB/月 + 転送料金

### オプション C: Google Cloud Storage
- Firebase統合が簡単
- 料金: $0.02/GB/月

**R2の設定手順（推奨）:**
```bash
# 1. Cloudflareアカウントを作成
# 2. R2バケットを作成
# 3. API トークンを取得
# 4. 環境変数に設定（後述）
```

## 🚀 ステップ2: プロジェクトの準備

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 本番ビルドの作成
```bash
npm run build
```

これにより以下が生成されます：
- `dist/index.js` - バックエンドバンドル
- `dist/public/` - フロントエンドアセット

### 3. 動作確認（ローカル）
```bash
npm start
```
http://localhost:5000 でアプリが起動することを確認

## 📦 ステップ3: ファイルのアップロード

### 方法A: FTP/SFTP経由
```
アップロードするファイル/フォルダ:
├── dist/                  # ビルド済みファイル
├── node_modules/          # 本番依存関係のみ
├── package.json
├── package-lock.json
└── .env.production        # 環境変数（後述）
```

### 方法B: Git経由（推奨）
```bash
# 1. GitHubにプッシュ
git add .
git commit -m "Production build"
git push origin main

# 2. HostingerでGitリポジトリをクローン
cd /home/your-username/domains/only-u.fun/public_html
git clone https://github.com/your-username/only-u.git .
npm install --production
```

## 🔐 ステップ4: 環境変数の設定

Hostingerの管理パネルまたは`.env.production`ファイルを作成：

```env
# サーバー設定
NODE_ENV=production
PORT=5000

# Firebase設定
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Stripe設定
STRIPE_SECRET_KEY=sk_live_xxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx

# Cloudflare R2設定（または他のストレージ）
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=only-u-storage

# ドメイン設定
VITE_API_URL=https://only-u.fun
```

## 🌐 ステップ5: Node.jsアプリケーションの設定

### Hostinger hPanelでの設定:

1. **Node.jsアプリケーションの作成**
   - Advanced → Node.js
   - 「Create Application」をクリック
   - Application Root: `/public_html` (または適切なパス)
   - Application URL: `only-u.fun`
   - Application Startup File: `dist/index.js`
   - Node.js Version: 20.x

2. **環境変数の追加**
   - 各環境変数を追加

3. **アプリケーションの起動**
   - 「Start」ボタンをクリック

## 🔄 ステップ6: コード変更（ストレージ移行）

`server/objectStorage.ts`を修正してCloudflare R2を使用：

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

必要なパッケージをインストール：
```bash
npm install @aws-sdk/client-s3
```

## 🔒 ステップ7: SSL証明書の設定

Hostingerは無料のSSL証明書（Let's Encrypt）を提供：
1. hPanel → SSL → Install
2. ドメインを選択
3. 自動更新を有効化

## 🎯 ステップ8: カスタムドメインの設定

1. **ドメインの追加**（Hostingerで購入済みの場合）
   - hPanel → Domains
   - ドメインをNode.jsアプリケーションに割り当て

2. **DNSレコードの確認**
   - A レコード: Hostinger IPアドレスを指定
   - CNAME レコード: `www` → メインドメイン

## 🚦 ステップ9: デプロイ後の確認

### チェックリスト:
- [ ] アプリケーションが起動している
- [ ] HTTPSでアクセス可能
- [ ] ログインが動作する
- [ ] 画像/動画のアップロードが動作する
- [ ] Stripe決済が動作する
- [ ] Firebase接続が正常

### ログの確認:
```bash
# Hostinger SSHアクセス
ssh your-username@your-domain.com
cd /public_html
pm2 logs
```

## 🔄 継続的デプロイ（オプション）

### GitHub Actionsを使用:

`.github/workflows/deploy.yml`を作成：
```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ftp.your-domain.com
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
```

## ⚙️ パフォーマンス最適化

### 1. PM2を使用（推奨）
```bash
npm install -g pm2
pm2 start dist/index.js --name only-u
pm2 save
pm2 startup
```

### 2. Nginx リバースプロキシ（オプション）
より高いパフォーマンスのため、Nginxをリバースプロキシとして設定可能

### 3. CDNの使用
静的アセットにCloudflare CDNを使用

## 🐛 トラブルシューティング

### アプリが起動しない
```bash
# ログを確認
pm2 logs only-u

# 環境変数を確認
pm2 env 0
```

### ポート競合
デフォルトポート5000が使用されている場合：
```bash
# .envでポートを変更
PORT=3000
```

### メモリ不足
```bash
# PM2でメモリ制限を設定
pm2 start dist/index.js --max-memory-restart 1G
```

## 📞 サポート

問題が発生した場合：
1. Hostingerサポート: https://www.hostinger.com/support
2. アプリログを確認: `pm2 logs`
3. Firebaseコンソールでエラーを確認

## 💰 コスト見積もり

### 月額概算:
- Hostinger VPS: $4-15/月
- Cloudflare R2: $1-10/月（使用量による）
- ドメイン: $10-15/年
- Firebase: 無料プラン可能（従量課金）
- Stripe: 取引手数料のみ

**合計: 約 $5-25/月**

---

## 🎉 デプロイ完了！

デプロイが成功したら、以下を確認してください：
1. すべての機能が動作している
2. エラーログがない
3. パフォーマンスが許容範囲内
4. バックアップが設定されている
