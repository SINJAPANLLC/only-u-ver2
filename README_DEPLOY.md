# Only-U Hostingerデプロイクイックスタート

このガイドは、Only-UアプリケーションをHostingerに素早くデプロイするための手順をまとめたものです。

## 🚀 クイックスタート（5ステップ）

### 1️⃣ デプロイ準備チェック
```bash
chmod +x scripts/deploy-check.sh
./scripts/deploy-check.sh
```

### 2️⃣ 環境変数の設定
`.env.production.example` をコピーして `.env.production` を作成：
```bash
cp .env.production.example .env.production
nano .env.production  # または好きなエディタで編集
```

必須の環境変数を設定：
- Firebase設定（Firebaseコンソールから取得）
- Stripe本番キー
- ストレージ設定（Cloudflare R2推奨）

### 3️⃣ 本番ビルド
```bash
npm run build
```

成果物が `dist/` フォルダに生成されます。

### 4️⃣ Hostingerにアップロード

**方法A: FTP/SFTP**
```
アップロードするもの:
├── dist/                 # ビルド済みファイル
├── node_modules/         # 本番依存関係
├── package.json
└── .env.production       # または環境変数をhPanelで設定
```

**方法B: Git（推奨）**
```bash
git add .
git commit -m "Production build"
git push origin main
```

Hostinger SSH:
```bash
cd /home/your-username/domains/only-u.fun/public_html
git clone https://github.com/your-username/only-u.git .
npm install --production
```

### 5️⃣ Hostingerでアプリを起動

Hostinger hPanel:
1. **Node.js** → **Create Application**
2. 設定:
   - Application Root: `/public_html`
   - Application Startup File: `dist/index.js`
   - Node.js Version: **20.x**
3. 環境変数を追加（.env.productionの内容）
4. **Start** をクリック

完了！ `https://only-u.fun` でアクセス可能になります。

---

## 📚 詳細ドキュメント

- **[HOSTINGER_DEPLOY.md](./HOSTINGER_DEPLOY.md)** - 完全なデプロイガイド
- **[scripts/migrate-storage.md](./scripts/migrate-storage.md)** - ストレージ移行手順
- **[.env.production.example](./.env.production.example)** - 環境変数サンプル

## ⚠️ 重要な注意事項

### 1. アダルトコンテンツについて
- ❌ **Replit**: アダルトコンテンツは利用規約で禁止
- ✅ **Hostinger**: アダルトコンテンツ可能（VPS/クラウドホスティング）
- ⚠️ 必ず利用規約を確認してください

### 2. ストレージ移行が必須
現在Replit Object Storageを使用しているため、本番環境では代替ストレージが必要：

**推奨: Cloudflare R2**
- 料金: $0.015/GB/月
- 転送料金無料（最大の利点！）
- S3互換API

詳細: [scripts/migrate-storage.md](./scripts/migrate-storage.md)

### 3. Firebase/Stripeはそのまま使用可能
- Firebase認証とFirestoreはそのまま動作
- Stripe決済も変更不要
- 環境変数を設定するだけでOK

## 💰 コスト見積もり

**Hostingerデプロイの月額コスト:**
- Hostinger VPS: **$4-15/月**
- Cloudflare R2ストレージ: **$1-10/月**（使用量による）
- ドメイン: **$10-15/年**
- Firebase: 無料プラン可能
- Stripe: 取引手数料のみ

**合計: 約 $5-25/月**

## 🔧 トラブルシューティング

### アプリが起動しない
```bash
# SSH接続してログを確認
ssh your-username@only-u.fun
cd public_html
pm2 logs
```

### ポート5000が使用できない
`.env.production`でポートを変更：
```env
PORT=3000
```

### ストレージの問題
1. 環境変数が正しく設定されているか確認
2. `server/storage-adapter.ts`のログを確認
3. Cloudflare R2のCORS設定を確認

## 📞 サポートリソース

- Hostinger サポート: https://www.hostinger.com/support
- Cloudflare R2 ドキュメント: https://developers.cloudflare.com/r2/
- Firebase ドキュメント: https://firebase.google.com/docs
- Stripe ドキュメント: https://stripe.com/docs

## ✅ デプロイチェックリスト

- [ ] `scripts/deploy-check.sh` が成功
- [ ] `.env.production` を作成・設定
- [ ] `npm run build` が成功
- [ ] Hostingerにファイルをアップロード
- [ ] Node.jsアプリケーションを作成
- [ ] 環境変数を設定
- [ ] SSL証明書を設定
- [ ] カスタムドメインを設定（オプション）
- [ ] ストレージ移行完了（R2/S3/GCS）
- [ ] 動作確認（ログイン、アップロード、決済）

---

## 🎉 デプロイ成功！

デプロイが完了したら：
1. HTTPSでサイトにアクセス
2. すべての機能をテスト
3. エラーログを確認
4. パフォーマンスを監視

お疲れ様でした！🎊
