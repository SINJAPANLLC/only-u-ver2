import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Settings, 
  ChevronRight, 
  ToggleLeft, 
  ToggleRight,
  HelpCircle,
  Globe,
  Mail,
  Users,
  UserX,
  User,
  Phone,
  AtSign,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // 設定状態
  const [rejectMessages, setRejectMessages] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const settingsItems = [
    {
      id: 'language',
      title: '言語設定',
      subtitle: '言語',
      icon: Globe,
      action: () => navigate('/settings/language'),
      hasToggle: false
    },
    {
      id: 'reject-messages',
      title: 'メッセージを拒否',
      subtitle: '',
      icon: UserX,
      action: () => setRejectMessages(!rejectMessages),
      hasToggle: true,
      toggleValue: rejectMessages,
      toggleAction: setRejectMessages,
      helpIcon: true
    },
    {
      id: 'email-notifications',
      title: 'メール通知設定',
      subtitle: '',
      icon: Mail,
      action: () => navigate('/settings/email-notifications'),
      hasToggle: false
    },
    {
      id: 'follow-list',
      title: 'フォロー中',
      subtitle: '',
      icon: Users,
      action: () => navigate('/settings/follow-list'),
      hasToggle: false
    },
    {
      id: 'blocked-users',
      title: 'ブロックしたユーザー',
      subtitle: '',
      icon: UserX,
      action: () => navigate('/settings/blocked-users'),
      hasToggle: false
    },
    {
      id: 'personal-info',
      title: '個人情報',
      subtitle: '名前、生年月日',
      icon: User,
      action: () => navigate('/settings/personal-info'),
      hasToggle: false
    },
    {
      id: 'phone-verification',
      title: '電話番号認証',
      subtitle: '',
      icon: Phone,
      action: () => navigate('/settings/phone-verification'),
      hasToggle: false
    },
    {
      id: 'email-verification',
      title: 'メールアドレス認証',
      subtitle: '',
      icon: AtSign,
      action: () => navigate('/settings/email-verification'),
      hasToggle: false
    },
    {
      id: 'notifications',
      title: 'お知らせ',
      subtitle: '',
      icon: Bell,
      action: () => navigate('/settings/notifications'),
      hasToggle: false
    },
    {
      id: 'help',
      title: 'ヘルプ',
      subtitle: '',
      icon: HelpCircle,
      action: () => navigate('/settings/help'),
      hasToggle: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="text-pink-600 mr-4"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center">
          <Settings className="w-6 h-6 text-gray-700 mr-2" />
          <h1 className="text-lg font-semibold text-gray-900">設定</h1>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white">
        {settingsItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              onClick={item.action}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center flex-1">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <item.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-sm text-gray-500">{item.subtitle}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {item.helpIcon && (
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                )}
                {item.hasToggle ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.toggleAction(!item.toggleValue);
                    }}
                    className="focus:outline-none"
                  >
                    {item.toggleValue ? (
                      <ToggleRight className="w-6 h-6 text-pink-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Help Text for Message Rejection */}
      {rejectMessages && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4 rounded-r-lg"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                メッセージを拒否すると、他のユーザーからのメッセージを受信できなくなります。
                既存のメッセージは保持されます。
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default SettingsPage;
