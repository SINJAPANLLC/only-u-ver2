# 🚀 Hostinger VPS クイックデプロイガイド

## 📋 前提条件

### 1. VPSへのSSHアクセス
```bash
# SSH接続をテスト
ssh your_username@only-u.fun
```

### 2. 必要なソフトウェア（VPS上）
```bash
# Node.js 20
node -v  # v20.x.x であること

# PM2
pm2 -v

# Nginx
nginx -v
```

インストールされていない場合：
```bash
# Node.js 20のインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2のインストール
sudo npm install -g pm2

# Nginxのインストール
sudo apt install -y nginx
```

---

## 🎯 デプロイ手順（3ステップ）

### ステップ1: デプロイスクリプトの設定

`deploy.sh`を編集して、VPS接続情報を設定：

```bash
# deploy.shの3行を変更
VPS_USER="your_username"      # ← あなたのVPSユーザー名
VPS_HOST="only-u.fun"          # ← そのまま
VPS_PATH="/var/www/only-u"    # ← デプロイ先のパス
```

### ステップ2: VPS上でディレクトリ作成

```bash
# VPSにSSH接続
ssh your_username@only-u.fun

# デプロイ先ディレクトリを作成
sudo mkdir -p /var/www/only-u
sudo chown -R $USER:$USER /var/www/only-u
```

### ステップ3: デプロイ実行

ローカル（Replit）で実行：

```bash
./deploy.sh
```

**これだけです！** 🎉

デプロイスクリプトが以下を自動実行：
1. ビルド (`npm run build`)
2. ファイル転送 (rsync)
3. Firebase認証情報の転送 (scp)
4. VPS上でのセットアップ (npm install, PM2起動)

---

## 🔧 初回デプロイ後の追加設定

### 1. Nginx設定

VPS上で実行：

```bash
# Nginx設定ファイルを作成
sudo nano /etc/nginx/sites-available/only-u.fun
```

以下の内容を貼り付け：

```nginx
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
        
        # タイムアウト設定（大きなファイルアップロード用）
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # ファイルアップロードサイズの制限
    client_max_body_size 100M;
}
```

設定を有効化：

```bash
# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/only-u.fun /etc/nginx/sites-enabled/

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl reload nginx
```

### 2. SSL証明書の設定

```bash
# Certbotのインストール
sudo apt install certbot python3-certbot-nginx

# SSL証明書の取得
sudo certbot --nginx -d only-u.fun -d www.only-u.fun

# 自動更新の確認
sudo certbot renew --dry-run
```

### 3. 環境変数の設定（VPS上）

```bash
# VPSにSSH接続
ssh your_username@only-u.fun
cd /var/www/only-u

# .env.productionファイルを作成
nano .env.production
```

以下の内容を設定：

```bash
NODE_ENV=production
PORT=5000

# Stripe本番キー
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# Firebase（client/.env.productionから取得）
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=onlyu1020-c6696.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=onlyu1020-c6696
VITE_FIREBASE_STORAGE_BUCKET=onlyu1020-c6696.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

保存後、アプリを再起動：

```bash
pm2 restart only-u
```

---

## 📊 デプロイ後の確認

### ステータス確認

```bash
# PM2でアプリの状態を確認
ssh your_username@only-u.fun 'pm2 list'

# ログを確認
ssh your_username@only-u.fun 'pm2 logs only-u --lines 50'
```

### ブラウザで確認

1. **HTTP**: http://only-u.fun （初回のみ）
2. **HTTPS**: https://only-u.fun （SSL設定後）

### 動作確認項目

- [ ] サイトが表示される
- [ ] ログインできる
- [ ] サムネイル画像が表示される
- [ ] 動画が再生できる
- [ ] Stripe決済が動作する

---

## 🔄 2回目以降のデプロイ

コードを更新した後：

```bash
# ローカル（Replit）で実行
./deploy.sh
```

**これだけ！** 自動的に更新されます。

---

## 🆘 トラブルシューティング

### アプリが起動しない

```bash
# VPS上でログを確認
ssh your_username@only-u.fun
cd /var/www/only-u
pm2 logs only-u --err
```

### サムネイルが404エラー

```bash
# Firebase認証情報を確認
ls -la /var/www/only-u/firebase-admin-key.json

# パーミッションを修正
chmod 600 /var/www/only-u/firebase-admin-key.json

# アプリを再起動
pm2 restart only-u
```

### Nginxエラー

```bash
# エラーログを確認
sudo tail -f /var/log/nginx/error.log

# Nginx設定をテスト
sudo nginx -t
```

---

## 📞 サポート

問題が解決しない場合：

1. **サーバーログ**: `pm2 logs only-u`
2. **Nginxログ**: `/var/log/nginx/error.log`
3. **ブラウザコンソール**: F12で開発者ツール

詳細なデプロイガイドは `DEPLOYMENT_GUIDE.md` を参照してください。
