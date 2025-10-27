import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, CreditCard, Info, AlertCircle, CheckCircle, Gift, Star, Trash2, MessageSquare } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const NotificationPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const { notifications, markAsRead, deleteNotification, markAllAsRead, unreadCount } = useNotification();

    const tabs = [
        { key: 'all', label: 'すべて' },
        { key: 'system', label: '事務局' },
        { key: 'marketing', label: 'お知らせ' },
        { key: 'payment', label: '購入・売上' },
    ];

    // アイコンマッピング
    const getIcon = (type, priority) => {
        const iconProps = { size: 20, className: "flex-shrink-0" };
        
        if (type === 'system') return <AlertCircle {...iconProps} className="text-red-500" />;
        if (type === 'payment') return <CreditCard {...iconProps} className="text-green-500" />;
        if (type === 'marketing') return <Gift {...iconProps} className="text-purple-500" />;
        if (type === 'message') return <MessageSquare {...iconProps} className="text-blue-500" />;
        if (priority === 'urgent') return <Star {...iconProps} className="text-orange-500" />;
        
        return <Bell {...iconProps} className="text-gray-500" />;
    };

    // 通知をクリックした時の処理（既読にする）
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        console.log('Notification clicked:', notification);
    };

    // 通知を削除する処理
    const handleDeleteNotification = (notificationId, e) => {
        e.stopPropagation();
        if (window.confirm('この通知を削除しますか？')) {
            deleteNotification(notificationId);
        }
    };

    // すべての通知を削除する
    const deleteAllNotifications = () => {
        if (window.confirm('すべての通知を削除しますか？')) {
            notifications.forEach(notif => deleteNotification(notif.id));
        }
    };

    // タブ別に通知をフィルタリング
    const getFilteredNotifications = () => {
        if (activeTab === 'all') return notifications;
        return notifications.filter(notif => notif.type === activeTab);
    };

    // タブ別の未読数を取得
    const getTabUnreadCount = (type) => {
        if (type === 'all') return unreadCount;
        return notifications.filter(notif => notif.type === type && !notif.read).length;
    };

    // 日時フォーマット
    const formatDate = (timestamp) => {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 1) return '今';
        if (hours < 24) return `${hours}時間前`;
        
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-white/95 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                    <motion.button 
                        onClick={() => navigate(-1)} 
                        className="p-2.5 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 rounded-full transition-all group"
                        whileHover={{ scale: 1.1, rotate: -10 }}
                        whileTap={{ scale: 0.9 }}
                        data-testid="button-back"
                    >
                        <ArrowLeft size={20} className="text-gray-600 group-hover:text-pink-500 transition-colors" strokeWidth={2.5} />
                    </motion.button>
                    <div className="flex items-center gap-2">
                        <motion.h1 
                            className="text-base font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent"
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            通知
                        </motion.h1>
                        {unreadCount > 0 && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-gradient-to-br from-red-400 to-red-600 text-white text-xs rounded-full px-2 py-1 font-bold shadow-md"
                                data-testid="text-unread-count"
                            >
                                {unreadCount}
                            </motion.span>
                        )}
                    </div>
                    <motion.button 
                        onClick={deleteAllNotifications}
                        className="p-2.5 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 rounded-full transition-all group"
                        title="すべて削除"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        data-testid="button-delete-all"
                    >
                        <Trash2 size={20} className="text-gray-600 group-hover:text-pink-500 transition-colors" strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* Tab Pills */}
                <div className="px-4 py-4">
                    <div className="flex bg-gray-100 rounded-full p-1.5 shadow-inner">
                        {tabs.map((tab) => (
                            <motion.button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all duration-200 relative ${activeTab === tab.key
                                    ? 'text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                data-testid={`tab-${tab.key}`}
                            >
                                {activeTab === tab.key && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center justify-center gap-1">
                                    {tab.label}
                                    {getTabUnreadCount(tab.key) > 0 && (
                                        <span className={`text-xs px-1.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-pink-100 text-pink-600'}`}>
                                            {getTabUnreadCount(tab.key)}
                                        </span>
                                    )}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* アクションボタン */}
                {unreadCount > 0 && (
                    <div className="px-4 pb-2">
                        <motion.button
                            onClick={markAllAsRead}
                            className="text-sm font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            data-testid="button-mark-all-read"
                        >
                            すべて既読にする
                        </motion.button>
                    </div>
                )}

                {/* 通知リスト */}
                <div className="px-4">
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-12"
                            >
                                <motion.div
                                    animate={{ 
                                        y: [0, -10, 0],
                                        rotate: [0, 5, 0, -5, 0]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                                </motion.div>
                                <p className="text-gray-500 text-sm font-medium">
                                    通知はありません
                                </p>
                            </motion.div>
                        ) : (
                            filteredNotifications.map((notification, index) => (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    layout
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`flex items-start py-4 px-3 border-b border-gray-100 last:border-b-0 cursor-pointer rounded-lg transition-all duration-200 ${
                                        !notification.read ? 'bg-gradient-to-r from-pink-50/50 to-blue-50/50' : 'hover:bg-gray-50'
                                    }`}
                                    whileHover={{ scale: 1.01, x: 5 }}
                                    whileTap={{ scale: 0.99 }}
                                    data-testid={`notification-${notification.id}`}
                                >
                                    {/* アイコン */}
                                    <div className="mr-3 mt-0.5">
                                        {getIcon(notification.type, notification.priority)}
                                    </div>

                                    {/* コンテンツ */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className={`text-sm font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-600'} line-clamp-2`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 ml-2 mt-1.5"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">
                                                {formatDate(notification.timestamp)}
                                            </span>
                                            {notification.priority === 'urgent' && (
                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                                    重要
                                                </span>
                                            )}
                                            {notification.priority === 'high' && (
                                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                                                    高
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 削除ボタン */}
                                    <motion.button
                                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                                        className="ml-2 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        data-testid={`button-delete-${notification.id}`}
                                    >
                                        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                                    </motion.button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <BottomNavigationWithCreator active="notifications" />
        </>
    );
};

export default NotificationPage;
