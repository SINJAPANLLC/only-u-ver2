import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  RefreshCw,
  AlertCircle,
  User,
  CreditCard,
  X,
  Check
} from 'lucide-react';
import { db } from '../../../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { useToast } from '../../../hooks/use-toast';
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminStatsCard,
  AdminContentCard,
  AdminEmptyState,
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

  return <span>{displayValue.toLocaleString()}</span>;
};

export default function TransferRequestManagement() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });

  // Firestoreから振込申請をリアルタイム取得
  useEffect(() => {
    const requestsQuery = query(
      collection(db, 'transferRequests'), 
      orderBy('requestDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          requestDate: doc.data().requestDate?.toDate ? 
            doc.data().requestDate.toDate() : new Date(),
          approvedAt: doc.data().approvedAt?.toDate ? 
            doc.data().approvedAt.toDate() : null,
          rejectedAt: doc.data().rejectedAt?.toDate ? 
            doc.data().rejectedAt.toDate() : null
        }));

        setRequests(requestsData);
        
        const pending = requestsData.filter(r => r.status === 'pending').length;
        const approved = requestsData.filter(r => r.status === 'approved').length;
        const rejected = requestsData.filter(r => r.status === 'rejected').length;
        const totalAmount = requestsData.reduce((sum, r) => sum + (r.netAmount || r.amount || 0), 0);

        setStats({
          total: requestsData.length,
          pending,
          approved,
          rejected,
          totalAmount
        });

        setLoading(false);
        setIsRefreshing(false);
      },
      (error) => {
        console.error('Error loading transfer requests:', error);
        toast({
          title: 'エラー',
          description: '振込申請の読み込みに失敗しました',
          variant: 'destructive'
        });
        setLoading(false);
        setIsRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  // フィルタリング
  useEffect(() => {
    let filtered = [...requests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchTerm]);

  // 承認
  const handleApprove = async (requestId) => {
    if (!window.confirm('この申請を承認しますか？')) {
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'transferRequests', requestId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: 'admin'
      });

      toast({
        title: '成功',
        description: '振込申請を承認しました'
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'エラー',
        description: '承認に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 却下
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: 'エラー',
        description: '却下理由を入力してください',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'transferRequests', selectedRequest.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedReason: rejectReason,
        rejectedBy: 'admin'
      });

      toast({
        title: '成功',
        description: '振込申請を却下しました'
      });

      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'エラー',
        description: '却下に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 詳細表示
  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // 却下モーダルを開く
  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return '承認待ち';
      case 'approved': return '承認済み';
      case 'rejected': return '却下';
      default: return '不明';
    }
  };

  if (loading) {
    return <AdminLoadingState message="振込申請データを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="振込申請管理"
        description="クリエイターからの振込申請を管理"
        icon={DollarSign}
        actions={
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
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <AdminStatsCard
          title="総申請数"
          value={<AnimatedNumber value={stats.total} />}
          icon={DollarSign}
          color="pink"
        />
        <AdminStatsCard
          title="承認待ち"
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
          color="red"
        />
        <AdminStatsCard
          title="総金額"
          value={`¥${stats.totalAmount.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
        />
      </div>

      {/* フィルター */}
      <AdminContentCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ユーザー名で検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              data-testid="input-search"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            data-testid="select-status-filter"
          >
            <option value="all">すべて</option>
            <option value="pending">承認待ち</option>
            <option value="approved">承認済み</option>
            <option value="rejected">却下</option>
          </select>
        </div>
      </AdminContentCard>

      {/* 申請一覧 */}
      <AdminContentCard title="振込申請一覧">
        {filteredRequests.length > 0 ? (
          <div className="space-y-3">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-pink-50 transition-colors group"
                data-testid={`request-item-${request.id}`}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white shadow-md">
                  <User className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {request.userName || 'Unknown User'}
                    </h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    申請日: {request.requestDate.toLocaleDateString('ja-JP')}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      申請額: <span className="font-semibold text-gray-900">¥{(request.amount || 0).toLocaleString()}</span>
                    </span>
                    <span className="text-gray-600">
                      手数料: <span className="font-semibold text-gray-900">¥{(request.processingFee || 0).toLocaleString()}</span>
                    </span>
                    <span className="text-gray-600">
                      振込額: <span className="font-semibold text-pink-600">¥{(request.netAmount || 0).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewDetail(request)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    data-testid={`button-view-${request.id}`}
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>

                  {request.status === 'pending' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(request.id)}
                        disabled={isProcessing}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                        data-testid={`button-approve-${request.id}`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openRejectModal(request)}
                        disabled={isProcessing}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        data-testid={`button-reject-${request.id}`}
                      >
                        <XCircle className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={DollarSign}
            title="振込申請がありません"
            description={searchTerm || statusFilter !== 'all' ? '条件に一致する申請が見つかりませんでした' : 'まだ振込申請がありません'}
          />
        )}
      </AdminContentCard>

      {/* 詳細モーダル */}
      <AnimatePresence>
        {showDetailModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              data-testid="modal-detail"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">振込申請詳細</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-close-detail"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* ステータス */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">ステータス</h3>
                  <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusLabel(selectedRequest.status)}
                  </span>
                </div>

                {/* 申請者情報 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">申請者情報</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ユーザー名:</span>
                      <span className="font-semibold">{selectedRequest.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ユーザーID:</span>
                      <span className="font-mono text-sm">{selectedRequest.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">申請日:</span>
                      <span>{selectedRequest.requestDate.toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>

                {/* 金額詳細 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">金額詳細</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">申請額:</span>
                      <span className="font-semibold">¥{(selectedRequest.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">手数料:</span>
                      <span className="text-red-600">-¥{(selectedRequest.processingFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-900 font-semibold">振込額:</span>
                      <span className="font-bold text-pink-600 text-lg">¥{(selectedRequest.netAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 銀行口座情報 */}
                {selectedRequest.bankInfo && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">銀行口座情報</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">銀行名:</span>
                        <span>{selectedRequest.bankInfo.bankName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">支店名:</span>
                        <span>{selectedRequest.bankInfo.branchName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">口座種別:</span>
                        <span>{selectedRequest.bankInfo.accountType || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">口座番号:</span>
                        <span className="font-mono">{selectedRequest.bankInfo.accountNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">口座名義:</span>
                        <span>{selectedRequest.bankInfo.accountHolder || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 処理情報 */}
                {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">処理情報</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {selectedRequest.status === 'approved' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">承認日時:</span>
                            <span>{selectedRequest.approvedAt?.toLocaleString('ja-JP')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">承認者:</span>
                            <span>{selectedRequest.approvedBy || 'admin'}</span>
                          </div>
                        </>
                      )}
                      {selectedRequest.status === 'rejected' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">却下日時:</span>
                            <span>{selectedRequest.rejectedAt?.toLocaleString('ja-JP')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">却下者:</span>
                            <span>{selectedRequest.rejectedBy || 'admin'}</span>
                          </div>
                          {selectedRequest.rejectedReason && (
                            <div>
                              <span className="text-gray-600">却下理由:</span>
                              <p className="mt-1 text-gray-900">{selectedRequest.rejectedReason}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-close"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 却下モーダル */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
              data-testid="modal-reject"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">申請を却下</h2>
                </div>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-close-reject"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  <span className="font-semibold">{selectedRequest.userName}</span>の振込申請を却下しますか？
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    却下理由 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="却下理由を入力してください"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    data-testid="textarea-reject-reason"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-cancel-reject"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-confirm-reject"
                >
                  {isProcessing ? '却下中...' : '却下する'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageContainer>
  );
}
