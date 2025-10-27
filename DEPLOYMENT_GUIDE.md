# Only-U 本番デプロイガイド

## 🚀 Hostinger VPS (only-u.fun) へのデプロイ手順

### 1. ファイルの準備

#### 必要なファイル
```bash
# プロジェクトルートから
dist/                          # ビルド済みファイル
firebase-admin-key.json        # Firebase認証情報
package.json                   # 依存関係
ecosystem.config.cjs           # PM2設定（オプション）
```

### 2. Firebase Service Account Key の配置

**⚠️ 重要：Gitにはpushしません！**

```bash
# ローカルで確認
ls -la firebase-admin-key.json

# VPS上で直接配置（SSHまたはFTP）
# オプション1: SCP
scp firebase-admin-key.json user@only-u.fun:/var/www/only-u/

# オプション2: FTP
# FileZillaなどでアップロード
```

### 3. VPSでのセットアップ

```bash
# SSH接続
ssh user@only-u.fun

# プロジェクトディレクトリへ移動
cd /var/www/only-u/

# Node.js 20がインストール済みか確認
node -v  # v20.x.x であること

# 依存関係のインストール（本番用のみ）
npm ci --production

# Firebase認証情報の確認
ls -la firebase-admin-key.json
# 権限は 600 に設定推奨
chmod 600 firebase-admin-key.json

# PM2でアプリを起動
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 4. 環境変数の設定

VPS上で`.env.production`を作成：

```bash
# /var/www/only-u/.env.production
NODE_ENV=production
PORT=5000

# Firebaseは firebase-admin-key.json から自動読み込み

# Stripe（既存の環境変数を使用）
STRIPE_SECRET_KEY=sk_live_xxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

### 5. Nginx設定

```nginx
# /etc/nginx/sites-available/only-u.fun
server {
    listen 80;
    server_name only-u.fun www.only-u.fun;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Nginx設定を有効化
sudo ln -s /etc/nginx/sites-available/only-u.fun /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL証明書の設定（Let's Encrypt）

```bash
# Certbotのインストール
sudo apt install certbot python3-certbot-nginx

# SSL証明書の取得
sudo certbot --nginx -d only-u.fun -d www.only-u.fun

# 自動更新の設定（既に設定済みの場合はスキップ）
sudo certbot renew --dry-run
```

### 7. デプロイスクリプト（自動化）

**deploy.sh** を作成：

```bash
#!/bin/bash
set -e

echo "🚀 Only-U デプロイ開始..."

# ローカルでビルド
echo "📦 ビルド中..."
npm run build

# VPSにファイルを転送
echo "📤 ファイル転送中..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'firebase-admin-key.json' \
  ./ user@only-u.fun:/var/www/only-u/

# Firebase認証情報を個別に転送
echo "🔑 認証情報を転送中..."
scp firebase-admin-key.json user@only-u.fun:/var/www/only-u/

# VPS上でセットアップ
echo "⚙️  VPSでセットアップ中..."
ssh user@only-u.fun << 'EOF'
cd /var/www/only-u/
npm ci --production
pm2 restart only-u || pm2 start ecosystem.config.cjs
pm2 save
EOF

echo "✅ デプロイ完了！"
echo "🌐 https://only-u.fun"
```

```bash
# 実行権限を付与
chmod +x deploy.sh

# デプロイ実行
./deploy.sh
```

---

## 📋 チェックリスト

### デプロイ前
- [ ] `npm run build` が成功すること
- [ ] `firebase-admin-key.json` が存在すること
- [ ] `.gitignore` に `firebase-admin-key.json` が含まれていること
- [ ] Stripe API Keyが設定されていること

### デプロイ後
- [ ] アプリが起動していること（`pm2 list`）
- [ ] Firebase Storageからファイルが読み込めること
- [ ] サムネイル画像が表示されること
- [ ] Stripe決済が動作すること
- [ ] SSL証明書が有効であること

---

## 🔧 トラブルシューティング

### ファイルが404エラー

```bash
# VPS上でログ確認
pm2 logs only-u

# Firebase認証情報を確認
ls -la firebase-admin-key.json
```

### デプロイ後にサムネイルが表示されない

1. Firebase認証情報が正しく配置されているか確認
2. `firebase-admin-key.json` のパーミッションを確認（600推奨）
3. サーバーログでエラーを確認

### PM2が起動しない

```bash
# エラーログを確認
pm2 logs only-u --err

# アプリを再起動
pm2 restart only-u

# 設定をリロード
pm2 reload only-u
```

---

## 📞 サポート

問題が発生した場合：
1. サーバーログを確認（`pm2 logs`）
2. Nginxログを確認（`/var/log/nginx/error.log`）
3. Firebase Consoleで認証情報を確認
