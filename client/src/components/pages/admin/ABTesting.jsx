import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FlaskConical, 
  Play, 
  CheckCircle,
  Target,
  TrendingUp,
  Plus,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Minus
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

const ABTesting = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    completed: 0,
    successRate: 0,
    avgImprovement: 0
  });

  const statusOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'draft', label: '下書き' },
    { value: 'running', label: '実行中' },
    { value: 'completed', label: '完了' }
  ];

  useEffect(() => {
    loadABTests();
  }, []);

  useEffect(() => {
    let filtered = [...tests];

    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(test => test.status === filterStatus);
    }

    setFilteredTests(filtered);
  }, [tests, searchTerm, filterStatus]);

  useEffect(() => {
    const total = tests.length;
    const running = tests.filter(t => t.status === 'running').length;
    const completed = tests.filter(t => t.status === 'completed').length;
    const successRate = completed > 0 ? (tests.filter(t => t.status === 'completed' && t.winner).length / completed) * 100 : 0;
    const avgImprovement = completed > 0 ? tests.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.improvement || 0), 0) / completed : 0;

    setStats({ total, running, completed, successRate, avgImprovement });
  }, [tests]);

  const loadABTests = () => {
    const mockTests = [
      {
        id: 'AB_001',
        name: 'ランディングページCTAボタン色テスト',
        description: 'CTAボタンの色を変更してコンバージョン率を向上させる',
        hypothesis: 'ピンク色のCTAボタンは青色よりもクリック率が高い',
        status: 'running',
        type: 'conversion',
        variants: [
          {
            id: 'A',
            name: 'コントロール（青）',
            visitors: 10000,
            conversions: 1250,
            conversionRate: 12.5,
            revenue: 125000
          },
          {
            id: 'B',
            name: 'テスト（ピンク）',
            visitors: 10000,
            conversions: 1400,
            conversionRate: 14.0,
            revenue: 140000
          }
        ],
        confidence: 98.5,
        winner: 'B',
        improvement: 12.0
      },
      {
        id: 'AB_002',
        name: 'メール件名テスト',
        description: 'メールマーケティングの件名を最適化',
        hypothesis: '個人的な件名は一般的な件名よりも開封率が高い',
        status: 'completed',
        type: 'email',
        variants: [
          {
            id: 'A',
            name: 'コントロール',
            visitors: 5000,
            conversions: 850,
            conversionRate: 17.0,
            revenue: 85000
          },
          {
            id: 'B',
            name: 'テスト',
            visitors: 5000,
            conversions: 1200,
            conversionRate: 24.0,
            revenue: 120000
          }
        ],
        confidence: 99.8,
        winner: 'B',
        improvement: 41.2
      },
      {
        id: 'AB_003',
        name: '動画プレイヤーUIテスト',
        description: '動画プレイヤーのUIを改善してエンゲージメントを向上',
        hypothesis: '大きな再生ボタンは小さなボタンよりもクリック率が高い',
        status: 'draft',
        type: 'ui',
        variants: [
          {
            id: 'A',
            name: 'コントロール',
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0
          },
          {
            id: 'B',
            name: 'テスト',
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0
          }
        ],
        confidence: 0,
        winner: null,
        improvement: 0
      }
    ];
    setTests(mockTests);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'running': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getImprovementIcon = (improvement) => {
    if (improvement > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (improvement < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return <AdminLoadingState message="A/Bテストデータを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="A/Bテスト管理"
        description="データドリブンな意思決定のためのA/Bテスト管理"
        icon={FlaskConical}
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
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">エクスポート</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              data-testid="button-new-test"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">新規テスト</span>
            </motion.button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <AdminStatsCard
          title="総テスト数"
          value={<AnimatedNumber value={stats.total} />}
          icon={FlaskConical}
          color="blue"
        />
        <AdminStatsCard
          title="実行中"
          value={<AnimatedNumber value={stats.running} />}
          icon={Play}
          color="green"
        />
        <AdminStatsCard
          title="完了"
          value={<AnimatedNumber value={stats.completed} />}
          icon={CheckCircle}
          color="pink"
        />
        <AdminStatsCard
          title="成功率"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={Target}
          color="purple"
        />
        <AdminStatsCard
          title="平均改善率"
          value={`${stats.avgImprovement.toFixed(1)}%`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <AdminContentCard title="検索とフィルター">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="A/Bテストを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              data-testid="input-search"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            data-testid="select-status"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </AdminContentCard>

      <div className="space-y-4">
        {filteredTests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <AdminContentCard>
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                      {test.winner && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          勝者: {test.winner}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{test.description}</p>
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-1">仮説</p>
                      <p className="text-sm text-gray-600 italic">"{test.hypothesis}"</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      data-testid={`button-view-${test.id}`}
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      data-testid={`button-edit-${test.id}`}
                    >
                      <Edit3 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`button-delete-${test.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.variants.map(variant => (
                    <motion.div
                      key={variant.id}
                      whileHover={{ y: -4 }}
                      className={`p-4 rounded-xl ${
                        test.winner === variant.id 
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300' 
                          : 'bg-gradient-to-br from-gray-50 to-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{variant.name}</h5>
                        {test.winner === variant.id && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">訪問者</p>
                          <p className="font-semibold text-gray-900">{variant.visitors.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">コンバージョン</p>
                          <p className="font-semibold text-gray-900">{variant.conversions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">コンバージョン率</p>
                          <p className="font-semibold text-gray-900">{variant.conversionRate.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">収益</p>
                          <p className="font-semibold text-gray-900">¥{variant.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">信頼度</p>
                    <p className="text-2xl font-bold text-gray-900">{test.confidence.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">改善率</p>
                    <div className="flex items-center justify-center space-x-2">
                      {getImprovementIcon(test.improvement)}
                      <span className="text-2xl font-bold text-gray-900">{test.improvement.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">ステータス</p>
                    <p className="text-2xl font-bold text-gray-900">{test.status === 'running' ? '実行中' : test.status === 'completed' ? '完了' : '下書き'}</p>
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

export default ABTesting;
