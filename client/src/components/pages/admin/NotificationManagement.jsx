import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Send, 
  Eye, 
  Trash2, 
  Plus,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Download,
  RefreshCw,
  Search
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

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system',
    priority: 'medium',
    target: 'all',
    category: 'admin'
  });

  const notificationStatuses = [
    { value: 'all', label: 'すべて' },
    { value: 'sent', label: '送信済み' },
    { value: 'pending', label: '送信待ち' },
    { value: 'failed', label: '送信失敗' }
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    let filtered = [...notifications];

    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(notification => notification.status === filterStatus);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, filterStatus]);

  useEffect(() => {
    const newStats = {
      total: notifications.length,
      sent: notifications.filter(n => n.status === 'sent').length,
      pending: notifications.filter(n => n.status === 'pending').length,
      failed: notifications.filter(n => n.status === 'failed').length
    };
    setStats(newStats);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      // データを整形
      const formattedNotifications = data.map(notification => ({
        ...notification,
        createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
        sentAt: notification.sentAt ? new Date(notification.sentAt) : null,
        recipients: notification.readCount || 0 // readCountを受信者数として使用
      }));
      
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications();
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create notification');
      }
      
      const newNotification = await response.json();
      
      // リストを更新
      loadNotifications();
      
      // フォームとモーダルをリセット
      setFormData({
        title: '',
        message: '',
        type: 'system',
        priority: 'medium',
        target: 'all',
        category: 'admin'
      });
      setShowCreateModal(false);
      
      alert('通知を作成しました！');
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('通知の作成に失敗しました。');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('この通知を削除しますか？')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      loadNotifications();
      alert('通知を削除しました。');
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('通知の削除に失敗しました。');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <AdminLoadingState message="通知データを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="通知管理"
        description="プッシュ通知とメール通知を管理します"
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              data-testid="button-create-notification"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">通知作成</span>
            </motion.button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          title="送信待ち"
          value={<AnimatedNumber value={stats.pending} />}
          icon={Clock}
          color="yellow"
        />
        <AdminStatsCard
          title="送信失敗"
          value={<AnimatedNumber value={stats.failed} />}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <AdminContentCard title="検索とフィルター">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="通知を検索..."
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
            {notificationStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </AdminContentCard>

      <div className="space-y-4">
        {filteredNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <AdminContentCard>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Bell className="w-5 h-5 text-pink-500" />
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.status)}`}>
                        {notification.status === 'sent' ? '送信済み' : notification.status === 'pending' ? '送信待ち' : '送信失敗'}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                        {notification.priority === 'urgent' ? '緊急' : notification.priority === 'high' ? '高' : notification.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>既読: {(notification.recipients || 0).toLocaleString()} 人</span>
                      </div>
                      <span>•</span>
                      <span>作成: {notification.createdAt.toLocaleString('ja-JP')}</span>
                      {notification.sentAt && (
                        <>
                          <span>•</span>
                          <span>送信: {notification.sentAt.toLocaleString('ja-JP')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      data-testid={`button-view-${notification.id}`}
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`button-delete-${notification.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">タイプ</p>
                    <p className="text-lg font-semibold text-gray-900">{notification.type === 'system' ? 'システム' : notification.type === 'marketing' ? 'マーケティング' : '一般'}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">対象</p>
                    <p className="text-lg font-semibold text-gray-900">{notification.target === 'all' ? '全ユーザー' : '特定ユーザー'}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">既読者数</p>
                    <p className="text-lg font-semibold text-gray-900">{(notification.recipients || 0).toLocaleString()}人</p>
                  </div>
                </div>
              </div>
            </AdminContentCard>
          </motion.div>
        ))}
      </div>

      {/* 通知作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">新しい通知を作成</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="通知のタイトルを入力"
                    data-testid="input-title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メッセージ
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="通知の内容を入力"
                    data-testid="input-message"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイプ
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      data-testid="select-type"
                    >
                      <option value="system">システム</option>
                      <option value="marketing">マーケティング</option>
                      <option value="announcement">お知らせ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      優先度
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      data-testid="select-priority"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="urgent">緊急</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    対象
                  </label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    data-testid="select-target"
                  >
                    <option value="all">全ユーザー</option>
                    <option value="users">一般ユーザー</option>
                    <option value="creators">クリエイター</option>
                    <option value="premium">プレミアム会員</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg"
                    data-testid="button-submit-notification"
                  >
                    通知を送信
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AdminPageContainer>
  );
};

export default NotificationManagement;
