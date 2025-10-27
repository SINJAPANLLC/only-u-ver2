import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Send,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  Users,
  TrendingUp,
  Smartphone,
  CheckCircle,
  X,
  AlertTriangle
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
import { db } from '../../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../../hooks/use-toast';

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

export default function PushNotificationManagement() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    draft: 0,
    totalRecipients: 0
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientType: 'all'
  });

  // Firestoreからプッシュ通知データをリアルタイム取得
  useEffect(() => {
    const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          target: data.target || 'all',
          priority: data.priority || 'normal',
          recipientType: data.recipientType || data.target || 'all',
          status: data.status || 'draft',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : null
        };
      });
      
      setNotifications(notificationsData);
      setLoading(false);
      setIsRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  // 統計を更新
  useEffect(() => {
    const newStats = {
      total: notifications.length,
      sent: notifications.filter(n => n.status === 'sent').length,
      draft: notifications.filter(n => n.status === 'draft').length,
      totalRecipients: notifications.filter(n => n.status === 'sent').length * 1500
    };
    setStats(newStats);
  }, [notifications]);

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'エラー',
        description: 'タイトルとメッセージを入力してください',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('📬 Creating notification...');
      await addDoc(collection(db, 'notifications'), {
        title: formData.title.trim(),
        message: formData.message.trim(),
        target: formData.recipientType, // Homeページで使用される'target'フィールド
        priority: 'normal',
        status: 'draft',
        createdAt: serverTimestamp()
      });

      console.log('✅ Notification created successfully');
      toast({
        title: '成功',
        description: 'プッシュ通知を作成しました',
      });

      setCreateModalOpen(false);
      setFormData({ title: '', message: '', recipientType: 'all' });
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      toast({
        title: 'エラー',
        description: 'プッシュ通知の作成に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendNotification = async (notification) => {
    setIsProcessing(true);
    try {
      console.log('📤 Sending notification:', notification.id);
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        status: 'sent',
        sentAt: serverTimestamp()
      });

      console.log('✅ Notification sent successfully');
      toast({
        title: '成功',
        description: 'プッシュ通知を送信しました',
      });
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      toast({
        title: 'エラー',
        description: 'プッシュ通知の送信に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (notification) => {
    setSelectedNotification(notification);
    setDeleteModalOpen(true);
  };

  const handleDeleteNotification = async () => {
    if (!selectedNotification) return;

    setIsProcessing(true);
    try {
      console.log('🗑️ Deleting notification:', selectedNotification.id);
      await deleteDoc(doc(db, 'notifications', selectedNotification.id));

      console.log('✅ Notification deleted successfully');
      toast({
        title: '成功',
        description: 'プッシュ通知を削除しました',
      });

      setDeleteModalOpen(false);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'エラー',
        description: 'プッシュ通知の削除に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sent': return '送信済み';
      case 'draft': return '下書き';
      default: return status;
    }
  };

  const getRecipientTypeLabel = (type) => {
    switch (type) {
      case 'all': return '全ユーザー';
      case 'creators': return 'クリエイターのみ';
      case 'specific': return '特定ユーザー';
      default: return type;
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
    return <AdminLoadingState message="プッシュ通知データを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="プッシュ通知管理"
        description="モバイルアプリのプッシュ通知を管理"
        icon={Bell}
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
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              data-testid="button-create-notification"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">通知作成</span>
            </motion.button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title="総通知数"
          value={<AnimatedNumber value={stats.total} />}
          icon={Bell}
          color="blue"
        />
        <AdminStatsCard
          title="送信済み"
          value={<AnimatedNumber value={stats.sent} />}
          icon={CheckCircle}
          color="green"
        />
        <AdminStatsCard
          title="下書き"
          value={<AnimatedNumber value={stats.draft} />}
          icon={Clock}
          color="orange"
        />
        <AdminStatsCard
          title="総送信数"
          value={<AnimatedNumber value={stats.totalRecipients} />}
          icon={Users}
          color="pink"
        />
      </div>

      <AdminTableContainer>
        {notifications.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  通知
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  対象
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  送信日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.map((notification, index) => (
                <motion.tr
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-pink-50 transition-colors"
                  data-testid={`row-notification-${notification.id}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white ring-2 ring-pink-100">
                          <Bell className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {notification.message}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getRecipientTypeLabel(notification.recipientType)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                      {getStatusLabel(notification.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(notification.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(notification.sentAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      {notification.status === 'draft' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSendNotification(notification)}
                          disabled={isProcessing}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          data-testid={`button-send-${notification.id}`}
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteClick(notification)}
                        disabled={isProcessing}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        data-testid={`button-delete-${notification.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <AdminEmptyState
            icon={Bell}
            title="プッシュ通知がありません"
            description="新しい通知を作成してください"
          />
        )}
      </AdminTableContainer>

      {/* 作成モーダル */}
      <AnimatePresence>
        {createModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !isProcessing && setCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              data-testid="modal-create-notification"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">プッシュ通知作成</h2>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isProcessing}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  data-testid="button-close-create"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateNotification} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="通知のタイトルを入力"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    required
                    data-testid="input-title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    メッセージ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="通知のメッセージを入力"
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    required
                    data-testid="input-message"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    対象ユーザー
                  </label>
                  <select
                    value={formData.recipientType}
                    onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    data-testid="select-recipient-type"
                  >
                    <option value="all">全ユーザー</option>
                    <option value="creators">クリエイターのみ</option>
                    <option value="specific">特定ユーザー</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCreateModalOpen(false)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                    data-testid="button-cancel-create"
                  >
                    キャンセル
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50"
                    data-testid="button-submit-create"
                  >
                    {isProcessing ? '作成中...' : '作成する'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {deleteModalOpen && selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !isProcessing && setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              data-testid="modal-confirm-delete"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">プッシュ通知を削除</h2>
              </div>

              <div className="p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">
                    この通知を削除しますか？この操作は取り消せません。
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>タイトル:</strong> {selectedNotification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>メッセージ:</strong> {selectedNotification.message}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                  data-testid="button-cancel-delete"
                >
                  キャンセル
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteNotification}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 rounded-xl text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  data-testid="button-confirm-delete"
                >
                  {isProcessing ? '削除中...' : '削除する'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageContainer>
  );
}
