import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { db } from "../../../firebase";
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  DollarSign, 
  Search, 
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { 
  AdminPageContainer, 
  AdminPageHeader, 
  AdminStatsCard, 
  AdminContentCard, 
  AdminTableContainer, 
  AdminEmptyState, 
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

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        totalRevenue: 0,
        completed: 0,
        pending: 0,
        failed: 0
    });
    const {t} = useTranslation();

    const statusOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'Completed', label: '完了' },
        { value: 'Pending', label: '保留中' },
        { value: 'Failed', label: '失敗' }
    ];

    // フィルタリング
    useEffect(() => {
        let filtered = [...sales];

        if (searchTerm) {
            filtered = filtered.filter(sale =>
                sale.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.user?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(sale => sale.status === filterStatus);
        }

        setFilteredSales(filtered);
    }, [sales, searchTerm, filterStatus]);

    // 統計を更新
    useEffect(() => {
        const totalRevenue = sales.reduce((sum, sale) => 
            sale.status === 'Completed' ? sum + sale.amount : sum, 0
        );
        
        const newStats = {
            total: sales.length,
            totalRevenue: totalRevenue,
            completed: sales.filter(s => s.status === 'Completed').length,
            pending: sales.filter(s => s.status === 'Pending').length,
            failed: sales.filter(s => s.status === 'Failed').length
        };
        setStats(newStats);
    }, [sales]);

    // Firestoreからリアルタイムで取引データを取得
    useEffect(() => {
        const transactionsQuery = query(
            collection(db, 'transactions'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: data.type || 'subscription',
                    user: `${data.userName || 'Unknown'} → ${data.creatorName || 'Unknown'}`,
                    userName: data.userName || 'Unknown',
                    creatorName: data.creatorName || 'Unknown',
                    amount: data.amount || 0,
                    netAmount: data.creatorAmount || 0,
                    status: data.status === 'completed' ? 'Completed' : 
                            data.status === 'pending' ? 'Pending' : 'Failed',
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    sourcePage: data.sourcePage || '不明',
                    description: data.description || ''
                };
            });

            setSales(transactionsData);
            setFilteredSales(transactionsData);
            setLoading(false);
            setIsRefreshing(false);
        }, (error) => {
            console.error('Error fetching sales:', error);
            setLoading(false);
            setIsRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRefresh = () => {
        // リアルタイムリスナー(onSnapshot)を使用しているため、
        // 手動でデータを再取得する必要はありません
        // ユーザーフィードバックのためアニメーションのみ実行
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'text-green-600 bg-green-100';
            case 'Pending': return 'text-yellow-600 bg-yellow-100';
            case 'Failed': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return `¥${amount.toLocaleString()}`;
    };

    if (loading) {
        return <AdminLoadingState message="売上データを読み込み中..." />;
    }

    return (
        <AdminPageContainer>
            {/* ページヘッダー */}
            <AdminPageHeader
                title="売上管理"
                description="取引と売上を管理し、収益を確認します"
                icon={DollarSign}
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

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <AdminStatsCard
                    title="総取引数"
                    value={<AnimatedNumber value={stats.total} />}
                    icon={CreditCard}
                    color="blue"
                />
                <AdminStatsCard
                    title="総売上"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={DollarSign}
                    color="green"
                />
                <AdminStatsCard
                    title="完了"
                    value={<AnimatedNumber value={stats.completed} />}
                    icon={CheckCircle}
                    color="green"
                />
                <AdminStatsCard
                    title="保留中"
                    value={<AnimatedNumber value={stats.pending} />}
                    icon={Clock}
                    color="orange"
                />
                <AdminStatsCard
                    title="失敗"
                    value={<AnimatedNumber value={stats.failed} />}
                    icon={XCircle}
                    color="pink"
                />
            </div>

            {/* フィルターと検索 */}
            <AdminContentCard title="検索・フィルター">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="取引を検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                data-testid="input-search"
                            />
                        </div>
                    </div>

                    <div className="md:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            data-testid="select-status"
                        >
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </AdminContentCard>

            {/* 売上一覧テーブル */}
            <AdminTableContainer>
                {filteredSales.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    取引ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    タイプ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ユーザー
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    金額
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    購入元
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ステータス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    日時
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSales.map((sale, index) => (
                                <motion.tr 
                                    key={sale.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="hover:bg-pink-50 transition-colors"
                                    data-testid={`row-sale-${sale.id}`}
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        <div className="max-w-xs truncate" title={sale.id}>
                                            {sale.id.substring(0, 20)}...
                                        </div>
                                        {sale.description && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {sale.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                            {sale.type === 'subscription' ? 'サブスクリプション' : sale.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="max-w-xs">
                                            {sale.user}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="font-semibold">
                                            {formatCurrency(sale.amount)}
                                        </div>
                                        {sale.netAmount > 0 && (
                                            <div className="text-xs text-gray-500">
                                                純額: {formatCurrency(sale.netAmount)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {sale.sourcePage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                                            {statusOptions.find(s => s.value === sale.status)?.label || sale.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(sale.createdAt).toLocaleString('ja-JP', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-pink-600 hover:text-pink-900 flex items-center space-x-1"
                                            data-testid={`button-view-${sale.id}`}
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>詳細</span>
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <AdminEmptyState
                        icon={DollarSign}
                        title="取引が見つかりません"
                        description="検索条件を変更してください"
                    />
                )}
            </AdminTableContainer>
        </AdminPageContainer>
    );
}
