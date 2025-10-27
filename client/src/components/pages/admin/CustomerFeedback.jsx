import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  TrendingUp,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Heart,
  Frown,
  Smile,
  Meh,
  Flag,
  Send,
  Reply
} from 'lucide-react';
import { 
  AdminPageContainer, 
  AdminPageHeader, 
  AdminStatsCard, 
  AdminContentCard, 
  AdminLoadingState 
} from './AdminPageContainer';

const AnimatedNumber = ({ value, duration = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / (duration * 1000);
      
      if (progress < 1) {
        setDisplayValue(Math.floor(value * progress));
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

const CustomerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    avgRating: 0,
    responseRate: 0
  });

  const sentimentOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'positive', label: 'ポジティブ' },
    { value: 'negative', label: 'ネガティブ' },
    { value: 'neutral', label: 'ニュートラル' }
  ];

  useEffect(() => {
    loadFeedbacks();
  }, []);

  useEffect(() => {
    let filtered = [...feedbacks];

    if (searchTerm) {
      filtered = filtered.filter(feedback =>
        feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSentiment !== 'all') {
      filtered = filtered.filter(feedback => feedback.sentiment === filterSentiment);
    }

    setFilteredFeedbacks(filtered);
  }, [feedbacks, searchTerm, filterSentiment]);

  useEffect(() => {
    const total = feedbacks.length;
    const positive = feedbacks.filter(f => f.sentiment === 'positive').length;
    const negative = feedbacks.filter(f => f.sentiment === 'negative').length;
    const neutral = feedbacks.filter(f => f.sentiment === 'neutral').length;
    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length : 0;
    const responseRate = feedbacks.length > 0 ? (feedbacks.filter(f => f.response).length / feedbacks.length) * 100 : 0;

    setStats({ total, positive, negative, neutral, avgRating, responseRate });
  }, [feedbacks]);

  const loadFeedbacks = () => {
    const mockFeedbacks = [
      {
        id: 'FB_001',
        type: 'feature',
        sentiment: 'positive',
        priority: 'high',
        title: '動画の再生速度調整機能の追加',
        content: '動画の再生速度を0.5倍、1.25倍、1.5倍、2倍に調整できる機能があると便利です。学習用途で使用しているため、ゆっくり再生したい場面が多くあります。',
        userName: '田中太郎',
        userEmail: 'tanaka@example.com',
        rating: 5,
        tags: ['動画', '機能要望', '学習'],
        createdAt: new Date('2025-01-10T10:00:00'),
        status: 'open',
        response: null,
        votes: 15,
        comments: 3
      },
      {
        id: 'FB_002',
        type: 'bug',
        sentiment: 'negative',
        priority: 'high',
        title: 'ログイン時にエラーが発生する',
        content: 'ログイン時に「サーバーエラーが発生しました」というメッセージが表示され、ログインできません。Chromeブラウザで発生しています。',
        userName: '佐藤花子',
        userEmail: 'sato@example.com',
        rating: 1,
        tags: ['ログイン', 'エラー', 'Chrome'],
        createdAt: new Date('2025-01-09T15:30:00'),
        status: 'in_progress',
        response: 'ご報告いただき、ありがとうございます。現在調査中です。',
        votes: 8,
        comments: 1
      },
      {
        id: 'FB_003',
        type: 'compliment',
        sentiment: 'positive',
        priority: 'low',
        title: 'UIがとても使いやすい',
        content: '他のプラットフォームと比べて、UIがとても直感的で使いやすいです。特に動画の検索機能が優秀だと思います。',
        userName: '山田次郎',
        userEmail: 'yamada@example.com',
        rating: 5,
        tags: ['UI', '使いやすさ', '検索'],
        createdAt: new Date('2025-01-08T14:20:00'),
        status: 'closed',
        response: 'ありがとうございます！今後も使いやすさを追求していきます。',
        votes: 12,
        comments: 0
      }
    ];
    setFeedbacks(mockFeedbacks);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-5 h-5 text-green-500" />;
      case 'negative': return <Frown className="w-5 h-5 text-red-500" />;
      case 'neutral': return <Meh className="w-5 h-5 text-gray-500" />;
      default: return <Meh className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <AdminLoadingState message="フィードバックデータを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="顧客フィードバック"
        description="ユーザーフィードバックの収集・分析・対応管理"
        icon={MessageSquare}
        actions={
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">更新</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">エクスポート</span>
            </motion.button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title="総フィードバック数"
          value={<AnimatedNumber value={stats.total} />}
          icon={MessageSquare}
          color="blue"
        />
        <AdminStatsCard
          title="ポジティブ"
          value={<AnimatedNumber value={stats.positive} />}
          icon={Smile}
          trend="up"
          trendValue="+12.5%"
          color="green"
        />
        <AdminStatsCard
          title="ネガティブ"
          value={<AnimatedNumber value={stats.negative} />}
          icon={Frown}
          trend="down"
          trendValue="-5.3%"
          color="red"
        />
        <AdminStatsCard
          title="平均評価"
          value={stats.avgRating.toFixed(1)}
          icon={Star}
          color="pink"
        />
      </div>

      <AdminContentCard title="検索とフィルター">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="フィードバックを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              data-testid="input-search"
            />
          </div>
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            data-testid="select-sentiment"
          >
            {sentimentOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </AdminContentCard>

      <div className="space-y-4">
        {filteredFeedbacks.map((feedback, index) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <AdminContentCard>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getSentimentIcon(feedback.sentiment)}
                      <h3 className="text-lg font-semibold text-gray-900">{feedback.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                        {feedback.status === 'open' ? '未対応' : feedback.status === 'in_progress' ? '対応中' : '完了'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{feedback.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{feedback.userName}</span>
                      <span>•</span>
                      <span>{feedback.createdAt.toLocaleDateString('ja-JP')}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{feedback.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      data-testid={`button-view-${feedback.id}`}
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      data-testid={`button-reply-${feedback.id}`}
                    >
                      <Reply className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`button-delete-${feedback.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {feedback.response && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                    <div className="flex items-start space-x-2">
                      <Reply className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900 mb-1">管理者からの返信</p>
                        <p className="text-sm text-green-800">{feedback.response}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{feedback.votes} 票</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4" />
                    <span>{feedback.comments} コメント</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-auto">
                    {feedback.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AdminContentCard>
          </motion.div>
        ))}
      </div>
    </AdminPageContainer>
  );
};

export default CustomerFeedback;
