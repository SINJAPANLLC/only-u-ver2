import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Heart, Reply, Flag, MoreHorizontal, Search, Calendar, User, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const PostCommentsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'タイトルなし',
          thumbnail: data.thumbnailUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
          totalComments: data.commentsCount || 0,
          unreadComments: data.unreadCommentsCount || 0,
          lastCommentAt: data.lastCommentAt?.toDate?.() || new Date()
        };
      });
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const commentsQuery = query(
      collection(db, 'comments'),
      where('postUserId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          postId: data.postId || '',
          postTitle: data.postTitle || 'タイトルなし',
          user: {
            name: data.userName || 'ユーザー',
            avatar: data.userAvatar || 'https://images.unsplash.com/photo-1494790108755-2616c933448c?w=100&h=100&fit=crop&crop=face',
            isVerified: data.userVerified || false
          },
          content: data.content || '',
          likes: data.likes || 0,
          replies: data.repliesCount || 0,
          isLiked: data.isLiked || false,
          isReplied: data.isReplied || false,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          isRead: data.isRead || false
        };
      });
      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filterOptions = [
    { id: 'all', name: 'すべて' },
    { id: 'unread', name: '未読' },
    { id: 'liked', name: 'いいね済み' },
    { id: 'replied', name: '返信済み' }
  ];

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         comment.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && !comment.isRead) ||
                         (filterType === 'liked' && comment.isLiked) ||
                         (filterType === 'replied' && comment.isReplied);
    return matchesSearch && matchesFilter;
  });

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'たった今';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    return commentDate.toLocaleDateString('ja-JP');
  };

  const handleLike = (commentId) => {
    // いいね処理
    console.log('Like comment:', commentId);
  };

  const handleReply = (commentId) => {
    // 返信処理
    console.log('Reply to comment:', commentId);
  };

  const handleReport = (commentId) => {
    // 報告処理
    console.log('Report comment:', commentId);
  };

  const totalUnreadComments = comments.filter(c => !c.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">戻る</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">投稿へのコメント</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600">総コメント数</p>
              <p className="text-2xl font-bold text-gray-900">{comments.length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600">未読コメント</p>
              <p className="text-2xl font-bold text-pink-600">{totalUnreadComments}</p>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="コメントを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">フィルター</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {filterOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {filteredComments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                comment.isRead ? 'border-gray-200' : 'border-pink-500'
              }`}
            >
              <div className="flex space-x-3">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{comment.user.name}</h4>
                      {comment.user.isVerified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{comment.postTitle}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-800 mb-3">{comment.content}</p>

                  {/* Actions */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        comment.isLiked ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes}</span>
                    </button>

                    <button
                      onClick={() => handleReply(comment.id)}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        comment.isReplied ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      <Reply className="w-4 h-4" />
                      <span>{comment.replies}</span>
                    </button>

                    <button
                      onClick={() => handleReport(comment.id)}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      <span>報告</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredComments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MessageCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">コメントがありません</h3>
            <p className="text-gray-600">投稿にコメントがつくとここに表示されます</p>
          </div>
        )}
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default PostCommentsPage;
