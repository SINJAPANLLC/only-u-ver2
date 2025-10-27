import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Search,
  UserMinus,
  Crown,
  CheckCircle,
  Sparkles,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const FollowListPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [followList, setFollowList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchFollowingUsers = async () => {
      try {
        setError('');
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const followingIds = userData.following || [];

          if (followingIds.length === 0) {
            setFollowList([]);
            setLoading(false);
            return;
          }

          const followingUsers = [];
          const chunkSize = 10;
          
          for (let i = 0; i < followingIds.length; i += chunkSize) {
            const chunk = followingIds.slice(i, i + chunkSize);
            const usersQuery = query(
              collection(db, 'users'),
              where('__name__', 'in', chunk)
            );
            const querySnapshot = await getDocs(usersQuery);
            
            querySnapshot.forEach(doc => {
              followingUsers.push({
                id: doc.id,
                ...doc.data()
              });
            });
          }

          setFollowList(followingUsers);
        }
        setLoading(false);
      } catch (error) {
        console.error('フォローリスト取得エラー:', error);
        setError('フォローリストの取得に失敗しました。もう一度お試しください。');
        setLoading(false);
      }
    };

    fetchFollowingUsers();
  }, [currentUser]);

  const handleUnfollow = async (userId) => {
    if (!currentUser) return;

    if (!confirm('このユーザーのフォローを解除しますか？')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        following: arrayRemove(userId)
      });

      await updateDoc(doc(db, 'users', userId), {
        followers: arrayRemove(currentUser.uid)
      });

      setFollowList(prev => prev.filter(user => user.id !== userId));
      alert('フォローを解除しました');
    } catch (error) {
      console.error('フォロー解除エラー:', error);
      alert('フォロー解除に失敗しました。もう一度お試しください。');
    }
  };

  const filteredList = followList.filter(user => {
    const displayName = (user.displayName || user.name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return displayName.includes(query) || username.includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Users className="w-12 h-12 text-pink-500" />
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">フォロー中</h1>
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
              <Star className="w-6 h-6 text-red-500" />
            </motion.div>
            <p className="text-red-700 font-semibold">{error}</p>
          </motion.div>
        )}

        {/* Follow List */}
        <AnimatePresence>
          {filteredList.length > 0 ? (
            <div className="space-y-4">
              {filteredList.map((user, index) => (
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
                        className="relative"
                      >
                        <img
                          src={user.photoURL || user.avatar || 'https://via.placeholder.com/100'}
                          alt={user.displayName || user.name || 'User'}
                          className="w-16 h-16 rounded-full object-cover border-2 border-pink-200 shadow-md"
                        />
                        {user.isVerified && (
                          <motion.div
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900">{user.displayName || user.name || 'ユーザー'}</h3>
                          {user.isVerified && (
                            <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{user.username || '@user'}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-semibold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                            {(user.followers?.length || 0).toLocaleString()}フォロワー
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUnfollow(user.id)}
                      className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all flex items-center space-x-2 font-bold shadow-md"
                      data-testid={`button-unfollow-${user.id}`}
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>解除</span>
                    </motion.button>
                  </div>
                  
                  {user.bio && (
                    <p className="mt-3 text-sm text-gray-700 leading-relaxed font-medium">{user.bio}</p>
                  )}
                  
                  {user.tags && user.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {user.tags.map((tag, tagIndex) => (
                        <motion.span
                          key={tagIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + tagIndex * 0.05 }}
                          whileHover={{ scale: 1.1 }}
                          className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-xs font-bold rounded-full border border-pink-200"
                        >
                          #{tag}
                        </motion.span>
                      ))}
                    </div>
                  )}
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">フォロー中のユーザーがいません</h3>
              <p className="text-gray-500">興味のあるユーザーをフォローしてみましょう</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default FollowListPage;
