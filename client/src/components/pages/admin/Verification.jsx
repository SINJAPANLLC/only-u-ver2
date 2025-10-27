import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { db } from "../../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { 
  Shield, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Download,
  FileCheck,
  AlertCircle
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

export default function Verification() {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const {t} = useTranslation();

    const statusOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'Pending', label: '保留中' },
        { value: 'Approved', label: '承認済み' },
        { value: 'Rejected', label: '却下' }
    ];

    const typeOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'KYC', label: 'KYC' },
        { value: 'Age Check', label: '年齢確認' },
        { value: 'Identity', label: '本人確認' },
        { value: 'Business', label: 'ビジネス' }
    ];

    // フィルタリング
    useEffect(() => {
        let filtered = [...requests];

        if (searchTerm) {
            filtered = filtered.filter(request =>
                request.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(request => request.status === filterStatus);
        }

        if (filterType !== 'all') {
            filtered = filtered.filter(request => request.type === filterType);
        }

        setFilteredRequests(filtered);
    }, [requests, searchTerm, filterStatus, filterType]);

    // 統計を更新
    useEffect(() => {
        const newStats = {
            total: requests.length,
            pending: requests.filter(r => r.status === 'Pending').length,
            approved: requests.filter(r => r.status === 'Approved').length,
            rejected: requests.filter(r => r.status === 'Rejected').length
        };
        setStats(newStats);
    }, [requests]);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            setIsRefreshing(true);
            
            // ダミーデータ (実際のFirestoreコレクションに置き換えてください)
            const dummyRequests = [
                { id: 1, user: "John Doe", type: "KYC", status: "Pending", createdAt: new Date(), documentUrl: "" },
                { id: 2, user: "Jane Smith", type: "Age Check", status: "Approved", createdAt: new Date(), documentUrl: "" },
                { id: 3, user: "Bob Johnson", type: "Identity", status: "Pending", createdAt: new Date(), documentUrl: "" },
                { id: 4, user: "Alice Brown", type: "Business", status: "Rejected", createdAt: new Date(), documentUrl: "" }
            ];
            
            setRequests(dummyRequests);
            setFilteredRequests(dummyRequests);
        } catch (error) {
            console.error('Error fetching verifications:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleApprove = async (requestId) => {
        try {
            setRequests(requests.map(request => 
                request.id === requestId 
                    ? { ...request, status: 'Approved' }
                    : request
            ));
        } catch (error) {
            console.error('Error approving request:', error);
        }
    };

    const handleReject = async (requestId) => {
        try {
            setRequests(requests.map(request => 
                request.id === requestId 
                    ? { ...request, status: 'Rejected' }
                    : request
            ));
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    useEffect(() => {
        fetchVerifications();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-yellow-600 bg-yellow-100';
            case 'Approved': return 'text-green-600 bg-green-100';
            case 'Rejected': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'KYC': return 'text-blue-600 bg-blue-100';
            case 'Age Check': return 'text-purple-600 bg-purple-100';
            case 'Identity': return 'text-green-600 bg-green-100';
            case 'Business': return 'text-orange-600 bg-orange-100';
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

    if (loading) {
        return <AdminLoadingState message="認証データを読み込み中..." />;
    }

    return (
        <AdminPageContainer>
            {/* ページヘッダー */}
            <AdminPageHeader
                title="本人確認管理"
                description="ユーザーの本人確認リクエストを管理します"
                icon={Shield}
                actions={
                    <>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchVerifications}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatsCard
                    title="総リクエスト"
                    value={<AnimatedNumber value={stats.total} />}
                    icon={FileCheck}
                    color="blue"
                />
                <AdminStatsCard
                    title="保留中"
                    value={<AnimatedNumber value={stats.pending} />}
                    icon={Clock}
                    color="orange"
                />
                <AdminStatsCard
                    title="承認済み"
                    value={<AnimatedNumber value={stats.approved} />}
                    icon={CheckCircle}
                    color="green"
                />
                <AdminStatsCard
                    title="却下"
                    value={<AnimatedNumber value={stats.rejected} />}
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
                                placeholder="リクエストを検索..."
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

                    <div className="md:w-48">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            data-testid="select-type"
                        >
                            {typeOptions.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </AdminContentCard>

            {/* 認証リクエスト一覧テーブル */}
            <AdminTableContainer>
                {filteredRequests.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ユーザー
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    タイプ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ステータス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    申請日
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRequests.map((request, index) => (
                                <motion.tr 
                                    key={request.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="hover:bg-pink-50 transition-colors"
                                    data-testid={`row-verification-${request.id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        #{request.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {request.user}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(request.type)}`}>
                                            {request.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                            {statusOptions.find(s => s.value === request.status)?.label || request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(request.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {request.status === 'Pending' && (
                                            <div className="flex items-center space-x-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleApprove(request.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    data-testid={`button-approve-${request.id}`}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleReject(request.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    data-testid={`button-reject-${request.id}`}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <AdminEmptyState
                        icon={Shield}
                        title="リクエストが見つかりません"
                        description="検索条件を変更してください"
                    />
                )}
            </AdminTableContainer>
        </AdminPageContainer>
    );
}
