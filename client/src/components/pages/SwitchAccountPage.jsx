import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Search,
  Plus,
  User,
  Mail,
  Crown,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  Edit3,
  Eye,
  Clock,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const SwitchAccountPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: '田中 太郎',
      email: 'tanaka@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      isActive: true,
      lastLogin: '2024-01-20T10:30:00Z',
      accountType: 'creator',
      followers: 12500,
      isVerified: true,
      status: 'online'
    },
    {
      id: 2,
      name: '佐藤 花子',
      email: 'sato@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      isActive: false,
      lastLogin: '2024-01-18T15:45:00Z',
      accountType: 'fan',
      followers: 0,
      isVerified: false,
      status: 'offline'
    },
    {
      id: 3,
      name: '山田 次郎',
      email: 'yamada@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      isActive: false,
      lastLogin: '2024-01-15T09:20:00Z',
      accountType: 'creator',
      followers: 8900,
      isVerified: true,
      status: 'away'
    }
  ]);

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSwitchAccount = (accountId) => {
    setAccounts(prev => prev.map(account => ({
      ...account,
      isActive: account.id === accountId
    })));
    console.log('Switching to account:', accountId);
    alert(`アカウントを切り替えました: ${accounts.find(acc => acc.id === accountId)?.name}`);
  };

  const handleAddAccount = () => {
    navigate('/login');
  };

  const handleRemoveAccount = (accountId) => {
    if (window.confirm('このアカウントを削除しますか？')) {
      setAccounts(prev => prev.filter(account => account.id !== accountId));
    }
  };

  const formatLastLogin = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '1時間以内';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-gradient-to-br from-green-400 to-green-500';
      case 'away': return 'bg-gradient-to-br from-yellow-400 to-yellow-500';
      case 'offline': return 'bg-gradient-to-br from-gray-400 to-gray-500';
      default: return 'bg-gradient-to-br from-gray-400 to-gray-500';
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'creator': return Crown;
      case 'fan': return User;
      default: return User;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg"
      >
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          className="text-white mr-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex items-center">
          <motion.div
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Users className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">アカウントを切り替える</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-xl border-2 border-pink-100"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="アカウントを検索..."
              className="w-full pl-12 pr-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-xl border-2 border-pink-100"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddAccount}
            className="w-full flex items-center justify-center space-x-3 p-5 border-2 border-dashed border-pink-300 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-all"
            data-testid="button-add-account"
          >
            <Plus className="w-6 h-6 text-pink-600" />
            <span className="font-bold text-pink-700">新しいアカウントを追加</span>
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {filteredAccounts.length > 0 ? (
            <div className="space-y-4">
              {filteredAccounts.map((account, index) => {
                const AccountTypeIcon = getAccountTypeIcon(account.accountType);
                
                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="bg-white border-2 border-pink-100 rounded-2xl p-5 shadow-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <motion.div
                        animate={{ 
                          y: [0, -3, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.2
                        }}
                        className="relative"
                      >
                        <img 
                          src={account.avatar} 
                          alt={account.name} 
                          className="w-20 h-20 rounded-full object-cover border-2 border-pink-200 shadow-md"
                        />
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${getStatusColor(account.status)} shadow-md`}
                        />
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{account.name}</h3>
                          {account.isVerified && (
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            </motion.div>
                          )}
                          {account.isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center space-x-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>現在</span>
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <AccountTypeIcon className="w-4 h-4 text-pink-500" />
                          <span className="text-sm font-semibold text-pink-600">
                            {account.accountType === 'creator' ? 'クリエイター' : 'ファン'}
                          </span>
                          {account.followers > 0 && (
                            <span className="text-sm text-gray-500 font-medium">
                              • {account.followers.toLocaleString()}フォロワー
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{account.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatLastLogin(account.lastLogin)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        {!account.isActive && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSwitchAccount(account.id)}
                            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                            data-testid={`button-switch-${account.id}`}
                          >
                            切り替え
                          </motion.button>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemoveAccount(account.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          data-testid={`button-delete-${account.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-2xl border-2 border-pink-100 shadow-lg"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Users className="w-20 h-20 text-pink-300 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">アカウントが見つかりませんでした</h3>
              <p className="text-gray-500">検索キーワードを変更してお試しください。</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 rounded-2xl p-6 relative overflow-hidden"
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"
          />
          <div className="flex items-start space-x-4 relative z-10">
            <motion.div
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-6 h-6 text-pink-600 mt-1" />
            </motion.div>
            <div>
              <h4 className="font-bold text-pink-900 mb-2 text-lg">アカウント切り替えについて</h4>
              <ul className="text-base text-pink-800 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-pink-600" />
                  複数のアカウントを管理できます
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-pink-600" />
                  アカウントを切り替えると、そのアカウントの設定が適用されます
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-pink-600" />
                  各アカウントのデータは独立して保存されます
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-pink-600" />
                  不要なアカウントは削除できます
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default SwitchAccountPage;
