#!/bin/bash
set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# VPS接続情報（必要に応じて変更）
VPS_USER="root"
VPS_HOST="srv1087935"
VPS_PATH="/var/www/only-u"

echo -e "${GREEN}🚀 Only-U 本番デプロイ開始...${NC}"

# 1. firebase-admin-key.jsonの確認
if [ ! -f "firebase-admin-key.json" ]; then
    echo -e "${RED}❌ エラー: firebase-admin-key.json が見つかりません${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Firebase認証情報を確認${NC}"

# 2. ビルド
echo -e "${YELLOW}📦 ビルド中...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ エラー: ビルドが失敗しました${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ビルド完了${NC}"

# 3. ファイル転送
echo -e "${YELLOW}📤 VPSへファイル転送中...${NC}"

# メインファイルを転送（firebase-admin-key.jsonは除外）
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'firebase-admin-key.json' \
  --exclude '.env*' \
  --exclude 'attached_assets' \
  --exclude '.replit' \
  --exclude '.local' \
  --exclude 'scripts' \
  --exclude '*.log' \
  ./ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo -e "${GREEN}✅ メインファイル転送完了${NC}"

# 4. Firebase認証情報を個別に転送（安全な転送）
echo -e "${YELLOW}🔑 Firebase認証情報を転送中...${NC}"
scp firebase-admin-key.json ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
echo -e "${GREEN}✅ 認証情報転送完了${NC}"

# 5. VPS上でセットアップ
echo -e "${YELLOW}⚙️  VPSでセットアップ中...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /var/www/only-u/

# Node.jsバージョン確認
echo "Node.js version:"
node -v

# 依存関係のインストール（本番用のみ）
npm ci --production

# Firebase認証情報のパーミッション設定
chmod 600 firebase-admin-key.json

# PM2でアプリを再起動
if pm2 list | grep -q "only-u"; then
    echo "既存のアプリを再起動..."
    pm2 restart only-u
else
    echo "新規アプリを起動..."
    pm2 start ecosystem.config.cjs
fi

# PM2の設定を保存
pm2 save

echo "✅ VPSでのセットアップ完了"
ENDSSH

echo -e "${GREEN}✅ デプロイ完了！${NC}"
echo -e "${GREEN}🌐 https://only-u.fun${NC}"
echo ""
echo -e "${YELLOW}📊 ステータス確認:${NC}"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'pm2 list'"
echo ""
echo -e "${YELLOW}📝 ログ確認:${NC}"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs only-u'"
