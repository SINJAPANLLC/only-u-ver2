import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Share,
    Heart,
    MessageCircle,
    Bookmark,
    MoreHorizontal,
    Play,
    Volume2,
    VolumeX,
    ChevronDown,
    Film,
    Maximize,
    Minimize,
    Lock
} from 'lucide-react';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';
import { useUserInteractions } from '../../hooks/useUserInteractions';
import { useUserStats } from '../../context/UserStatsContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { addUserView } from '../../utils/userInteractions';
import { canAccessContent } from '../../utils/planAccess';

const VideoPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [isVerticalVideo, setIsVerticalVideo] = useState(true);
    const { likedPosts, savedPosts, toggleLike, toggleSave } = useUserInteractions();
    
    // useUserStatsのエラーハンドリング
    let updateLikedCount, updateSavedCount, updateViewingHistoryCount;
    try {
        const userStats = useUserStats();
        updateLikedCount = userStats.updateLikedCount;
        updateSavedCount = userStats.updateSavedCount;
        updateViewingHistoryCount = userStats.updateViewingHistoryCount;
    } catch (error) {
        console.warn('UserStats not available:', error);
        updateLikedCount = () => {};
        updateSavedCount = () => {};
        updateViewingHistoryCount = () => {};
    }
    
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [localLikedPosts, setLocalLikedPosts] = useState(new Set());
    const [localSavedPosts, setLocalSavedPosts] = useState(new Set());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const containerRef = useRef(null);
    const { currentUser } = useAuth();

    // URL変換ヘルパー関数
    const convertToProxyUrl = (url) => {
        if (!url) return null;
        
        console.log('VideoPage - Original URL:', url);
        
        // 既にプロキシURLの場合はそのまま返す
        if (url.startsWith('/api/proxy/')) {
            console.log('VideoPage - Already proxy URL:', url);
            return url;
        }
        
        // Google Storage URLの場合
        if (url.includes('storage.googleapis.com')) {
            const match = url.match(/\/(public|\.private)\/([^?]+)/);
            if (match) {
                const [, folder, filename] = match;
                const proxyUrl = `/api/proxy/${folder}/${filename}`;
                console.log('VideoPage - Converted to proxy URL:', proxyUrl);
                return proxyUrl;
            }
        }
        
        // /objects/ 形式の場合
        if (url.startsWith('/objects/')) {
            const filename = url.replace('/objects/', '');
            const proxyUrl = `/api/proxy/public/${filename}`;
            console.log('VideoPage - Converted legacy URL to proxy:', proxyUrl);
            return proxyUrl;
        }
        
        console.log('VideoPage - Using original URL:', url);
        return url;
    };

    // Firestoreから投稿データを取得
    useEffect(() => {
        const fetchPostData = async () => {
            try {
                setLoading(true);
                const postDoc = await getDoc(doc(db, 'posts', id));
                
                if (postDoc.exists()) {
                    const postData = postDoc.data();
                    console.log('📹 VideoPage - Post data:', postData);
                    
                    // 限定コンテンツのチェック
                    if (postData.isExclusiveContent) {
                        // サブスクリプション状態をチェック
                        if (!currentUser) {
                            setAccessDenied(true);
                            setLoading(false);
                            return;
                        }
                        
                        // クリエイターのサブスクリプション確認
                        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                        if (!userDoc.exists()) {
                            // Firestoreユーザードキュメントが存在しない場合はアクセス拒否
                            setAccessDenied(true);
                            setLoading(false);
                            return;
                        }
                        
                        const userData = userDoc.data();
                        
                        // サブスクリプション情報をサブコレクションから取得
                        const subscriptionDocRef = doc(db, 'users', currentUser.uid, 'subscriptions', postData.userId);
                        const subscriptionDoc = await getDoc(subscriptionDocRef);
                        let userSubscription = subscriptionDoc.exists() && subscriptionDoc.data().status === 'active' ? subscriptionDoc.data() : null;
                        
                        // サブコレクションに存在しない場合、古い配列形式からフォールバック
                        if (!userSubscription && userData.subscriptions) {
                            const legacySubscription = userData.subscriptions.find(sub => sub.creatorId === postData.userId);
                            if (legacySubscription) {
                                userSubscription = legacySubscription;
                            }
                        }
                        
                        const userPlanLevel = userSubscription?.planLevel || null;
                        
                        // オーナー自身または管理者でない場合、プランレベルチェック
                        if (!canAccessContent(userPlanLevel, postData.requiredPlanLevel, postData.userId === currentUser.uid, userData.isAdmin)) {
                            setAccessDenied(true);
                            setLoading(false);
                            return;
                        }
                    }
                    
                    // 最初のファイルを取得
                    const firstFile = postData.files && postData.files.length > 0 ? postData.files[0] : null;
                    
                    // ビデオURLを変換
                    const videoUrl = firstFile ? convertToProxyUrl(firstFile.url || firstFile.secure_url) : null;
                    
                    console.log('📹 VideoPage - Video URL:', videoUrl);
                    
                    // クリエイター情報を取得
                    let creatorData = {};
                    if (postData.userId) {
                        const userDoc = await getDoc(doc(db, 'users', postData.userId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            creatorData = {
                                name: userData.displayName || userData.username || 'クリエイター',
                                username: userData.username ? `@${userData.username}` : '@creator',
                                avatar: userData.photoURL || 'https://via.placeholder.com/150',
                                isVerified: userData.isVerified || false,
                                followers: userData.followers || 0
                            };
                        }
                    }
                    
                    setVideoData({
                        id: postDoc.id,
                        title: postData.title || 'タイトルなし',
                        description: postData.explanation || postData.description || postData.content || '説明なし',
                        creator: creatorData,
                        type: 'video',
                        videoUrl: videoUrl,
                        thumbnail: firstFile ? convertToProxyUrl(firstFile.thumbnailUrl) : null,
                        imageUrl: firstFile ? convertToProxyUrl(firstFile.thumbnailUrl) : null,
                        likes: postData.likes || 0,
                        comments: postData.commentCount || 0,
                        bookmarks: postData.bookmarks || 0,
                        views: postData.views || 0,
                        uploadDate: postData.createdAt ? new Date(postData.createdAt.seconds * 1000).toLocaleDateString('ja-JP') : '最近',
                        tags: postData.tags || [],
                        userId: postData.userId
                    });
                    
                    // 視聴履歴を保存（ログイン済みユーザーのみ）
                    if (currentUser) {
                        try {
                            const added = await addUserView(currentUser.uid, postDoc.id);
                            if (added) {
                                updateViewingHistoryCount(1);
                                console.log('✅ Viewing history saved for post:', postDoc.id);
                            }
                        } catch (error) {
                            console.error('Error saving viewing history:', error);
                        }
                    }
                } else {
                    console.error('Post not found:', id);
                    alert('投稿が見つかりません');
                    navigate('/feed');
                }
            } catch (error) {
                console.error('Error fetching post data:', error);
                alert('投稿データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        
        if (id) {
            fetchPostData();
        }
    }, [id, navigate]);

    // コメントをリアルタイムで読み込む
    useEffect(() => {
        if (!id) return;

        setLoadingComments(true);
        const commentsRef = collection(db, 'posts', id, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(commentsData);
            setLoadingComments(false);
        }, (error) => {
            console.error('Error loading comments:', error);
            setLoadingComments(false);
        });

        return () => unsubscribe();
    }, [id]);

    // コメント送信
    const handleSendComment = async () => {
        if (!newComment.trim() || !currentUser) return;

        try {
            const commentsRef = collection(db, 'posts', id, 'comments');
            await addDoc(commentsRef, {
                text: newComment,
                userId: currentUser.uid,
                userName: currentUser.displayName || 'ユーザー',
                userAvatar: currentUser.photoURL || 'https://via.placeholder.com/150',
                createdAt: new Date()
            });

            // コメント数をインクリメント
            const postRef = doc(db, 'posts', id);
            await updateDoc(postRef, {
                commentCount: increment(1)
            });

            setNewComment('');
            if (videoData) {
                setVideoData({
                    ...videoData,
                    comments: videoData.comments + 1
                });
            }
        } catch (error) {
            console.error('Error sending comment:', error);
            alert('コメントの送信に失敗しました');
        }
    };

    // 投稿削除
    const handleDeletePost = async () => {
        if (!currentUser || !videoData || videoData.userId !== currentUser.uid) {
            alert('この投稿を削除する権限がありません');
            return;
        }

        if (!window.confirm('本当にこの投稿を削除しますか？この操作は取り消せません。')) {
            return;
        }

        setIsDeleting(true);

        try {
            // Firestoreから投稿を削除
            await deleteDoc(doc(db, 'posts', id));
            
            alert('投稿を削除しました');
            navigate('/'); // ホームページにリダイレクト
        } catch (error) {
            console.error('Error deleting post:', error);
            alert(`投稿の削除に失敗しました: ${error.message}`);
        } finally {
            setIsDeleting(false);
            setShowOptionsModal(false);
        }
    };

    // Handle video playback
    const toggleVideoPlayback = () => {
        if (videoRef.current) {
            try {
                if (isVideoPlaying) {
                    videoRef.current.pause();
                    setIsVideoPlaying(false);
                } else {
                    const playPromise = videoRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            setIsVideoPlaying(true);
                        }).catch(error => {
                            console.log("Playback failed:", error);
                            setIsVideoPlaying(false);
                        });
                    }
                }
            } catch (error) {
                console.error("Error in toggleVideoPlayback:", error);
                setIsVideoPlaying(false);
            }
        }
    };

    // Handle mute toggle
    const toggleMute = () => {
        if (videoRef.current) {
            try {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
            } catch (error) {
                console.error("Error in toggleMute:", error);
            }
        }
    };

    // Handle like toggle
    const handleToggleLike = async (e) => {
        try {
            e.stopPropagation();
            const wasLiked = localLikedPosts.has(videoData.id);
            
            setLocalLikedPosts(prev => {
                const newSet = new Set(prev);
                if (newSet.has(videoData.id)) {
                    newSet.delete(videoData.id);
                    try {
                        updateLikedCount(-1);
                    } catch (statsError) {
                        console.warn('Error updating liked count:', statsError);
                    }
                } else {
                    newSet.add(videoData.id);
                    try {
                        updateLikedCount(1);
                    } catch (statsError) {
                        console.warn('Error updating liked count:', statsError);
                    }
                }
                return newSet;
            });
            
            toggleLike(videoData.id).catch(error => {
                console.error('Error toggling like:', error);
                try {
                    updateLikedCount(wasLiked ? 1 : -1);
                } catch (statsError) {
                    console.warn('Error reverting liked count:', statsError);
                }
            });
        } catch (error) {
            console.error('Error in handleToggleLike:', error);
        }
    };

    // Handle bookmark toggle
    const handleToggleBookmark = async (e) => {
        try {
            e.stopPropagation();
            const wasSaved = localSavedPosts.has(videoData.id);
            
            setLocalSavedPosts(prev => {
                const newSet = new Set(prev);
                if (newSet.has(videoData.id)) {
                    newSet.delete(videoData.id);
                    try {
                        updateSavedCount(-1);
                    } catch (statsError) {
                        console.warn('Error updating saved count:', statsError);
                    }
                } else {
                    newSet.add(videoData.id);
                    try {
                        updateSavedCount(1);
                    } catch (statsError) {
                        console.warn('Error updating saved count:', statsError);
                    }
                }
                return newSet;
            });
            
            toggleSave(videoData.id).catch(error => {
                console.error('Error toggling save:', error);
                try {
                    updateSavedCount(wasSaved ? 1 : -1);
                } catch (statsError) {
                    console.warn('Error reverting saved count:', statsError);
                }
            });
        } catch (error) {
            console.error('Error in handleToggleBookmark:', error);
        }
    };

    // Handle profile navigation
    const handleAccountClick = () => {
        try {
            navigate(`/profile/${videoData.userId}`);
        } catch (error) {
            console.error('Error navigating to profile:', error);
        }
    };

    // Handle share
    const handleShare = async (e) => {
        e.stopPropagation();
        try {
            const postUrl = window.location.href;
            const shareText = `${videoData?.title}\n${postUrl}`;
            
            if (navigator.share) {
                navigator.share({
                    title: videoData?.title,
                    text: videoData?.description,
                    url: postUrl
                }).then(() => {
                    console.log('Successfully shared');
                }).catch(error => {
                    console.log('Error sharing:', error);
                });
            } else {
                navigator.clipboard.writeText(postUrl).then(() => {
                    console.log('URL copied to clipboard');
                }).catch(error => {
                    console.log('Error copying to clipboard:', error);
                });
            }
        } catch (error) {
            console.error('Error in share action:', error);
        }
    };

    // Handle fullscreen
    const handleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.log('Fullscreen error:', error);
        }
    };

    // Auto-play video on mount
    useEffect(() => {
        if (videoRef.current && videoData && videoData.type === 'video') {
            videoRef.current.play().catch(e => {
                console.log('Auto-play failed:', e);
                setIsVideoPlaying(false);
            });
        }
    }, [videoData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center"
                    >
                        <Lock className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
                        限定コンテンツ
                    </h2>
                    <p className="text-gray-600 mb-6">
                        このコンテンツはサブスクライバー限定です。<br />
                        クリエイターをサブスクライブして閲覧しましょう。
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/feed')}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg"
                        data-testid="button-back-to-feed"
                    >
                        フィードに戻る
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    if (!videoData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <p>動画が見つかりません</p>
            </div>
        );
    }

    return (
        <>
            <div className="relative w-full h-screen bg-black overflow-hidden">
                {/* Top Navigation */}
                <motion.div 
                    className="absolute top-0 left-0 right-0 z-20 p-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex items-center justify-end">
                        <div className="flex items-center space-x-3">
                            <motion.button 
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={handleShare}
                                className="cursor-pointer"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                data-testid="button-share"
                            >
                                <Share size={24} className="text-white" strokeWidth={2} />
                            </motion.button>
                            <motion.button 
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOptionsModal(true);
                                }}
                                className="cursor-pointer"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                data-testid="button-more"
                            >
                                <MoreHorizontal size={24} className="text-white" strokeWidth={2} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="w-full h-full relative">
                    {/* Background Video/Image */}
                    <div className="absolute inset-0">
                        {videoData.type === 'video' ? (
                            <video
                                ref={videoRef}
                                src={videoData.videoUrl}
                                poster={videoData.thumbnail}
                                className={`w-full h-full ${isVerticalVideo ? 'object-cover' : 'object-contain'}`}
                                loop
                                playsInline
                                autoPlay
                                muted={isMuted}
                                preload="auto"
                                onLoadedMetadata={(e) => {
                                    const video = e.target;
                                    setIsVerticalVideo(video.videoHeight > video.videoWidth);
                                }}
                                onLoadedData={(e) => {
                                    const video = e.target;
                                    video.play().then(() => {
                                        setIsVideoPlaying(true);
                                    }).catch(err => {
                                        console.log('Autoplay prevented:', err);
                                    });
                                }}
                                onClick={toggleVideoPlayback}
                                data-testid="video-player"
                            />
                        ) : (
                            <img
                                src={videoData.imageUrl}
                                alt={videoData.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    console.error('Image load error:', e);
                                    e.target.src = '/logo192.png';
                                }}
                            />
                        )}
                    </div>

                    {/* Center Play Button for videos */}
                    {videoData.type === 'video' && !isVideoPlaying && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center z-10"
                        >
                            <button
                                onClick={toggleVideoPlayback}
                                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                                data-testid="button-play"
                            >
                                <Play size={32} className="text-white ml-1" />
                            </button>
                        </motion.div>
                    )}

                    {/* Right Side Actions */}
                    <div className="absolute right-4 bottom-28 z-30 flex flex-col items-center space-y-5">
                        {/* Swipe Indicator */}
                        <motion.div 
                            className="flex flex-col items-center cursor-pointer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => navigate(-1)}
                            data-testid="button-swipe-back"
                        >
                            <motion.div 
                                className="flex flex-col items-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ChevronDown size={28} className="text-white" strokeWidth={1.5} />
                                <span className="text-white text-[11px] font-medium mt-0.5">Swipe</span>
                            </motion.div>
                        </motion.div>

                        {/* Creator Profile */}
                        <motion.div 
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={handleAccountClick}
                            className="cursor-pointer relative"
                            data-testid="button-creator-profile"
                        >
                            <motion.img
                                src={videoData.creator.avatar}
                                alt={videoData.creator.name}
                                className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                                animate={{ 
                                    boxShadow: [
                                        "0 0 0 0 rgba(255, 255, 255, 0.4)",
                                        "0 0 0 8px rgba(255, 255, 255, 0)",
                                        "0 0 0 0 rgba(255, 255, 255, 0)"
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div 
                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-lg"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <span className="text-white text-[11px] font-bold">+</span>
                            </motion.div>
                        </motion.div>

                        {/* Like Button */}
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.15 }}
                            onClick={handleToggleLike}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="flex flex-col items-center cursor-pointer"
                            data-testid="button-like"
                        >
                            <motion.div
                                animate={localLikedPosts.has(videoData.id) ? {
                                    scale: [1, 1.3, 1],
                                    rotate: [0, -15, 15, 0]
                                } : {
                                    y: [0, -2, 0]
                                }}
                                transition={localLikedPosts.has(videoData.id) ? 
                                    { duration: 0.5 } : 
                                    { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                }
                            >
                                <Heart
                                    size={32}
                                    className={`${localLikedPosts.has(videoData.id) ? 'text-pink-500 fill-pink-500' : 'text-white'}`}
                                    strokeWidth={1.5}
                                />
                            </motion.div>
                            <motion.span 
                                className="text-white text-xs font-semibold mt-0.5"
                                key={videoData.likes}
                                initial={{ scale: 1.2, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {videoData.likes + (localLikedPosts.has(videoData.id) ? 1 : 0)}
                            </motion.span>
                        </motion.div>

                        {/* Bookmark Button */}
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.15 }}
                            onClick={handleToggleBookmark}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="flex flex-col items-center cursor-pointer"
                            data-testid="button-bookmark"
                        >
                            <motion.div
                                animate={localSavedPosts.has(videoData.id) ? {
                                    scale: [1, 1.3, 1],
                                    rotate: [0, -15, 15, 0]
                                } : {
                                    y: [0, -2, 0]
                                }}
                                transition={localSavedPosts.has(videoData.id) ? 
                                    { duration: 0.5 } : 
                                    { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
                                }
                            >
                                <Bookmark
                                    size={32}
                                    className={`${localSavedPosts.has(videoData.id) ? 'text-pink-500 fill-pink-500' : 'text-white'}`}
                                    strokeWidth={1.5}
                                />
                            </motion.div>
                            <motion.span 
                                className="text-white text-xs font-semibold mt-0.5"
                                key={videoData.bookmarks}
                                initial={{ scale: 1.2, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {videoData.bookmarks + (localSavedPosts.has(videoData.id) ? 1 : 0)}
                            </motion.span>
                        </motion.div>

                        {/* Comment Button */}
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.15 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCommentModal(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="flex flex-col items-center cursor-pointer"
                            data-testid="button-comment"
                        >
                            <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            >
                                <MessageCircle size={32} className="text-white" strokeWidth={1.5} />
                            </motion.div>
                            <span className="text-white text-xs font-semibold mt-0.5">{videoData.comments}</span>
                        </motion.div>

                        {/* Mute Button */}
                        {videoData.type === 'video' && (
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.15 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMute();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className="flex flex-col items-center cursor-pointer"
                                data-testid="button-mute"
                            >
                                <motion.div
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                                >
                                    {isMuted ? (
                                        <VolumeX size={32} className="text-white" strokeWidth={1.5} />
                                    ) : (
                                        <Volume2 size={32} className="text-white" strokeWidth={1.5} />
                                    )}
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Fullscreen Button */}
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.15 }}
                            onClick={handleFullscreen}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="flex flex-col items-center cursor-pointer"
                            data-testid="button-fullscreen"
                        >
                            <motion.div 
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                            >
                                {isFullscreen ? (
                                    <Minimize size={32} className="text-white" strokeWidth={1.5} />
                                ) : (
                                    <Maximize size={32} className="text-white" strokeWidth={1.5} />
                                )}
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Bottom Content */}
                    <motion.div 
                        className="absolute bottom-16 left-0 right-0 z-20 p-4 pb-4 bg-gradient-to-t from-black via-black/95 to-transparent"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        {/* Watch Main Video Button */}
                        <motion.div 
                            className="mb-3 flex"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (videoData?.userId) {
                                        navigate(`/profile/${videoData.userId}`);
                                    }
                                }}
                                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2.5 px-4 rounded-lg flex items-center shadow-lg"
                                data-testid="button-watch-main-video"
                            >
                                <Film size={16} className="mr-1.5" strokeWidth={2.5} />
                                <span className="font-bold text-xs">本編を視聴する</span>
                                <ChevronDown size={14} className="ml-1 rotate-[-90deg]" strokeWidth={2.5} />
                            </motion.button>
                        </motion.div>

                        {/* Video Title */}
                        <motion.div 
                            className="text-white text-sm font-bold mb-1.5 text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            data-testid="video-title"
                        >
                            {videoData?.title || 'タイトル'}
                        </motion.div>

                        {/* Video Description */}
                        <motion.div 
                            className="text-white/90 text-xs mb-2 line-clamp-2 text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            data-testid="video-description"
                        >
                            {videoData?.description || '説明'}
                        </motion.div>


                        {/* Tags */}
                        <motion.div 
                            className="flex flex-wrap gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            {(() => {
                                const tags = Array.isArray(videoData?.tags) ? videoData.tags :
                                           Array.isArray(videoData?.genres) ? videoData.genres :
                                           typeof videoData?.tags === 'string' && videoData.tags ? [videoData.tags] :
                                           [];
                                return tags.map((tag, index) => (
                                    <motion.span
                                        key={tag}
                                        className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] rounded border border-white/30"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        data-testid={`tag-${tag}`}
                                    >
                                        {tag}
                                    </motion.span>
                                ));
                            })()}
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNavigationWithCreator />

            {/* Comment Modal */}
            <AnimatePresence>
                {showCommentModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end bg-black/50"
                        onClick={() => setShowCommentModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-lg font-bold">コメント {comments.length}</h3>
                                <button
                                    onClick={() => setShowCommentModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                    data-testid="button-close-comments"
                                >
                                    <MoreHorizontal size={24} className="rotate-90" />
                                </button>
                            </div>

                            {/* Comments List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {loadingComments ? (
                                    <div className="text-center text-gray-500 py-8">読み込み中...</div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        まだコメントがありません<br />最初のコメントを投稿しましょう！
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex space-x-3"
                                            data-testid={`comment-${comment.id}`}
                                        >
                                            <img
                                                src={comment.userAvatar}
                                                alt={comment.userName}
                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-sm">{comment.userName}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {comment.createdAt && new Date(comment.createdAt.seconds * 1000).toLocaleDateString('ja-JP')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-800 mt-1">{comment.text}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Comment Input */}
                            {currentUser ? (
                                <div className="p-4 border-t bg-white">
                                    <div className="flex space-x-3">
                                        <img
                                            src={currentUser.photoURL || 'https://via.placeholder.com/150'}
                                            alt={currentUser.displayName || 'You'}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 flex space-x-2">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && newComment.trim()) {
                                                        handleSendComment();
                                                    }
                                                }}
                                                placeholder="コメントを入力..."
                                                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                data-testid="input-comment"
                                            />
                                            <button
                                                onClick={handleSendComment}
                                                disabled={!newComment.trim()}
                                                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                data-testid="button-send-comment"
                                            >
                                                送信
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border-t bg-gray-50 text-center">
                                    <p className="text-gray-600 text-sm">コメントするにはログインしてください</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Options Modal */}
            <AnimatePresence>
                {showOptionsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                        onClick={() => setShowOptionsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-11/12 max-w-sm bg-white rounded-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4">
                                <h3 className="text-lg font-bold mb-4">オプション</h3>
                                
                                {/* 削除ボタン（オーナーのみ表示） */}
                                {currentUser && videoData && videoData.userId === currentUser.uid && (
                                    <button
                                        onClick={handleDeletePost}
                                        disabled={isDeleting}
                                        className="w-full py-3 text-left px-4 rounded-lg hover:bg-red-50 text-red-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid="button-delete-post"
                                    >
                                        {isDeleting ? '削除中...' : '投稿を削除'}
                                    </button>
                                )}
                                
                                {/* その他のオプション（将来的に追加可能） */}
                                <button
                                    onClick={() => {
                                        alert('報告機能は準備中です');
                                        setShowOptionsModal(false);
                                    }}
                                    className="w-full py-3 text-left px-4 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                                    data-testid="button-report"
                                >
                                    報告する
                                </button>
                                
                                <button
                                    onClick={() => setShowOptionsModal(false)}
                                    className="w-full py-3 text-left px-4 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors mt-2"
                                    data-testid="button-cancel-options"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VideoPage;
