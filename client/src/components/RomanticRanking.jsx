import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Crown, Bookmark, Clock, Sparkles } from 'lucide-react';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useUserInteractions } from '../hooks/useUserInteractions';
import { useUserStats } from '../context/UserStatsContext';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Ranking = () => {
    const navigate = useNavigate();
    const { likedPosts, savedPosts, toggleLike, toggleSave, isLiked, isSaved } = useUserInteractions();
    const { updateLikedCount, updateSavedCount } = useUserStats();
    const [localLikedPosts, setLocalLikedPosts] = useState(new Set());
    const [localSavedPosts, setLocalSavedPosts] = useState(new Set());
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [videoDurations, setVideoDurations] = useState({});
    const [loadedVideos, setLoadedVideos] = useState(new Set());
    
    // デバイス検出（スマホ・タブレット判定）
    const isMobile = useMemo(() => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth < 768;
    }, []);

    // クリック機能（useCallbackでメモ化）
    const handleVideoClick = useCallback((post) => {
        navigate(`/video/${post.id}`);
    }, [navigate]);

    const handleAccountClick = useCallback((post, e) => {
        e.stopPropagation();
        navigate(`/profile/${post.user.id}`);
    }, [navigate]);

    const handleLikeClick = useCallback((postId, e) => {
        e.stopPropagation();
        const wasLiked = localLikedPosts.has(postId);
        
        setLocalLikedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
        
        setPosts(prevPosts => 
            prevPosts.map(post => 
                post.id === postId 
                    ? { ...post, likes: wasLiked ? post.likes - 1 : post.likes + 1 }
                    : post
            )
        );
        
        updateLikedCount(wasLiked ? -1 : 1);
        
        toggleLike(postId).catch(error => {
            console.error('いいねの切り替えでエラーが発生しました:', error);
            setLocalLikedPosts(prev => {
                const newSet = new Set(prev);
                if (wasLiked) newSet.add(postId);
                else newSet.delete(postId);
                return newSet;
            });
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { ...post, likes: wasLiked ? post.likes + 1 : post.likes - 1 }
                        : post
                )
            );
            updateLikedCount(wasLiked ? 1 : -1);
        });
    }, [localLikedPosts, toggleLike, updateLikedCount]);

    const handleSaveClick = useCallback((postId, e) => {
        e.stopPropagation();
        const wasSaved = localSavedPosts.has(postId);
        
        setLocalSavedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
        
        setPosts(prevPosts => 
            prevPosts.map(post => 
                post.id === postId 
                    ? { ...post, bookmarks: wasSaved ? post.bookmarks - 1 : post.bookmarks + 1 }
                    : post
            )
        );
        
        updateSavedCount(wasSaved ? -1 : 1);
        
        toggleSave(postId).catch(error => {
            console.error('保存の切り替えでエラーが発生しました:', error);
            setLocalSavedPosts(prev => {
                const newSet = new Set(prev);
                if (wasSaved) newSet.add(postId);
                else newSet.delete(postId);
                return newSet;
            });
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { ...post, bookmarks: wasSaved ? post.bookmarks + 1 : post.bookmarks - 1 }
                        : post
                )
            );
            updateSavedCount(wasSaved ? 1 : -1);
        });
    }, [localSavedPosts, toggleSave, updateSavedCount]);

    // URLをプロキシURLに変換する関数（useCallbackでメモ化）
    const convertToProxyUrl = useCallback((url) => {
        if (!url) return null;
        
        if (url.startsWith('/api/proxy/')) return url;
        
        if (url.startsWith('/objects/')) {
            const fileName = url.replace('/objects/', '');
            return `/api/proxy/public/${fileName}`;
        }
        
        if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
            try {
                const urlObj = new URL(url);
                const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
                if (pathMatch) {
                    const decodedPath = decodeURIComponent(pathMatch[1]);
                    const parts = decodedPath.split('/');
                    if (parts.length >= 2) {
                        const folder = parts[0];
                        const fileName = parts.slice(1).join('/');
                        return `/api/proxy/${folder}/${fileName}`;
                    }
                }
            } catch (e) {
                console.error('URL parse error:', e);
            }
        }
        
        return url;
    }, []);

    // 新しさボーナスを計算する関数（useCallbackでメモ化）
    const calculateFreshnessBonus = useCallback((timestamp) => {
        if (!timestamp) return 0;
        
        const now = new Date();
        const postDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInHours = (now - postDate) / (1000 * 60 * 60);
        
        if (diffInHours < 24) return 100;
        if (diffInHours < 72) return 50;
        if (diffInHours < 168) return 20;
        return 0;
    }, []);

    // Firestoreから人気投稿を取得
    useEffect(() => {
        const fetchRankingPosts = async () => {
            setLoadingPosts(true);
            try {
                const postsRef = collection(db, 'posts');
                
                const q = query(
                    postsRef,
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                
                const querySnapshot = await getDocs(q);
                
                const fetchedPosts = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    
                    if (data.isExclusiveContent === true || data.visibility !== 'public') {
                        return;
                    }
                    
                    const freshnessBonus = calculateFreshnessBonus(data.createdAt);
                    
                    let originalThumbnail = null;
                    if (data.files && data.files.length > 0) {
                        const file = data.files[0];
                        if (file.thumbnailUrl) {
                            originalThumbnail = file.thumbnailUrl;
                        }
                        else if (file.resourceType === 'image' || file.type?.startsWith('image/')) {
                            originalThumbnail = file.url;
                        }
                        else if (file.resourceType === 'video' || file.type?.startsWith('video/')) {
                            originalThumbnail = file.url;
                        }
                    }
                    const proxyThumbnail = convertToProxyUrl(originalThumbnail);
                    
                    let videoFileUrl = null;
                    if (data.files && data.files.length > 0) {
                        videoFileUrl = data.files[0].url || null;
                    }
                    
                    let videoDuration = '00:00';
                    if (data.files && data.files.length > 0 && data.files[0].duration) {
                        videoDuration = data.files[0].duration;
                    } else if (data.duration) {
                        videoDuration = data.duration;
                    }
                    
                    fetchedPosts.push({
                        id: doc.id,
                        title: data.title || 'タイトルなし',
                        likes: data.likes || 0,
                        bookmarks: data.bookmarks || 0,
                        duration: videoDuration,
                        thumbnail: proxyThumbnail,
                        videoUrl: convertToProxyUrl(videoFileUrl),
                        isVideo: originalThumbnail && originalThumbnail.match(/\.(mp4|mov|webm|MP4|MOV|WEBM)$/i),
                        user: {
                            id: data.userId,
                            name: data.userName || '匿名',
                            avatar: data.userAvatar || null
                        },
                        isNew: calculateIsNew(data.createdAt),
                        postedDate: calculateTimeAgo(data.createdAt),
                        score: (data.likes || 0) + (data.bookmarks || 0) + freshnessBonus
                    });
                });
                
                const sortedPosts = fetchedPosts.sort((a, b) => b.score - a.score);
                
                console.log('📊 Top 6 posts by score:', sortedPosts.slice(0, 6).map(p => ({
                    title: p.title,
                    score: p.score,
                    likes: p.likes,
                    bookmarks: p.bookmarks,
                    postedDate: p.postedDate
                })));
                
                const topPosts = sortedPosts.slice(0, 6);
                
                const postsWithUserInfo = await Promise.all(topPosts.map(async (post) => {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', post.user.id));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            return {
                                ...post,
                                user: {
                                    id: post.user.id,
                                    name: userData.displayName || userData.username || post.user.name,
                                    avatar: userData.photoURL || userData.avatar || post.user.avatar
                                }
                            };
                        }
                    } catch (error) {
                        console.error(`Error fetching user ${post.user.id}:`, error);
                    }
                    return post;
                }));
                
                if (postsWithUserInfo.length === 0) {
                    const samplePosts = [
                        {
                            id: 'sample_1',
                            title: 'サンプル動画',
                            likes: 245,
                            bookmarks: 89,
                            duration: '05:32',
                            thumbnail: '/genre-1.png',
                            isVideo: false,
                            user: {
                                id: '1',
                                name: 'サンプルユーザー',
                                avatar: null
                            },
                            isNew: true,
                            postedDate: '3日前',
                            score: 334
                        }
                    ];
                    setPosts(samplePosts);
                    console.log('✅ Showing 1 sample post (no Firestore data)');
                } else {
                    console.log(`✅ Fetched ${postsWithUserInfo.length} ranking posts with user info`);
                    setPosts(postsWithUserInfo);
                }
            } catch (error) {
                console.error('Error fetching ranking posts:', error);
                const samplePosts = [
                    {
                        id: 'sample_1',
                        title: 'サンプル動画',
                        likes: 245,
                        bookmarks: 89,
                        duration: '05:32',
                        thumbnail: '/genre-1.png',
                        isVideo: false,
                        user: {
                            id: '1',
                            name: 'サンプルユーザー',
                            avatar: null
                        },
                        isNew: true,
                        postedDate: '3日前',
                        score: 334
                    }
                ];
                setPosts(samplePosts);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchRankingPosts();
    }, [calculateFreshnessBonus, convertToProxyUrl]);

    // 動画の再生時間を遅延取得（画面に表示されているもののみ）
    const loadVideoDuration = useCallback(async (postId, videoUrl) => {
        if (loadedVideos.has(postId)) return;
        
        setLoadedVideos(prev => new Set(prev).add(postId));
        
        try {
            const duration = await getVideoDuration(videoUrl);
            setVideoDurations(prev => ({
                ...prev,
                [postId]: formatDuration(duration)
            }));
        } catch (error) {
            console.error(`Error loading duration for ${postId}:`, error);
        }
    }, [loadedVideos]);
    
    // 動画の再生時間を取得する関数
    const getVideoDuration = (videoUrl) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            const timeout = setTimeout(() => {
                video.src = '';
                reject(new Error('Timeout loading video metadata'));
            }, 10000); // 10秒でタイムアウト
            
            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                resolve(video.duration);
                video.src = '';
            };
            
            video.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load video metadata'));
                video.src = '';
            };
            
            video.src = videoUrl;
        });
    };
    
    // 再生時間をフォーマットする関数
    const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 時間経過を計算する関数
    const calculateTimeAgo = (timestamp) => {
        if (!timestamp) return '不明';
        
        const now = new Date();
        const postDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInMs = now - postDate;
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMinutes < 1) return 'たった今';
        if (diffInMinutes < 60) return `${diffInMinutes}分前`;
        if (diffInHours < 24) return `${diffInHours}時間前`;
        if (diffInDays < 7) return `${diffInDays}日前`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}週間前`;
        return postDate.toLocaleDateString('ja-JP');
    };

    // NEWバッジを表示するかどうか（7日以内）
    const calculateIsNew = (timestamp) => {
        if (!timestamp) return false;
        
        const now = new Date();
        const postDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInDays = Math.floor((now - postDate) / 86400000);
        
        return diffInDays <= 7;
    };

    const filteredPosts = posts;

    // スマホではアニメーションを簡略化
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: isMobile ? 0.05 : 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: isMobile ? 10 : 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: isMobile ? 0.3 : 0.5,
                ease: "easeOut"
            }
        }
    };

    return (
        <div className="mb-12">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mr-2 p-1.5 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 shadow-md"
                    >
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" strokeWidth={2.5} />
                    </motion.div>
                    総合ランキング
                </h2>
            </div>

            {/* Posts Grid */}
            {loadingPosts ? (
                <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                    >
                        <Sparkles className="text-pink-500" size={48} strokeWidth={2} />
                    </motion.div>
                    <p className="mt-4 text-gray-600 font-medium">読み込み中...</p>
                </motion.div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key="all"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 gap-4"
                    >
                        {filteredPosts.map((post, index) => (
                            <RankingCard
                                key={post.id}
                                post={post}
                                index={index}
                                isMobile={isMobile}
                                itemVariants={itemVariants}
                                handleVideoClick={handleVideoClick}
                                handleAccountClick={handleAccountClick}
                                handleLikeClick={handleLikeClick}
                                handleSaveClick={handleSaveClick}
                                localLikedPosts={localLikedPosts}
                                localSavedPosts={localSavedPosts}
                                videoDurations={videoDurations}
                                loadVideoDuration={loadVideoDuration}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

// 個別カードコンポーネント（最適化のため分離）
const RankingCard = React.memo(({ 
    post, 
    index, 
    isMobile,
    itemVariants,
    handleVideoClick, 
    handleAccountClick,
    handleLikeClick, 
    handleSaveClick, 
    localLikedPosts, 
    localSavedPosts,
    videoDurations,
    loadVideoDuration
}) => {
    const videoRef = useRef(null);
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    // Intersection Observer: 画面に表示されたら動画をロード
    useEffect(() => {
        if (!cardRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        
                        // 動画の場合、preloadを有効化
                        if (videoRef.current && post.isVideo) {
                            videoRef.current.preload = 'metadata';
                        }
                        
                        // 再生時間が未取得かつ動画URLがある場合、取得
                        if (post.videoUrl && !videoDurations[post.id] && post.duration === '00:00') {
                            loadVideoDuration(post.id, post.videoUrl);
                        }
                    }
                });
            },
            {
                rootMargin: '50px', // 50px手前から準備開始
                threshold: 0.1
            }
        );

        observer.observe(cardRef.current);

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, [post.id, post.videoUrl, post.isVideo, post.duration, videoDurations, loadVideoDuration]);

    return (
        <motion.div
            ref={cardRef}
            variants={itemVariants}
            whileHover={isMobile ? {} : { y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => handleVideoClick(post)}
            data-testid={`ranking-card-${post.id}`}
        >
            {/* サムネイル */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100">
                {post.thumbnail ? (
                    post.isVideo ? (
                        /* 動画の場合：遅延ロード */
                        <video
                            ref={videoRef}
                            src={isVisible ? post.thumbnail : undefined}
                            className="w-full h-full object-cover"
                            preload="none"
                            muted
                            playsInline
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                    ) : (
                        /* 画像の場合：遅延ロード */
                        <motion.img
                            src={isVisible ? post.thumbnail : undefined}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="text-pink-300" size={48} />
                    </div>
                )}
                {/* エラー時のフォールバック */}
                <div className="hidden w-full h-full items-center justify-center">
                    <Sparkles className="text-pink-300" size={48} />
                </div>
                
                {/* ランキングバッジ */}
                {index < 3 && (
                    <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                        className="absolute top-2 left-2 z-10"
                    >
                        <div className={`
                            w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base shadow-lg
                            ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : ''}
                            ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : ''}
                            ${index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' : ''}
                        `}>
                            {index + 1}
                        </div>
                    </motion.div>
                )}

                {/* NEWバッジ */}
                {post.isNew && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold shadow-lg z-10"
                    >
                        NEW
                    </motion.div>
                )}

                {/* 再生時間 */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Clock size={12} strokeWidth={2.5} />
                    {videoDurations[post.id] || post.duration}
                </div>

                {/* ホバーオーバーレイ（PCのみ） */}
                {!isMobile && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
            </div>

            {/* 投稿情報 */}
            <div className="p-3 sm:p-4">
                {/* タイトル */}
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base group-hover:text-pink-600 transition-colors">
                    {post.title}
                </h3>

                {/* ユーザー情報 */}
                <div 
                    className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={(e) => handleAccountClick(post, e)}
                    data-testid={`user-link-${post.id}`}
                >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-pink-300 flex-shrink-0">
                        {post.user.avatar ? (
                            <img 
                                src={post.user.avatar} 
                                alt={post.user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-pink-600 font-bold text-xs sm:text-sm">
                                {post.user.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">{post.user.name}</p>
                        <p className="text-xs text-gray-500">{post.postedDate}</p>
                    </div>
                </div>

                {/* アクションボタン */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleLikeClick(post.id, e)}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all ${
                            localLikedPosts.has(post.id)
                                ? 'bg-pink-100 text-pink-600'
                                : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        data-testid={`like-button-${post.id}`}
                    >
                        <Heart 
                            size={14} 
                            className={localLikedPosts.has(post.id) ? 'fill-current' : ''} 
                            strokeWidth={2.5}
                        />
                        <span className="text-xs sm:text-sm font-medium">{post.likes}</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleSaveClick(post.id, e)}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all ${
                            localSavedPosts.has(post.id)
                                ? 'bg-pink-100 text-pink-600'
                                : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        data-testid={`save-button-${post.id}`}
                    >
                        <Bookmark 
                            size={14} 
                            className={localSavedPosts.has(post.id) ? 'fill-current' : ''} 
                            strokeWidth={2.5}
                        />
                        <span className="text-xs sm:text-sm font-medium">{post.bookmarks}</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
});

RankingCard.displayName = 'RankingCard';

export default Ranking;
