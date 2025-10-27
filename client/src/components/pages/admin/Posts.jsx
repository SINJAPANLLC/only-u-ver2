import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { db } from "../../../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, where } from "firebase/firestore";
import { 
  FileText, 
  Search, 
  Eye, 
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Heart,
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  Image,
  Video
} from 'lucide-react';
import { 
  AdminPageContainer, 
  AdminPageHeader, 
  AdminStatsCard, 
  AdminContentCard, 
  AdminTableContainer, 
  AdminEmptyState, 
  AdminLoadingState 
} from './AdminPageContainer';

// カウントアップアニメーションコンポーネント
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

  return <span>{displayValue.toLocaleString()}</span>;
};

export default function Posts() {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        private: 0,
        images: 0,
        videos: 0
    });
    const { t } = useTranslation();

    const statusOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'Public', label: '公開' },
        { value: 'Private', label: '非公開' }
    ];

    const typeOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'image', label: '画像' },
        { value: 'video', label: '動画' }
    ];

    // 検索・フィルター処理
    useEffect(() => {
        let filtered = posts;

        if (searchTerm) {
            filtered = filtered.filter(post =>
                post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.userName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(post => post.status === filterStatus);
        }

        if (filterType !== 'all') {
            if (filterType === 'image') {
                filtered = filtered.filter(post => post.hasImages);
            } else if (filterType === 'video') {
                filtered = filtered.filter(post => post.hasVideos);
            }
        }

        setFilteredPosts(filtered);
    }, [posts, searchTerm, filterStatus, filterType]);

    // 統計を更新
    useEffect(() => {
        const newStats = {
            total: posts.length,
            published: posts.filter(p => p.status === 'Public').length,
            private: posts.filter(p => p.status === 'Private').length,
            images: posts.filter(p => p.hasImages).length,
            videos: posts.filter(p => p.hasVideos).length
        };
        setStats(newStats);
    }, [posts]);

    // Fetch all posts from Firebase
    const fetchPosts = async () => {
        try {
            setLoading(true);
            setIsRefreshing(true);
            
            const postsQuery = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc')
            );
            
            const postsSnapshot = await getDocs(postsQuery);
            
            // Step 1: ユニークなuserIdを収集
            const userIds = [...new Set(
                postsSnapshot.docs
                    .map(doc => doc.data().userId)
                    .filter(userId => userId)
            )];
            
            // Step 2: ユーザーデータをバッチで取得（N+1問題を回避）
            const userDataMap = new Map();
            
            // Firestoreの制限により、一度に最大10個のIDでクエリできる
            const BATCH_SIZE = 10;
            for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
                const batchIds = userIds.slice(i, i + BATCH_SIZE);
                const usersQuery = query(
                    collection(db, 'users'),
                    where('__name__', 'in', batchIds)
                );
                
                try {
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.docs.forEach(userDoc => {
                        const userData = userDoc.data();
                        userDataMap.set(userDoc.id, userData.displayName || userData.name || 'Unknown User');
                    });
                } catch (batchError) {
                    console.warn('バッチクエリエラー:', batchError);
                }
            }
            
            // Step 3: 投稿データを処理
            const postsData = postsSnapshot.docs.map(postDoc => {
                const postData = postDoc.data();
                const userName = postData.userId ? 
                    (userDataMap.get(postData.userId) || 'Unknown User') : 
                    'Unknown User';
                
                return {
                    id: postDoc.id,
                    title: postData.explanation || postData.title || 'Untitled Post',
                    userId: postData.userId || 'Unknown',
                    userName: userName,
                    status: postData.isPublic !== false ? 'Public' : 'Private',
                    isPublic: postData.isPublic !== false,
                    createdAt: postData.createdAt || null,
                    likes: postData.likes || 0,
                    comments: postData.comments || 0,
                    views: postData.views || 0,
                    filesCount: postData.files ? postData.files.length : 0,
                    hasImages: postData.files ? postData.files.some(f => f.type && f.type.startsWith('image/')) : false,
                    hasVideos: postData.files ? postData.files.some(f => f.type && f.type.startsWith('video/')) : false,
                    thumbnailUrl: postData.files && postData.files.length > 0 ? 
                        (postData.files[0].url || postData.files[0].secure_url || null) : null
                };
            });
            
            setPosts(postsData);
            setFilteredPosts(postsData);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleToggleVisibility = async (postId, currentStatus) => {
        try {
            const postRef = doc(db, 'posts', postId);
            const newStatus = !currentStatus;
            
            await updateDoc(postRef, {
                isPublic: newStatus,
                lastModified: new Date().toISOString()
            });
            
            setPosts(posts.map(post => 
                post.id === postId 
                    ? { ...post, isPublic: newStatus, status: newStatus ? 'Public' : 'Private' }
                    : post
            ));
        } catch (error) {
            console.error('Error updating post visibility:', error);
            alert('Failed to update post visibility.');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('この投稿を削除しますか？この操作は取り消せません。')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPosts(posts.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post.');
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = dateString.seconds ? new Date(dateString.seconds * 1000) : new Date(dateString);
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Public': return 'text-green-600 bg-green-100';
            case 'Private': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return <AdminLoadingState message="投稿データを読み込み中..." />;
    }

    return (
        <AdminPageContainer>
            {/* ページヘッダー */}
            <AdminPageHeader
                title="投稿管理"
                description="投稿の管理、公開/非公開、削除を行います"
                icon={FileText}
                actions={
                    <>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchPosts}
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
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                            data-testid="button-export"
                        >
                            <Download className="w-4 h-4" />
                            <span className="font-medium">エクスポート</span>
                        </motion.button>
                    </>
                }
            />

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <AdminStatsCard
                    title="総投稿数"
                    value={<AnimatedNumber value={stats.total} />}
                    icon={FileText}
                    color="blue"
                />
                <AdminStatsCard
                    title="公開"
                    value={<AnimatedNumber value={stats.published} />}
                    icon={CheckCircle}
                    color="green"
                />
                <AdminStatsCard
                    title="非公開"
                    value={<AnimatedNumber value={stats.private} />}
                    icon={XCircle}
                    color="orange"
                />
                <AdminStatsCard
                    title="画像"
                    value={<AnimatedNumber value={stats.images} />}
                    icon={Image}
                    color="purple"
                />
                <AdminStatsCard
                    title="動画"
                    value={<AnimatedNumber value={stats.videos} />}
                    icon={Video}
                    color="pink"
                />
            </div>

            {/* フィルターと検索 */}
            <AdminContentCard title="検索・フィルター">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="投稿を検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                data-testid="input-search"
                            />
                        </div>
                    </div>

                    <div className="md:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            data-testid="select-status"
                        >
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:w-48">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            data-testid="select-type"
                        >
                            {typeOptions.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </AdminContentCard>

            {/* 投稿一覧テーブル */}
            <AdminTableContainer>
                {filteredPosts.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    投稿
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    作成者
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ステータス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    統計
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    投稿日
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPosts.map((post, index) => (
                                <motion.tr 
                                    key={post.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="hover:bg-pink-50 transition-colors"
                                    data-testid={`row-post-${post.id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {post.thumbnailUrl && (
                                                <div className="flex-shrink-0 h-12 w-12">
                                                    <img 
                                                        className="h-12 w-12 rounded-lg object-cover ring-2 ring-pink-100" 
                                                        src={post.thumbnailUrl} 
                                                        alt={post.title}
                                                    />
                                                </div>
                                            )}
                                            <div className={post.thumbnailUrl ? "ml-4" : ""}>
                                                <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                    {post.title}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {post.filesCount} ファイル
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{post.userName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(post.status)}`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3 text-xs">
                                            <span className="flex items-center space-x-1">
                                                <Heart className="w-3 h-3 text-red-500" />
                                                <span className="text-gray-900 font-semibold">{post.likes || 0}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <MessageCircle className="w-3 h-3 text-blue-500" />
                                                <span className="text-gray-900 font-semibold">{post.comments || 0}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(post.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleToggleVisibility(post.id, post.isPublic)}
                                                className="text-pink-600 hover:text-pink-900"
                                                data-testid={`button-toggle-${post.id}`}
                                            >
                                                {post.isPublic ? <Eye className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleDeletePost(post.id)}
                                                className="text-red-600 hover:text-red-900"
                                                data-testid={`button-delete-${post.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <AdminEmptyState
                        icon={FileText}
                        title="投稿が見つかりません"
                        description="検索条件を変更してください"
                    />
                )}
            </AdminTableContainer>
        </AdminPageContainer>
    );
}
