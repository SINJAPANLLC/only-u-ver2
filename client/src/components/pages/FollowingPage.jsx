import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserMinus, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';
import BottomNavigation from '../BottomNavigation';

const FollowingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const followsQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(followsQuery, async (snapshot) => {
      const followList = await Promise.all(
        snapshot.docs.map(async (followDoc) => {
          const followData = followDoc.data();
          const userDoc = await getDoc(doc(db, 'users', followData.followingId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              id: followDoc.id,
              userId: followData.followingId,
              name: userData.displayName || userData.username || '名前なし',
              avatar: userData.photoURL || 'https://via.placeholder.com/150',
              followersCount: userData.followersCount || 0,
              postsCount: userData.postsCount || 0,
              followedAt: followData.createdAt?.toDate?.() || new Date()
            };
          }
          return null;
        })
      );
      
      setFollowing(followList.filter(item => item !== null));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleUnfollow = async (followId, userName) => {
    if (!confirm(`${userName}のフォローを解除しますか？`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'follows', followId));
    } catch (error) {
      console.error('フォロー解除エラー:', error);
      alert('フォロー解除に失敗しました');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg"
      >
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={() => navigate(-1)} 
          className="text-white mr-4 p-2 hover:bg-white/20 rounded-full" 
          data-testid="button-back"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex items-center">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
            <Users className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">フォロー中</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-5 shadow-xl border-2 border-pink-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-700 font-semibold mb-1">フォロー中</p>
              <p className="text-3xl font-bold text-pink-900" data-testid="text-following-count">{following.length}人</p>
            </div>
            <Sparkles className="w-12 h-12 text-pink-500" />
          </div>
        </motion.div>

        <div className="space-y-3">
          {following.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="bg-white rounded-2xl p-8 text-center shadow-xl border-2 border-pink-100"
            >
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-4">フォロー中のクリエイターがいません</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/ranking')}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                data-testid="button-find-creators"
              >
                クリエイターを探す
              </motion.button>
            </motion.div>
          ) : (
            following.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-white rounded-2xl p-5 shadow-lg border-2 border-pink-100"
              >
                <div className="flex items-center space-x-4">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}>
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-pink-200 shadow-md" 
                    />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg" data-testid={`text-name-${index}`}>
                      {user.name}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span data-testid={`text-followers-${index}`}>
                        フォロワー: {user.followersCount}人
                      </span>
                      <span data-testid={`text-posts-${index}`}>
                        投稿: {user.postsCount}件
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      フォロー開始: {formatDate(user.followedAt)}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUnfollow(user.id, user.name)}
                    className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-md hover:from-red-100 hover:to-red-200 hover:text-red-700"
                    data-testid={`button-unfollow-${index}`}
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>解除</span>
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <BottomNavigation active="account" />
    </div>
  );
};

export default FollowingPage;
