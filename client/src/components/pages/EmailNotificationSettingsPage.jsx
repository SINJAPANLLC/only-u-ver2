import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Bell,
  UserPlus,
  Star,
  Shield,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const EmailNotificationSettingsPage = () => {
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState({
    newMessages: true,
    newFollowers: true,
    newLikes: false,
    newComments: true,
    newPosts: true,
    systemUpdates: true,
    marketingEmails: false,
    weeklyDigest: true,
    securityAlerts: true
  });

  const [saveStatus, setSaveStatus] = useState('');

  const notificationItems = [
    { id: 'newMessages', title: '新しいメッセージ', description: '新しいメッセージを受信した時', icon: Bell },
    { id: 'newFollowers', title: '新しいフォロワー', description: '誰かがあなたをフォローした時', icon: UserPlus },
    { id: 'newLikes', title: 'いいね通知', description: 'あなたの投稿にいいねがついた時', icon: Star },
    { id: 'newComments', title: '新しいコメント', description: 'あなたの投稿にコメントがついた時', icon: Bell },
    { id: 'newPosts', title: '新しい投稿', description: 'フォロー中のユーザーの新しい投稿', icon: Star },
    { id: 'systemUpdates', title: 'システム更新', description: 'アプリの更新やメンテナンス情報', icon: Settings },
    { id: 'marketingEmails', title: 'マーケティングメール', description: 'プロモーションやおすすめ情報', icon: Mail },
    { id: 'weeklyDigest', title: '週間ダイジェスト', description: '週間の活動サマリー', icon: Clock },
    { id: 'securityAlerts', title: 'セキュリティアラート', description: 'アカウントのセキュリティに関する重要な通知', icon: Shield }
  ];

  const toggleNotification = (id) => {
    setNotifications(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Email notification settings saved:', notifications);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-white mr-4 p-2 hover:bg-white/20 rounded-full transition-colors" data-testid="button-back">
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex items-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Mail className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">メール通知設定</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-xl border-2 border-pink-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">通知設定の概要</h2>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full border border-pink-200">
              <Bell className="w-5 h-5 text-pink-600" />
              <span className="text-sm font-bold text-pink-700">
                {Object.values(notifications).filter(Boolean).length} / {Object.keys(notifications).length} 有効
              </span>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          {notificationItems.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02, x: 5 }} className="bg-white border-2 border-pink-100 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }} className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center border-2 border-pink-200">
                    <item.icon className="w-6 h-6 text-pink-600" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                    <p className="text-sm text-gray-600 font-medium">{item.description}</p>
                  </div>
                </div>
                
                <motion.button onClick={() => toggleNotification(item.id)} whileTap={{ scale: 0.9 }} className="focus:outline-none" data-testid={`toggle-${item.id}`}>
                  <motion.div animate={{ scale: notifications[item.id] ? 1.1 : 1 }} className={`w-16 h-8 rounded-full p-1 transition-all ${notifications[item.id] ? 'bg-gradient-to-r from-pink-500 to-pink-600' : 'bg-gray-300'}`}>
                    <motion.div animate={{ x: notifications[item.id] ? 32 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-6 h-6 bg-white rounded-full shadow-md" />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button onClick={handleSave} disabled={saveStatus === 'saving'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 shadow-lg" data-testid="button-save">
          {saveStatus === 'saving' ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>保存中...</span>
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="w-6 h-6" />
              <span>保存完了！</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertTriangle className="w-6 h-6" />
              <span>保存に失敗しました</span>
            </>
          ) : (
            <>
              <span>設定を保存</span>
            </>
          )}
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 rounded-2xl p-6 relative overflow-hidden">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
          <div className="flex items-start space-x-4 relative z-10">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Sparkles className="w-6 h-6 text-pink-600 mt-1" />
            </motion.div>
            <div>
              <h4 className="font-bold text-pink-900 mb-2 text-lg">メール通知について</h4>
              <ul className="text-base text-pink-800 space-y-2">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-pink-600" />通知設定は即座に反映されます</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-pink-600" />重要なセキュリティ通知は常に送信されます</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-pink-600" />通知の配信には数分かかる場合があります</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-pink-600" />設定はすべてのデバイスで同期されます</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default EmailNotificationSettingsPage;
