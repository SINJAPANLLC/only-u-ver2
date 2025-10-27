import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  UserX, 
  Search,
  UserCheck,
  Shield,
  AlertTriangle,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const BlockedUsersPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const blockedQuery = query(
      collection(db, 'blockedUsers'),
      where('blockerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      blockedQuery, 
      async (snapshot) => {
        try {
          setError('');
          const blockedList = await Promise.all(
            snapshot.docs.map(async (blockDoc) => {
              const blockData = blockDoc.data();
              const userDoc = await getDoc(doc(db, 'users', blockData.blockedUserId));
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  id: blockDoc.id,
                  userId: blockData.blockedUserId,
                  name: userData.displayName || userData.username || '名前なし',
                  username: '@' + (userData.username || 'unknown'),
                  avatar: userData.photoURL || 'https://via.placeholder.com/150',
                  blockedAt: blockData.createdAt?.toDate?.().toLocaleDateString('ja-JP') || '不明',
                  reason: blockData.reason || 'その他',
                  lastActivity: '不明',
                  reportCount: blockData.reportCount || 0
                };
              }
              return null;
            })
          );
          
          setBlockedUsers(blockedList.filter(item => item !== null));
          setLoading(false);
        } catch (err) {
          console.error('ブロックユーザー取得エラー:', err);
          setError('ブロックユーザーの取得に失敗しました。もう一度お試しください。');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firestore監視エラー:', err);
        setError('データの監視中にエラーが発生しました。');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleUnblock = async (blockId) => {
    if (!confirm('このユーザーのブロックを解除しますか？')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'blockedUsers', blockId));
      alert('ブロックを解除しました');
    } catch (error) {
      console.error('ブロック解除エラー:', error);
      alert('ブロック解除に失敗しました。もう一度お試しください。');
    }
  };

  const handleRemoveFromList = async (blockId) => {
    if (!confirm('このユーザーをリストから削除しますか？')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'blockedUsers', blockId));
      alert('リストから削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました。もう一度お試しください。');
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'スパム行為':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200';
      case '不適切なコンテンツ':
        return 'bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 border-orange-200';
      case '迷惑行為':
        return 'bg-gradient-to-r from-yellow-100 to-pink-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-pink-100 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = blockedUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      {/* Header */}
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
              rotate: [0, 10, -10, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Shield className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">ブロックしたユーザー</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-xl border-2 border-pink-100"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ユーザーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold"
              data-testid="input-search"
            />
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center space-x-3"
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </motion.div>
            <p className="text-red-700 font-semibold">{error}</p>
          </motion.div>
        )}

        {/* Blocked Users List */}
        <AnimatePresence>
          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white border-2 border-pink-100 rounded-2xl p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
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
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-pink-200 shadow-md"
                        />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{user.username}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getReasonColor(user.reason)}`}>
                            {user.reason}
                          </span>
                          <span className="text-xs text-pink-600 font-semibold bg-pink-50 px-2 py-1 rounded-full">
                            報告数: {user.reportCount}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ブロック日: {user.blockedAt} • 最終活動: {user.lastActivity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUnblock(user.id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2 font-bold text-sm"
                        data-testid={`button-unblock-${user.id}`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>解除</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveFromList(user.id)}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2 font-bold text-sm"
                        data-testid={`button-remove-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>削除</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Shield className="w-20 h-20 text-pink-300 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">ブロックしたユーザーがいません</h3>
              <p className="text-gray-500">ブロックしたユーザーがここに表示されます</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Information */}
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
              <h4 className="font-bold text-pink-900 mb-2 text-lg">ブロック機能について</h4>
              <p className="text-base text-pink-800 mb-3 leading-relaxed">
                ブロックしたユーザーは以下の制限を受けます：
              </p>
              <ul className="text-base text-pink-800 space-y-2">
                <li className="flex items-center">
                  <UserX className="w-4 h-4 mr-2 text-pink-600" />
                  あなたのプロフィールや投稿を見ることができません
                </li>
                <li className="flex items-center">
                  <UserX className="w-4 h-4 mr-2 text-pink-600" />
                  あなたにメッセージを送ることができません
                </li>
                <li className="flex items-center">
                  <UserX className="w-4 h-4 mr-2 text-pink-600" />
                  あなたのコンテンツにいいねやコメントをすることができません
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

export default BlockedUsersPage;
