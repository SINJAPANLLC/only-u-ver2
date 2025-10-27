import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { db } from "../../../firebase";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { 
  AlertTriangle, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Download,
  Flag,
  UserX
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

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        rejected: 0
    });
    const { t } = useTranslation();

    const statusOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'Pending', label: '保留中' },
        { value: 'Resolved', label: '解決済み' },
        { value: 'Rejected', label: '却下' }
    ];

    const typeOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'Spam', label: 'スパム' },
        { value: 'Abuse', label: '不適切' },
        { value: 'Harassment', label: 'ハラスメント' },
        { value: 'Other', label: 'その他' }
    ];

    // フィルタリング
    useEffect(() => {
        let filtered = [...reports];

        if (searchTerm) {
            filtered = filtered.filter(report =>
                report.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(report => report.status === filterStatus);
        }

        if (filterType !== 'all') {
            filtered = filtered.filter(report => report.type === filterType);
        }

        setFilteredReports(filtered);
    }, [reports, searchTerm, filterStatus, filterType]);

    // 統計を更新
    useEffect(() => {
        const newStats = {
            total: reports.length,
            pending: reports.filter(r => r.status === 'Pending').length,
            resolved: reports.filter(r => r.status === 'Resolved').length,
            rejected: reports.filter(r => r.status === 'Rejected').length
        };
        setStats(newStats);
    }, [reports]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setIsRefreshing(true);
            
            // ダミーデータ (実際のFirestoreコレクションに置き換えてください)
            const dummyReports = [
                { id: 101, type: "Spam", user: "John Doe", reportedBy: "User123", status: "Pending", createdAt: new Date() },
                { id: 102, type: "Abuse", user: "Jane Smith", reportedBy: "User456", status: "Resolved", createdAt: new Date() },
                { id: 103, type: "Harassment", user: "Bob Johnson", reportedBy: "User789", status: "Pending", createdAt: new Date() },
                { id: 104, type: "Other", user: "Alice Brown", reportedBy: "User012", status: "Rejected", createdAt: new Date() }
            ];
            
            setReports(dummyReports);
            setFilteredReports(dummyReports);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleResolve = async (reportId) => {
        try {
            setReports(reports.map(report => 
                report.id === reportId 
                    ? { ...report, status: 'Resolved' }
                    : report
            ));
        } catch (error) {
            console.error('Error resolving report:', error);
        }
    };

    const handleReject = async (reportId) => {
        try {
            setReports(reports.map(report => 
                report.id === reportId 
                    ? { ...report, status: 'Rejected' }
                    : report
            ));
        } catch (error) {
            console.error('Error rejecting report:', error);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-yellow-600 bg-yellow-100';
            case 'Resolved': return 'text-green-600 bg-green-100';
            case 'Rejected': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Spam': return 'text-orange-600 bg-orange-100';
            case 'Abuse': return 'text-red-600 bg-red-100';
            case 'Harassment': return 'text-purple-600 bg-purple-100';
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
        return <AdminLoadingState message="通報データを読み込み中..." />;
    }

    return (
        <AdminPageContainer>
            {/* ページヘッダー */}
            <AdminPageHeader
                title="通報管理"
                description="ユーザーからの通報を管理し、適切に対処します"
                icon={AlertTriangle}
                actions={
                    <>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchReports}
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
                    title="総通報数"
                    value={<AnimatedNumber value={stats.total} />}
                    icon={AlertTriangle}
                    color="blue"
                />
                <AdminStatsCard
                    title="保留中"
                    value={<AnimatedNumber value={stats.pending} />}
                    icon={Clock}
                    color="orange"
                />
                <AdminStatsCard
                    title="解決済み"
                    value={<AnimatedNumber value={stats.resolved} />}
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
                                placeholder="通報を検索..."
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

            {/* 通報一覧テーブル */}
            <AdminTableContainer>
                {filteredReports.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    タイプ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ユーザー
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    通報者
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ステータス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReports.map((report, index) => (
                                <motion.tr 
                                    key={report.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="hover:bg-pink-50 transition-colors"
                                    data-testid={`row-report-${report.id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        #{report.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(report.type)}`}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {report.user}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {report.reportedBy}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                                            {statusOptions.find(s => s.value === report.status)?.label || report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {report.status === 'Pending' && (
                                            <div className="flex items-center space-x-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleResolve(report.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    data-testid={`button-resolve-${report.id}`}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleReject(report.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    data-testid={`button-reject-${report.id}`}
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
                        icon={AlertTriangle}
                        title="通報が見つかりません"
                        description="検索条件を変更してください"
                    />
                )}
            </AdminTableContainer>
        </AdminPageContainer>
    );
}
