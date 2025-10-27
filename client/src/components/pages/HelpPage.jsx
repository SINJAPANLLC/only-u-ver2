import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  HelpCircle, 
  Search,
  ChevronRight,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  BookOpen,
  Shield,
  CreditCard,
  Users,
  Settings,
  Bell,
  User,
  Globe,
  Star,
  UserPlus,
  UserMinus,
  Flag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Trash2,
  RefreshCw,
  Calendar,
  FileText,
  Eye,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const HelpPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const helpCategories = [
    { id: 'all', name: 'すべて', icon: HelpCircle, color: 'from-blue-500 to-blue-600' },
    { id: 'getting-started', name: 'はじめに', icon: BookOpen, color: 'from-green-500 to-green-600' },
    { id: 'account', name: 'アカウント', icon: User, color: 'from-purple-500 to-purple-600' },
    { id: 'settings', name: '設定', icon: Settings, color: 'from-orange-500 to-orange-600' },
    { id: 'billing', name: '料金・支払い', icon: CreditCard, color: 'from-red-500 to-red-600' },
    { id: 'safety', name: '安全・プライバシー', icon: Shield, color: 'from-yellow-500 to-yellow-600' },
    { id: 'troubleshooting', name: 'トラブルシューティング', icon: AlertTriangle, color: 'from-pink-500 to-pink-600' }
  ];

  const helpArticles = [
    { id: 'what-is-onlyu', title: 'OnlyUとは？', category: 'getting-started', content: 'OnlyUは、クリエイターとファンが直接つながるプラットフォームです。', icon: Star },
    { id: 'how-to-signup', title: 'アカウント作成方法', category: 'getting-started', content: 'メールアドレスまたは電話番号でアカウントを作成できます。', icon: UserPlus },
    { id: 'first-steps', title: '初回ログイン後の手順', category: 'getting-started', content: 'プロフィール設定、興味のあるジャンル選択、フォローするクリエイターを見つけましょう。', icon: CheckCircle },
    { id: 'profile-setup', title: 'プロフィール設定方法', category: 'account', content: 'プロフィール写真、自己紹介、興味のあるジャンルを設定できます。', icon: User },
    { id: 'change-password', title: 'パスワード変更方法', category: 'account', content: '設定 > アカウント > パスワード変更から変更できます。', icon: Lock },
    { id: 'delete-account', title: 'アカウント削除方法', category: 'account', content: '設定 > アカウント > アカウント削除から削除できます。', icon: Trash2 },
    { id: 'notification-settings', title: '通知設定の変更方法', category: 'settings', content: '設定 > メール通知設定から各種通知をON/OFFできます。', icon: Bell },
    { id: 'language-settings', title: '言語設定の変更方法', category: 'settings', content: '設定 > 言語設定から表示言語を変更できます。', icon: Globe },
    { id: 'privacy-settings', title: 'プライバシー設定', category: 'settings', content: '設定 > プライバシーからプロフィールの公開範囲を設定できます。', icon: Eye },
    { id: 'payment-methods', title: '支払い方法の登録', category: 'billing', content: 'クレジットカード、デビットカード、PayPalで支払いできます。', icon: CreditCard },
    { id: 'subscription-management', title: 'サブスクリプション管理', category: 'billing', content: '設定 > サブスクリプションからプランの変更・解約ができます。', icon: Calendar },
    { id: 'billing-history', title: '支払い履歴の確認', category: 'billing', content: '設定 > 支払い履歴から過去の支払いを確認できます。', icon: FileText },
    { id: 'report-content', title: '不適切なコンテンツの報告', category: 'safety', content: '投稿の「...」メニューから「報告」を選択して報告できます。', icon: Flag },
    { id: 'block-user', title: 'ユーザーのブロック方法', category: 'safety', content: 'プロフィールページの「...」メニューから「ブロック」を選択できます。', icon: UserMinus },
    { id: 'privacy-policy', title: 'プライバシーポリシー', category: 'safety', content: '個人情報の取り扱いについて詳しく説明しています。', icon: Shield },
    { id: 'login-issues', title: 'ログインできない', category: 'troubleshooting', content: 'パスワードリセット、アカウント復旧手順をご案内します。', icon: AlertTriangle },
    { id: 'app-crashes', title: 'アプリがクラッシュする', category: 'troubleshooting', content: 'アプリの再起動、最新版への更新を試してください。', icon: RefreshCw },
    { id: 'slow-loading', title: '読み込みが遅い', category: 'troubleshooting', content: 'インターネット接続、アプリのキャッシュクリアを試してください。', icon: Clock }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (categoryId) => {
    const category = helpCategories.find(cat => cat.id === categoryId);
    return category ? category.color : 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg"
      >
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-white mr-4 p-2 hover:bg-white/20 rounded-full transition-colors" data-testid="button-back">
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex items-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <HelpCircle className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">ヘルプ</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-xl border-2 border-pink-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
            <input type="text" placeholder="ヘルプを検索..." className="w-full pl-12 pr-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="input-search" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-xl border-2 border-pink-100">
          <h2 className="text-xl font-bold mb-5 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">カテゴリ</h2>
          <div className="grid grid-cols-2 gap-3">
            {helpCategories.map((category, index) => (
              <motion.button key={category.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * index }} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedCategory(category.id)} className={`p-4 rounded-xl text-left transition-all shadow-md ${selectedCategory === category.id ? `bg-gradient-to-r ${category.color} text-white` : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700'}`} data-testid={`button-category-${category.id}`}>
                <div className="flex items-center space-x-3">
                  <category.icon className="w-6 h-6" />
                  <span className="font-bold">{category.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-xl border-2 border-pink-100">
          <div className="p-5 border-b-2 border-pink-100">
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
              {selectedCategory === 'all' ? 'すべての記事' : helpCategories.find(cat => cat.id === selectedCategory)?.name}
              <span className="text-sm text-gray-500 ml-2">({filteredArticles.length}件)</span>
            </h2>
          </div>
          
          <AnimatePresence>
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article, index) => {
                const ArticleIcon = article.icon;
                const categoryColor = getCategoryColor(article.category);
                
                return (
                  <motion.div key={article.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.03 }} whileHover={{ x: 5, backgroundColor: 'rgba(249, 168, 212, 0.1)' }} className="p-5 border-b border-pink-50 last:border-b-0 cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }} className={`w-12 h-12 bg-gradient-to-br ${categoryColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <ArticleIcon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">{article.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{article.content}</p>
                        <span className={`inline-block text-xs px-3 py-1 bg-gradient-to-r ${categoryColor} text-white rounded-full font-bold`}>
                          {helpCategories.find(cat => cat.id === article.category)?.name}
                        </span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-pink-400 flex-shrink-0" />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-pink-300" />
                <p className="text-gray-600 font-medium">該当する記事が見つかりませんでした。</p>
                <p className="text-sm text-gray-500 mt-1">検索キーワードを変更してお試しください。</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 shadow-xl border-2 border-pink-100">
          <h2 className="text-xl font-bold mb-5 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">サポートに連絡</h2>
          <div className="space-y-3">
            {[
              { icon: MessageCircle, label: 'チャットサポート', color: 'from-blue-500 to-blue-600' },
              { icon: Mail, label: 'メールサポート', color: 'from-green-500 to-green-600' },
              { icon: Phone, label: '電話サポート', color: 'from-purple-500 to-purple-600' }
            ].map((item, index) => (
              <motion.button key={index} whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${item.color} text-white rounded-xl shadow-md transition-all`}>
                <div className="flex items-center space-x-3">
                  <item.icon className="w-6 h-6" />
                  <span className="font-bold">{item.label}</span>
                </div>
                <ExternalLink className="w-5 h-5" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 rounded-2xl p-6 relative overflow-hidden">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-pink-900 mb-4 flex items-center">
              <Sparkles className="w-6 h-6 mr-2" />
              よくある質問
            </h2>
            <div className="space-y-4">
              {[
                { q: 'Q. アカウントを削除した後、復旧できますか？', a: 'A. アカウント削除後30日以内であれば復旧可能です。サポートまでお問い合わせください。', color: 'pink' },
                { q: 'Q. 支払い方法を変更するには？', a: 'A. 設定 > 支払い方法から変更できます。', color: 'blue' },
                { q: 'Q. 通知が届きません', a: 'A. 設定 > メール通知設定で通知が有効になっているか確認してください。', color: 'green' }
              ].map((faq, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.1 }} whileHover={{ x: 5 }} className={`border-l-4 border-${faq.color}-500 pl-4 bg-white/50 p-3 rounded-r-xl`}>
                  <h3 className="font-bold text-gray-900 mb-1">{faq.q}</h3>
                  <p className="text-sm text-gray-700">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default HelpPage;
