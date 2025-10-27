import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Search,
  Download,
  RefreshCw,
  Clock,
  AlertCircle,
  X,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../../hooks/use-toast';
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

const ReportManagement = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'pending', label: '未処理' },
    { value: 'in_progress', label: '処理中' },
    { value: 'resolved', label: '解決済み' },
    { value: 'rejected', label: '却下' }
  ];

  const typeOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'spam', label: 'スパム' },
    { value: 'harassment', label: 'ハラスメント' },
    { value: 'inappropriate', label: '不適切なコンテンツ' },
    { value: 'copyright', label: '著作権侵害' },
    { value: 'fake', label: '偽アカウント' },
    { value: 'other', label: 'その他' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'urgent', label: '緊急' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ];

  // Firestoreから通報データをリアルタイム取得
  useEffect(() => {
    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'other',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          reporterId: data.reporterId || '',
          reporterName: data.reporterName || 'Anonymous',
          reportedUserId: data.reportedUserId || '',
          reportedUserName: data.reportedUserName || 'Unknown',
          reportedContentType: data.reportedContentType || 'post',
          reportedContentTitle: data.reportedContentTitle || '',
          description: data.description || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null,
          resolvedBy: data.resolvedBy || null,
          rejectedAt: data.rejectedAt?.toDate ? data.rejectedAt.toDate() : null,
          rejectedBy: data.rejectedBy || null
        };
      });
      
      setReports(reportsData);
      setLoading(false);
      setIsRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = [...reports];

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(report => report.type === filterType);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(report => report.priority === filterPriority);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, filterStatus, filterType, filterPriority]);

  // 統計を更新
  useEffect(() => {
    const newStats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      rejected: reports.filter(r => r.status === 'rejected').length
    };
    setStats(newStats);
  }, [reports]);

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailModalOpen(true);
  };

  const handleResolveClick = (report) => {
    setSelectedReport(report);
    setResolveModalOpen(true);
  };

  const handleRejectClick = (report) => {
    setSelectedReport(report);
    setRejectModalOpen(true);
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;

    setIsProcessing(true);
    try {
      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: 'admin',
        updatedAt: serverTimestamp()
      });

      toast({
        title: '成功',
        description: `通報ID: ${selectedReport.id} を解決済みにしました`,
      });

      setResolveModalOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: 'エラー',
        description: '通報の解決処理に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectReport = async () => {
    if (!selectedReport) return;

    setIsProcessing(true);
    try {
      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: 'admin',
        updatedAt: serverTimestamp()
      });

      toast({
        title: '成功',
        description: `通報ID: ${selectedReport.id} を却下しました`,
      });

      setRejectModalOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast({
        title: 'エラー',
        description: '通報の却下処理に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
        description="ユーザーからの通報を管理します"
        icon={Flag}
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
          title="総通報数"
          value={<AnimatedNumber value={stats.total} />}
          icon={Flag}
          color="blue"
        />
        <AdminStatsCard
          title="未処理"
          value={<AnimatedNumber value={stats.pending} />}
          icon={AlertCircle}
          color="orange"
        />
        <AdminStatsCard
          title="処理中"
          value={<AnimatedNumber value={stats.inProgress} />}
          icon={Clock}
          color="pink"
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
          color="purple"
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

          <div className="md:w-40">
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

          <div className="md:w-40">
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

          <div className="md:w-40">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              data-testid="select-priority"
            >
              {priorityOptions.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
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
                  通報ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  優先度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  通報者 / 対象
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  通報日
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{report.id.substring(0, 8)}...</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{report.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {typeOptions.find(t => t.value === report.type)?.label || report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                      {priorityOptions.find(p => p.value === report.priority)?.label || report.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.reporterName}</div>
                    <div className="text-xs text-gray-500">→ {report.reportedUserName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {statusOptions.find(s => s.value === report.status)?.label || report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(report)}
                        className="text-blue-600 hover:text-blue-900"
                        data-testid={`button-view-${report.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      {report.status === 'pending' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleResolveClick(report)}
                            className="text-green-600 hover:text-green-900"
                            data-testid={`button-resolve-${report.id}`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRejectClick(report)}
                            className="text-red-600 hover:text-red-900"
                            data-testid={`button-reject-${report.id}`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <AdminEmptyState
            icon={Flag}
            title="通報が見つかりません"
            description="検索条件を変更してください"
          />
        )}
      </AdminTableContainer>

      {/* 詳細モーダル */}
      <AnimatePresence>
        {detailModalOpen && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDetailModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              data-testid="modal-report-detail"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">通報詳細</h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  data-testid="button-close-detail"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">通報ID</h3>
                  <p className="text-gray-900">{selectedReport.id}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">タイプ</h3>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedReport.priority)}`}>
                    {typeOptions.find(t => t.value === selectedReport.type)?.label || selectedReport.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">通報内容</h3>
                  <p className="text-gray-900">{selectedReport.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">通報者</h3>
                    <p className="text-gray-900">{selectedReport.reporterName}</p>
                    <p className="text-xs text-gray-500">ID: {selectedReport.reporterId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">対象ユーザー</h3>
                    <p className="text-gray-900">{selectedReport.reportedUserName}</p>
                    <p className="text-xs text-gray-500">ID: {selectedReport.reportedUserId}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">対象コンテンツ</h3>
                  <p className="text-gray-900">{selectedReport.reportedContentType}: {selectedReport.reportedContentTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">ステータス</h3>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedReport.status)}`}>
                      {statusOptions.find(s => s.value === selectedReport.status)?.label || selectedReport.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">優先度</h3>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedReport.priority)}`}>
                      {priorityOptions.find(p => p.value === selectedReport.priority)?.label || selectedReport.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">通報日時</h3>
                  <p className="text-gray-900">{formatDate(selectedReport.createdAt)}</p>
                </div>

                {selectedReport.resolvedAt && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">解決日時</h3>
                    <p className="text-gray-900">{formatDate(selectedReport.resolvedAt)}</p>
                    <p className="text-xs text-gray-500">処理者: {selectedReport.resolvedBy}</p>
                  </div>
                )}

                {selectedReport.rejectedAt && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">却下日時</h3>
                    <p className="text-gray-900">{formatDate(selectedReport.rejectedAt)}</p>
                    <p className="text-xs text-gray-500">処理者: {selectedReport.rejectedBy}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 transition-colors"
                  data-testid="button-close-detail-footer"
                >
                  閉じる
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 解決確認モーダル */}
      <AnimatePresence>
        {resolveModalOpen && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !isProcessing && setResolveModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              data-testid="modal-confirm-resolve"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">通報を解決済みにする</h2>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  この通報を解決済みにしますか？
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>通報ID:</strong> {selectedReport.id.substring(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>通報者:</strong> {selectedReport.reporterName}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setResolveModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                  data-testid="button-cancel-resolve"
                >
                  キャンセル
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResolveReport}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 rounded-xl text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  data-testid="button-confirm-resolve"
                >
                  {isProcessing ? '処理中...' : '解決済みにする'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 却下確認モーダル */}
      <AnimatePresence>
        {rejectModalOpen && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !isProcessing && setRejectModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              data-testid="modal-confirm-reject"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">通報を却下する</h2>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  この通報を却下しますか？
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>通報ID:</strong> {selectedReport.id.substring(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>通報者:</strong> {selectedReport.reporterName}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRejectModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                  data-testid="button-cancel-reject"
                >
                  キャンセル
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRejectReport}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 rounded-xl text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  data-testid="button-confirm-reject"
                >
                  {isProcessing ? '処理中...' : '却下する'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageContainer>
  );
};

export default ReportManagement;
