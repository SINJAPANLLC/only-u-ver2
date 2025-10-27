# Only-U デプロイ設定ガイド

このガイドでは、Hostingerにデプロイする前に必要なFirebaseとStripeの設定手順を説明します。

---

## 📱 1. Firebase設定

### ステップ1: プロジェクトの確認
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 既存の `onlyu1020-c6696` プロジェクトを選択（または新規作成）

### ステップ2: 認証設定（Authentication）

#### 2-1. 認証ドメインの追加
```
Firebase Console → Authentication → Settings → Authorized domains
```

**追加するドメイン：**
- `only-u.fun`
- `www.only-u.fun`（必要に応じて）

![認証ドメイン設定](https://firebasestorage.googleapis.com/v0/b/[YOUR-PROJECT]/o/docs%2Fauth-domains.png?alt=media)

#### 2-2. メール/パスワード認証の確認
```
Firebase Console → Authentication → Sign-in method
```

**確認事項：**
- ✅ Email/Password が有効になっているか

### ステップ3: Firestore設定（Database）

#### 3-1. セキュリティルールの確認
```
Firebase Console → Firestore Database → Rules
```

**現在のルール確認：**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証されたユーザーのみアクセス可能
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 3-2. インデックスの確認
```
Firebase Console → Firestore Database → Indexes
```

**必要なコンポジットインデックス：**
- コレクション: `posts`
  - フィールド: `createdAt` (降順), `isPublic` (昇順)
- コレクション: `users`
  - フィールド: `createdAt` (降順)

※ アプリ実行時にエラーが出た場合、Firebaseがインデックス作成リンクを提供します

### ステップ4: 環境変数の取得

```
Firebase Console → プロジェクト設定（歯車アイコン）
```

**必要な情報をコピー：**
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=onlyu1020-c6696.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=onlyu1020-c6696
VITE_FIREBASE_STORAGE_BUCKET=onlyu1020-c6696.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### ステップ5: Firebase Admin SDK（サーバーサイド）

#### 5-1. サービスアカウントキーの生成
```
Firebase Console → プロジェクト設定 → サービスアカウント
→ 「新しい秘密鍵の生成」
```

**ダウンロードしたJSONファイルの内容を環境変数に：**
```env
FIREBASE_PROJECT_ID=onlyu1020-c6696
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@onlyu1020-c6696.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE....\n-----END PRIVATE KEY-----\n"
```

⚠️ **重要:** 秘密鍵は絶対にGitHubにコミットしないでください！

---

## 💳 2. Stripe設定

### ステップ1: アカウント確認
1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. アカウントがアクティベート済みか確認

### ステップ2: 本番モードへの切り替え

#### 2-1. ビジネス情報の登録
```
Stripe Dashboard → Settings → Business settings
```

**必要な情報：**
- ビジネス名: `合同会社SIN JAPAN KANAGAWA`
- 住所: `神奈川県愛甲郡愛川町中津7287`
- 電話番号: `050-5526-9906`
- ビジネスタイプ: `会社`

#### 2-2. 銀行口座の登録
```
Stripe Dashboard → Settings → Payouts
```

**銀行情報を入力：**
- 銀行名
- 支店名
- 口座番号
- 口座名義

### ステップ3: APIキーの取得

#### 3-1. 本番APIキーの確認
```
Stripe Dashboard → Developers → API keys
```

**必要なキー：**

**公開可能キー（フロントエンド用）：**
```env
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

**シークレットキー（バックエンド用）：**
```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```

⚠️ **注意:** テストキー（`pk_test_`, `sk_test_`）ではなく、本番キー（`pk_live_`, `sk_live_`）を使用してください！

### ステップ4: Webhookの設定（オプション）

#### 4-1. Webhookエンドポイントの追加
```
Stripe Dashboard → Developers → Webhooks → Add endpoint
```

**設定：**
- エンドポイントURL: `https://only-u.fun/api/stripe/webhook`
- イベント選択:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`

**Webhookシークレットを環境変数に：**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### ステップ5: 製品・価格の確認

```
Stripe Dashboard → Products
```

**サブスクリプションプランが作成されているか確認：**
- ベーシックプラン: ¥500/月
- プレミアムプラン: ¥1,000/月
- VIPプラン: ¥3,000/月

※ 必要に応じてStripe Dashboardで作成してください

---

## 🌐 3. Cloudflare R2設定（ストレージ）

### ステップ1: Cloudflareアカウント作成
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にアクセス
2. アカウント作成（無料）

### ステップ2: R2バケットの作成

#### 2-1. R2の有効化
```
Cloudflare Dashboard → R2 → Purchase R2
```

**料金確認：**
- ストレージ: $0.015/GB/月
- クラスA操作: $4.50/100万リクエスト
- クラスB操作: $0.36/100万リクエスト
- 転送: **無料**（最大の利点！）

#### 2-2. バケット作成
```
R2 → Create bucket
```

**設定：**
- バケット名: `only-u-storage`
- ロケーション: `Asia Pacific (APAC)`（推奨）

### ステップ3: APIトークンの作成

```
R2 → Manage R2 API Tokens → Create API Token
```

**権限設定：**
- Object Read & Write
- 特定のバケット: `only-u-storage`

**取得した情報を環境変数に：**
```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_key_here
R2_BUCKET_NAME=only-u-storage
```

### ステップ4: CORS設定

```
R2 → only-u-storage → Settings → CORS policy
```

**CORS設定を追加：**
```json
[
  {
    "AllowedOrigins": [
      "https://only-u.fun"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### ステップ5: 公開URL設定（オプション）

```
R2 → only-u-storage → Settings → Public Access
```

**カスタムドメイン設定：**
- `cdn.only-u.fun` をR2バケットに接続
- Cloudflare DNSでCNAMEレコードを追加

---

## 📝 4. 環境変数まとめ

Hostingerの `.env.production` ファイルに以下を設定：

```env
# Firebase（フロントエンド）
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=onlyu1020-c6696.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=onlyu1020-c6696
VITE_FIREBASE_STORAGE_BUCKET=onlyu1020-c6696.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin（バックエンド）
FIREBASE_PROJECT_ID=onlyu1020-c6696
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@onlyu1020-c6696.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE....\n-----END PRIVATE KEY-----\n"

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Cloudflare R2
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=only-u-storage

# ドメイン
VITE_API_URL=https://only-u.fun

# セッション
SESSION_SECRET=your_random_secret_at_least_32_characters_long
PORT=5000
NODE_ENV=production
```

---

## ✅ 設定チェックリスト

### Firebase
- [ ] プロジェクトを作成/確認
- [ ] 認証ドメインに `only-u.fun` を追加
- [ ] メール/パスワード認証を有効化
- [ ] Firestoreセキュリティルールを設定
- [ ] サービスアカウントキーをダウンロード
- [ ] 環境変数を `.env.production` に追加

### Stripe
- [ ] アカウントをアクティベート
- [ ] ビジネス情報を登録
- [ ] 銀行口座を登録
- [ ] 本番APIキーを取得
- [ ] Webhook設定（オプション）
- [ ] 環境変数を `.env.production` に追加

### Cloudflare R2
- [ ] Cloudflareアカウントを作成
- [ ] R2バケットを作成
- [ ] APIトークンを生成
- [ ] CORS設定を追加
- [ ] 環境変数を `.env.production` に追加

### ドメイン
- [ ] `only-u.fun` を購入/追加
- [ ] DNSレコードを設定
- [ ] SSL証明書を有効化

---

## 🚨 よくある問題と解決方法

### Firebase: 「Unauthorized domain」エラー
**原因:** 認証ドメインに `only-u.fun` が追加されていない  
**解決:** Firebase Console → Authentication → Settings → Authorized domains に追加

### Stripe: 決済が失敗する
**原因:** テストキーを使用している  
**解決:** 本番キー（`pk_live_`, `sk_live_`）に切り替え

### R2: ファイルアップロードエラー
**原因:** CORS設定が正しくない  
**解決:** CORS設定で `only-u.fun` を許可

### メール認証が届かない
**原因:** SPF/DKIMレコードが未設定  
**解決:** Firebaseのメール設定を確認、DNSレコードを追加

---

## 📞 サポート

設定で困ったことがあれば：

- **Firebase:** https://firebase.google.com/support
- **Stripe:** https://support.stripe.com/
- **Cloudflare:** https://developers.cloudflare.com/r2/

---

**次のステップ:** [README_DEPLOY.md](./README_DEPLOY.md) を確認して、Hostingerへデプロイしましょう！
