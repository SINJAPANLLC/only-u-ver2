import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Play, 
  CheckCircle, 
  RotateCcw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Download,
  RefreshCw,
  CheckSquare,
  Clock
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

const PDCAManagement = () => {
  const [cycles, setCycles] = useState([]);
  const [filteredCycles, setFilteredCycles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    successRate: 0,
    avgCycleTime: 0
  });

  const statusOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'planning', label: '計画中' },
    { value: 'doing', label: '実行中' },
    { value: 'checking', label: '評価中' },
    { value: 'acting', label: '改善中' },
    { value: 'completed', label: '完了' }
  ];

  useEffect(() => {
    loadPDCACycles();
  }, []);

  useEffect(() => {
    let filtered = [...cycles];

    if (searchTerm) {
      filtered = filtered.filter(cycle =>
        cycle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cycle.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(cycle => cycle.status === filterStatus);
    }

    setFilteredCycles(filtered);
  }, [cycles, searchTerm, filterStatus]);

  useEffect(() => {
    const total = cycles.length;
    const active = cycles.filter(c => ['planning', 'doing', 'checking', 'acting'].includes(c.status)).length;
    const completed = cycles.filter(c => c.status === 'completed').length;
    const successRate = completed > 0 ? (cycles.filter(c => c.status === 'completed' && c.success).length / completed) * 100 : 0;
    const avgCycleTime = cycles.length > 0 ? cycles.reduce((sum, c) => sum + c.duration, 0) / cycles.length : 0;

    setStats({ total, active, completed, successRate, avgCycleTime });
  }, [cycles]);

  const loadPDCACycles = () => {
    const mockCycles = [
      {
        id: 'PDCA_001',
        title: 'ユーザーエンゲージメント向上',
        description: 'ユーザーの滞在時間とアクティビティを向上させる',
        category: 'ユーザー体験',
        status: 'doing',
        phase: 'Do',
        priority: 'high',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        duration: 30,
        owner: '田中太郎',
        team: ['佐藤花子', '山田次郎'],
        kpis: [
          { name: 'セッション時間', target: 300, current: 250, unit: '秒' },
          { name: 'ページビュー', target: 5, current: 4.2, unit: 'PV/セッション' },
          { name: 'リピート率', target: 60, current: 45, unit: '%' }
        ],
        actions: [
          { id: '1', title: 'UI改善', status: 'completed', assignee: '佐藤花子' },
          { id: '2', title: 'コンテンツ最適化', status: 'doing', assignee: '山田次郎' },
          { id: '3', title: 'パフォーマンス改善', status: 'pending', assignee: '田中太郎' }
        ],
        success: null
      },
      {
        id: 'PDCA_002',
        title: '収益最適化',
        description: 'クリエイターの収益を最大化する施策の検証',
        category: '収益',
        status: 'checking',
        phase: 'Check',
        priority: 'high',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-01-15'),
        duration: 45,
        owner: '鈴木あい',
        team: ['高橋健一', '山田美咲'],
        kpis: [
          { name: 'ARPU', target: 5000, current: 4200, unit: '円' },
          { name: 'コンバージョン率', target: 8, current: 6.5, unit: '%' },
          { name: 'LTV', target: 50000, current: 38000, unit: '円' }
        ],
        actions: [
          { id: '1', title: '価格戦略見直し', status: 'completed', assignee: '鈴木あい' },
          { id: '2', title: 'プラン最適化', status: 'completed', assignee: '高橋健一' },
          { id: '3', title: '効果測定', status: 'doing', assignee: '山田美咲' }
        ],
        success: true
      },
      {
        id: 'PDCA_003',
        title: 'コンテンツ品質向上',
        description: 'ユーザーが求めるコンテンツの特定と品質向上',
        category: 'コンテンツ',
        status: 'acting',
        phase: 'Act',
        priority: 'medium',
        startDate: new Date('2024-11-01'),
        endDate: new Date('2025-02-01'),
        duration: 90,
        owner: '佐藤次郎',
        team: ['田中花子', '鈴木美咲'],
        kpis: [
          { name: 'コンテンツ満足度', target: 4.5, current: 4.1, unit: '点' },
          { name: 'シェア率', target: 15, current: 12, unit: '%' },
          { name: 'コメント率', target: 8, current: 6, unit: '%' }
        ],
        actions: [
          { id: '1', title: 'ユーザー調査', status: 'completed', assignee: '田中花子' },
          { id: '2', title: 'コンテンツガイドライン策定', status: 'completed', assignee: '佐藤次郎' },
          { id: '3', title: 'クリエイター教育', status: 'doing', assignee: '鈴木美咲' }
        ],
        success: null
      }
    ];
    setCycles(mockCycles);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'doing': return 'bg-yellow-100 text-yellow-700';
      case 'checking': return 'bg-orange-100 text-orange-700';
      case 'acting': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'Plan': return <Target className="w-5 h-5 text-blue-500" />;
      case 'Do': return <Play className="w-5 h-5 text-yellow-500" />;
      case 'Check': return <CheckSquare className="w-5 h-5 text-orange-500" />;
      case 'Act': return <RotateCcw className="w-5 h-5 text-purple-500" />;
      default: return <Target className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <AdminLoadingState message="PDCAサイクルデータを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="PDCA管理"
        description="PDCAサイクルの計画・実行・評価・改善を管理"
        icon={RotateCcw}
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
              data-testid="button-new-cycle"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">新規サイクル</span>
            </motion.button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <AdminStatsCard
          title="総サイクル数"
          value={<AnimatedNumber value={stats.total} />}
          icon={RotateCcw}
          color="blue"
        />
        <AdminStatsCard
          title="進行中"
          value={<AnimatedNumber value={stats.active} />}
          icon={Play}
          color="yellow"
        />
        <AdminStatsCard
          title="完了"
          value={<AnimatedNumber value={stats.completed} />}
          icon={CheckCircle}
          color="green"
        />
        <AdminStatsCard
          title="成功率"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="pink"
        />
        <AdminStatsCard
          title="平均サイクル"
          value={`${Math.round(stats.avgCycleTime)}日`}
          icon={Clock}
          color="purple"
        />
      </div>

      <AdminContentCard title="検索とフィルター">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="PDCAサイクルを検索..."
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
        {filteredCycles.map((cycle, index) => (
          <motion.div
            key={cycle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <AdminContentCard>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getPhaseIcon(cycle.phase)}
                      <h3 className="text-lg font-semibold text-gray-900">{cycle.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(cycle.status)}`}>
                        {cycle.phase}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{cycle.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>担当者: {cycle.owner}</span>
                      <span>•</span>
                      <span>カテゴリ: {cycle.category}</span>
                      <span>•</span>
                      <span>期間: {cycle.duration}日</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      data-testid={`button-view-${cycle.id}`}
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      data-testid={`button-edit-${cycle.id}`}
                    >
                      <Edit3 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`button-delete-${cycle.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cycle.kpis.map((kpi, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -4 }}
                      className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl"
                    >
                      <p className="text-sm text-gray-600 mb-2">{kpi.name}</p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-gray-900">{kpi.current}</p>
                        <p className="text-sm text-gray-500">/ {kpi.target} {kpi.unit}</p>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, (kpi.current / kpi.target) * 100)}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">アクション</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {cycle.actions.map((action, i) => (
                      <div
                        key={action.id}
                        className={`p-3 rounded-xl ${
                          action.status === 'completed' ? 'bg-green-50' :
                          action.status === 'doing' ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{action.title}</p>
                          <CheckCircle className={`w-4 h-4 ${
                            action.status === 'completed' ? 'text-green-500' :
                            action.status === 'doing' ? 'text-blue-500' : 'text-gray-400'
                          }`} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{action.assignee}</p>
                      </div>
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

export default PDCAManagement;
