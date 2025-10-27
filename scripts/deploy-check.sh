#!/bin/bash

# Hostingerデプロイ前チェックスクリプト

echo "🔍 Only-U デプロイ前チェック"
echo "================================"

# Node.jsバージョンチェック
echo ""
echo "📦 Node.jsバージョン:"
node --version
REQUIRED_VERSION=20
CURRENT_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$CURRENT_VERSION" -lt "$REQUIRED_VERSION" ]; then
    echo "❌ エラー: Node.js $REQUIRED_VERSION 以上が必要です"
    exit 1
else
    echo "✅ Node.js バージョンOK"
fi

# 依存関係のチェック
echo ""
echo "📚 依存関係をチェック中..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules が見つかりません。インストールします..."
    npm install
else
    echo "✅ node_modules が存在します"
fi

# 環境変数ファイルのチェック
echo ""
echo "🔐 環境変数ファイルをチェック中..."
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production が見つかりません"
    echo "   .env.production.example を参考に作成してください"
    exit 1
else
    echo "✅ .env.production が存在します"
    
    # 必須環境変数のチェック
    source .env.production
    
    REQUIRED_VARS=(
        "NODE_ENV"
        "PORT"
        "VITE_FIREBASE_API_KEY"
        "VITE_FIREBASE_PROJECT_ID"
        "STRIPE_SECRET_KEY"
        "VITE_STRIPE_PUBLIC_KEY"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "❌ 以下の環境変数が設定されていません:"
        printf '   - %s\n' "${MISSING_VARS[@]}"
        exit 1
    else
        echo "✅ 必須環境変数がすべて設定されています"
    fi
fi

# ビルドテスト
echo ""
echo "🏗️  ビルドをテスト中..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ ビルド成功"
else
    echo "❌ ビルドに失敗しました"
    exit 1
fi

# ビルド成果物のチェック
echo ""
echo "📁 ビルド成果物をチェック中..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js が見つかりません"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "❌ dist/public が見つかりません"
    exit 1
fi

echo "✅ ビルド成果物が正しく生成されています"

# ディスク容量のチェック
echo ""
echo "💾 ディスク容量:"
DIST_SIZE=$(du -sh dist/ | cut -f1)
NODE_MODULES_SIZE=$(du -sh node_modules/ | cut -f1)
echo "   dist/: $DIST_SIZE"
echo "   node_modules/: $NODE_MODULES_SIZE"

# デプロイ準備完了
echo ""
echo "================================"
echo "✅ デプロイ前チェック完了！"
echo ""
echo "次のステップ:"
echo "1. dist/ フォルダと node_modules/ をHostingerにアップロード"
echo "2. .env.production を Hostinger の環境変数に設定"
echo "3. Node.jsアプリケーションを起動: node dist/index.js"
echo ""
echo "詳細は HOSTINGER_DEPLOY.md を参照してください"
echo "================================"
