# 🚀 デプロイ前クイック設定チェックリスト

このチェックリストは、Hostingerデプロイ前に必要な設定を順番に確認するためのものです。

---

## ⏱️ 所要時間: 約30分

---

## 1️⃣ Firebase設定（10分）

### やること
```
✅ Firebase Console にログイン
   👉 https://console.firebase.google.com/

✅ プロジェクト選択: onlyu1020-c6696

✅ 認証ドメイン追加
   Authentication → Settings → Authorized domains
   → 「only-u.fun」を追加

✅ 環境変数をコピー
   プロジェクト設定（歯車アイコン）→ 全般
   → 以下をメモ帳にコピー：
   
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=

✅ サービスアカウントキー取得
   プロジェクト設定 → サービスアカウント
   → 「新しい秘密鍵の生成」
   → JSONファイルをダウンロード
```

**メモ欄:**
```
VITE_FIREBASE_API_KEY=_________________
VITE_FIREBASE_PROJECT_ID=_________________
```

---

## 2️⃣ Stripe設定（10分）

### やること
```
✅ Stripe Dashboard にログイン
   👉 https://dashboard.stripe.com/

✅ ビジネス情報登録
   Settings → Business settings
   → 会社名、住所、電話番号を入力

✅ 銀行口座登録
   Settings → Payouts
   → 銀行情報を入力

✅ 本番APIキー取得
   Developers → API keys
   → 「本番データを表示」に切り替え
   → 以下をコピー：
   
   公開可能キー: pk_live_...
   シークレットキー: sk_live_...
   
   ⚠️ sk_live_ は絶対に秘密に！
```

**メモ欄:**
```
VITE_STRIPE_PUBLIC_KEY=pk_live__________________
STRIPE_SECRET_KEY=sk_live__________________
```

---

## 3️⃣ Cloudflare R2設定（10分）

### やること
```
✅ Cloudflareアカウント作成
   👉 https://dash.cloudflare.com/

✅ R2を購入（無料でOK）
   R2 → Purchase R2 → Continue

✅ バケット作成
   Create bucket
   → 名前: only-u-storage
   → ロケーション: Asia Pacific (APAC)

✅ APIトークン作成
   Manage R2 API Tokens → Create API Token
   → 権限: Admin Read & Write
   → Apply to specific buckets: only-u-storage
   → 以下をコピー：
   
   Access Key ID: ...
   Secret Access Key: ...
   Account ID: ...（URL内に表示）

✅ CORS設定
   only-u-storage → Settings → CORS policy
   → 以下のJSONを追加：
```

```json
[
  {
    "AllowedOrigins": ["https://only-u.fun"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**メモ欄:**
```
R2_ACCOUNT_ID=_________________
R2_ACCESS_KEY_ID=_________________
R2_SECRET_ACCESS_KEY=_________________
```

---

## 4️⃣ 環境変数ファイル作成

### やること
```
✅ .env.production.example をコピー
   cp .env.production.example .env.production

✅ 上記でコピーした値をすべて入力
   nano .env.production
   （またはテキストエディタで編集）

✅ 必須項目チェック
   - Firebase API Key ✅
   - Firebase Project ID ✅
   - Stripe Public Key ✅
   - Stripe Secret Key ✅
   - R2 Account ID ✅
   - R2 Access Key ID ✅
   - R2 Secret Access Key ✅
   - VITE_API_URL=https://only-u.fun ✅
```

---

## 5️⃣ ビルドテスト

### やること
```
✅ デプロイ前チェック実行
   chmod +x scripts/deploy-check.sh
   ./scripts/deploy-check.sh

✅ エラーがないか確認
   すべて ✓ になっていればOK！
```

---

## 6️⃣ Hostinger準備

### やること
```
✅ Hostingerアカウント作成
   👉 https://www.hostinger.jp/

✅ VPSまたはクラウドホスティングプラン購入
   推奨: KVM 1（月額 ¥500-1,000程度）

✅ ドメイン追加
   hPanel → Domains → Add Domain
   → only-u.fun

✅ Node.js 20インストール確認
   SSH接続してバージョン確認:
   node --version  # v20.x が表示されればOK
```

---

## ✅ 最終チェックリスト

デプロイ前に、すべてチェックがついているか確認：

### Firebase
- [ ] 認証ドメインに `only-u.fun` を追加済み
- [ ] Firebase環境変数を `.env.production` に追加済み
- [ ] サービスアカウントキーをダウンロード済み

### Stripe
- [ ] ビジネス情報を登録済み
- [ ] 銀行口座を登録済み
- [ ] 本番APIキーを取得済み
- [ ] Stripe環境変数を `.env.production` に追加済み

### Cloudflare R2
- [ ] バケット `only-u-storage` を作成済み
- [ ] APIトークンを生成済み
- [ ] CORS設定を追加済み
- [ ] R2環境変数を `.env.production` に追加済み

### ビルド
- [ ] `./scripts/deploy-check.sh` が成功
- [ ] `.env.production` にすべての環境変数を設定済み

### Hostinger
- [ ] アカウント作成済み
- [ ] ドメイン `only-u.fun` を追加済み
- [ ] Node.js 20がインストール済み

---

## 🎉 完了したら

すべてのチェックが完了したら、次のステップへ：

```bash
# ビルド
npm run build

# Hostingerにアップロード
# 詳細は README_DEPLOY.md を参照
```

---

## 💡 ヒント

### Firebase環境変数が見つからない
→ Firebase Console → プロジェクト設定（歯車アイコン）→ 全般

### Stripe本番キーが見えない
→ Stripe Dashboard → 右上の「本番データを表示」をONに

### R2のAccount IDがわからない
→ ブラウザのURLを確認: `https://dash.cloudflare.com/{ACCOUNT_ID}/r2`

### .env.productionの編集方法
```bash
# Linux/Mac
nano .env.production

# Windows
notepad .env.production
```

---

## ❓ 困ったら

詳細な手順は以下を参照：
- **Firebase/Stripe/R2の詳細:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **デプロイ手順:** [README_DEPLOY.md](./README_DEPLOY.md)
- **完全ガイド:** [HOSTINGER_DEPLOY.md](./HOSTINGER_DEPLOY.md)

---

**設定完了おめでとうございます！🎊**
