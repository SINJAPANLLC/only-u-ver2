import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const { currentUser } = useAuth();

  // 通知タイプ
  const NOTIFICATION_TYPES = {
    SYSTEM: 'system',
    PAYMENT: 'payment',
    CREATOR: 'creator',
    FOLLOW: 'follow',
    MESSAGE: 'message',
    POST: 'post',
    SECURITY: 'security',
    MARKETING: 'marketing'
  };

  // 通知優先度
  const PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  };

  // プッシュ通知の許可をリクエスト
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };

  // 通知を送信
  const sendNotification = async (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      type: notification.type || NOTIFICATION_TYPES.SYSTEM,
      title: notification.title,
      message: notification.message,
      priority: notification.priority || PRIORITY.MEDIUM,
      data: notification.data || {},
      timestamp: new Date(),
      read: false,
      sent: false
    };

    // データベースに保存（実際の実装ではAPIコール）
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // プッシュ通知を送信
    if (pushEnabled && notification.push !== false) {
      await sendPushNotification(newNotification);
    }

    // メール通知を送信
    if (emailEnabled && notification.email !== false) {
      await sendEmailNotification(newNotification);
    }

    return newNotification;
  };

  // プッシュ通知を送信
  const sendPushNotification = async (notification) => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/logo192.png',
          badge: '/logo192.png',
          data: notification.data,
          tag: notification.id,
          requireInteraction: notification.priority === PRIORITY.URGENT,
          actions: [
            {
              action: 'view',
              title: '確認'
            },
            {
              action: 'dismiss',
              title: '閉じる'
            }
          ]
        });
      } catch (error) {
        console.error('プッシュ通知の送信に失敗しました:', error);
      }
    }
  };

  // メール通知を送信
  const sendEmailNotification = async (notification) => {
    try {
      // 実際の実装ではAPIコール
      console.log('メール通知を送信:', notification);
      // await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notification)
      // });
    } catch (error) {
      console.error('メール通知の送信に失敗しました:', error);
    }
  };

  // 通知を既読にする
  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Firestoreにも反映
    if (currentUser) {
      try {
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.uid })
        });
      } catch (error) {
        console.error('通知を既読にできませんでした:', error);
      }
    }
  };

  // 全ての通知を既読にする
  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);

    // Firestoreにも反映（全ての通知を一括更新）
    if (currentUser && notifications.length > 0) {
      try {
        const unreadNotifications = notifications.filter(n => !n.read);
        await Promise.all(
          unreadNotifications.map(notification => 
            fetch(`/api/notifications/${notification.id}/read`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.uid })
            })
          )
        );
      } catch (error) {
        console.error('全ての通知を既読にできませんでした:', error);
      }
    }
  };

  // 通知を削除
  const deleteNotification = async (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });

    // Firestoreからも削除
    if (currentUser) {
      try {
        await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('通知を削除できませんでした:', error);
        // 削除に失敗した場合、通知を復元
        setNotifications(prev => {
          const notification = notifications.find(n => n.id === notificationId);
          if (notification) {
            return [...prev, notification].sort((a, b) => b.timestamp - a.timestamp);
          }
          return prev;
        });
      }
    }
  };

  // 通知設定を更新
  const updateNotificationSettings = (settings) => {
    if (settings.pushEnabled !== undefined) {
      setPushEnabled(settings.pushEnabled);
    }
    if (settings.emailEnabled !== undefined) {
      setEmailEnabled(settings.emailEnabled);
    }
  };

  // 通知テンプレート
  const createNotification = {
    // システム通知
    system: (title, message, priority = PRIORITY.MEDIUM) => ({
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      priority
    }),

    // 支払い通知
    payment: (amount, type) => ({
      type: NOTIFICATION_TYPES.PAYMENT,
      title: '支払い完了',
      message: `${type}: ¥${amount.toLocaleString()}の支払いが完了しました`,
      priority: PRIORITY.HIGH,
      data: { amount, type }
    }),

    // 売上通知
    revenue: (amount, fees) => ({
      type: NOTIFICATION_TYPES.PAYMENT,
      title: '売上発生',
      message: `売上: ¥${amount.toLocaleString()} (手数料控除後: ¥${fees.netAmount.toLocaleString()})`,
      priority: PRIORITY.HIGH,
      data: { amount, fees }
    }),

    // フォロー通知
    follow: (username) => ({
      type: NOTIFICATION_TYPES.FOLLOW,
      title: '新しいフォロワー',
      message: `${username}さんがあなたをフォローしました`,
      priority: PRIORITY.MEDIUM,
      data: { username }
    }),

    // メッセージ通知
    message: (username, preview) => ({
      type: NOTIFICATION_TYPES.MESSAGE,
      title: `${username}さんからのメッセージ`,
      message: preview,
      priority: PRIORITY.HIGH,
      data: { username, preview }
    }),

    // 投稿通知
    post: (type, title) => ({
      type: NOTIFICATION_TYPES.POST,
      title: `新しい${type}`,
      message: title,
      priority: PRIORITY.MEDIUM,
      data: { type, title }
    }),

    // セキュリティ通知
    security: (title, message) => ({
      type: NOTIFICATION_TYPES.SECURITY,
      title,
      message,
      priority: PRIORITY.URGENT,
      data: { security: true }
    }),

    // マーケティング通知
    marketing: (title, message) => ({
      type: NOTIFICATION_TYPES.MARKETING,
      title,
      message,
      priority: PRIORITY.LOW,
      data: { marketing: true }
    })
  };

  // Firestoreから通知を取得
  useEffect(() => {
    // 通知許可をリクエスト
    requestNotificationPermission();

    if (!currentUser) {
      // ユーザーがログインしていない場合、ローカルストレージから読み込み
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
      return;
    }

    // Firestoreから通知をリアルタイムで取得
    // すべての通知を取得してclient-sideでフィルタリング（whereを使わない）
    const notificationsRef = collection(db, 'notifications');

    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      const allNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'system',
          title: data.title,
          message: data.message,
          priority: data.priority || 'medium',
          target: data.target || 'all',
          data: data.data || {},
          timestamp: data.createdAt?.toDate() || new Date(),
          read: data.readBy?.includes(currentUser.uid) || false,
          sent: true
        };
      });
      
      const fetchedNotifications = allNotifications
        .filter(n => n.target === 'all' || n.target === 'users') // Client-sideでフィルタ
        .sort((a, b) => b.timestamp - a.timestamp); // Client-sideでソート

      setNotifications(fetchedNotifications);
    }, (error) => {
      console.error('通知の取得に失敗しました:', error);
      // エラー時はローカルストレージから読み込み
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 通知をローカルストレージに保存
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // 未読数を計算
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    pushEnabled,
    emailEnabled,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateNotificationSettings,
    createNotification,
    requestNotificationPermission,
    NOTIFICATION_TYPES,
    PRIORITY
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
