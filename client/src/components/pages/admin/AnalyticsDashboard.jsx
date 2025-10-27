import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  DollarSign,
  RefreshCw,
  Download,
  Activity
} from 'lucide-react';
import { 
  AdminPageContainer, 
  AdminPageHeader, 
  AdminStatsCard, 
  AdminContentCard, 
  AdminLoadingState 
} from './AdminPageContainer';

// カウントアップアニメーションコンポーネント
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

  return <span>{displayValue.toLocaleString()}</span>;
};

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 125430,
      activeUsers: 8940,
      totalRevenue: 12500000,
      totalViews: 2500000,
      totalPosts: 15680,
      totalLikes: 890000,
      totalComments: 125000
    },
    rankings: {
      topCreators: [
        { id: '1', name: '田中花子', username: 'hanako_tanaka', followers: 125000, revenue: 2500000, posts: 156, engagement: 8.5 },
        { id: '2', name: '佐藤美咲', username: 'misaki_sato', followers: 98000, revenue: 1800000, posts: 134, engagement: 7.8 },
        { id: '3', name: '鈴木あい', username: 'ai_suzuki', followers: 87000, revenue: 1650000, posts: 98, engagement: 9.2 },
        { id: '4', name: '高橋ゆき', username: 'yuki_takahashi', followers: 76000, revenue: 1400000, posts: 112, engagement: 7.5 },
        { id: '5', name: '山田みく', username: 'miku_yamada', followers: 65000, revenue: 1200000, posts: 89, engagement: 8.1 }
      ],
      topPosts: [
        { id: '1', title: '特別な動画', creator: '田中花子', views: 125000, likes: 8900, comments: 450, revenue: 125000 },
        { id: '2', title: '限定コンテンツ', creator: '佐藤美咲', views: 98000, likes: 7200, comments: 320, revenue: 98000 },
        { id: '3', title: '新作動画', creator: '鈴木あい', views: 87000, likes: 6500, comments: 280, revenue: 87000 },
        { id: '4', title: 'コラボ動画', creator: '高橋ゆき', views: 76000, likes: 5800, comments: 210, revenue: 76000 },
        { id: '5', title: 'ライブ配信', creator: '山田みく', views: 65000, likes: 4900, comments: 180, revenue: 65000 }
      ]
    }
  });

  const timeRanges = [
    { value: '1d', label: '1日' },
    { value: '7d', label: '7日' },
    { value: '30d', label: '30日' },
    { value: '90d', label: '90日' },
    { value: '1y', label: '1年' }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  if (loading) {
    return <AdminLoadingState message="アナリティクスデータを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      {/* ページヘッダー */}
      <AdminPageHeader
        title="アナリティクスダッシュボード"
        description="詳細なアナリティクスデータと統計情報"
        icon={BarChart3}
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

      {/* 期間選択 */}
      <AdminContentCard title="期間選択">
        <div className="flex flex-wrap gap-3">
          {timeRanges.map((range) => (
            <motion.button
              key={range.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              data-testid={`button-timerange-${range.value}`}
            >
              {range.label}
            </motion.button>
          ))}
        </div>
      </AdminContentCard>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title="総ユーザー数"
          value={<AnimatedNumber value={analytics.overview.totalUsers} />}
          icon={Users}
          trend="up"
          trendValue="+12.5%"
          color="blue"
        />
        <AdminStatsCard
          title="アクティブユーザー"
          value={<AnimatedNumber value={analytics.overview.activeUsers} />}
          icon={Activity}
          trend="up"
          trendValue="+8.3%"
          color="green"
        />
        <AdminStatsCard
          title="総収益"
          value={`¥${analytics.overview.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="+15.2%"
          color="pink"
        />
        <AdminStatsCard
          title="総閲覧数"
          value={<AnimatedNumber value={analytics.overview.totalViews} />}
          icon={Eye}
          trend="up"
          trendValue="+18.7%"
          color="purple"
        />
      </div>

      {/* エンゲージメント統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminStatsCard
          title="総投稿数"
          value={<AnimatedNumber value={analytics.overview.totalPosts} />}
          icon={MessageCircle}
          trend="up"
          trendValue="+5.4%"
          color="orange"
        />
        <AdminStatsCard
          title="総いいね数"
          value={<AnimatedNumber value={analytics.overview.totalLikes} />}
          icon={Heart}
          trend="up"
          trendValue="+22.1%"
          color="pink"
        />
        <AdminStatsCard
          title="総コメント数"
          value={<AnimatedNumber value={analytics.overview.totalComments} />}
          icon={MessageCircle}
          trend="up"
          trendValue="+9.8%"
          color="blue"
        />
      </div>

      {/* ランキングセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* トップクリエイター */}
        <AdminContentCard title="トップクリエイター">
          <div className="space-y-4">
            {analytics.rankings.topCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-pink-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{creator.name}</p>
                    <p className="text-xs text-gray-500">@{creator.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatNumber(creator.followers)}</p>
                  <p className="text-xs text-gray-500">フォロワー</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AdminContentCard>

        {/* トップ投稿 */}
        <AdminContentCard title="トップ投稿">
          <div className="space-y-4">
            {analytics.rankings.topPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-pink-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-500">by {post.creator}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatNumber(post.views)}</p>
                  <p className="text-xs text-gray-500">再生数</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AdminContentCard>
      </div>

      {/* 成長トレンド */}
      <AdminContentCard title="成長トレンド">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ユーザー成長率</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">+12.5%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">収益成長率</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">+15.2%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-pink-600" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">エンゲージメント成長率</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">+18.7%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>
        </div>
      </AdminContentCard>
    </AdminPageContainer>
  );
};

export default AnalyticsDashboard;
