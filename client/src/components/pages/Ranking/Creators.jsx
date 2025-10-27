import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Plus, Eye, Heart, Users, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { useAuth } from '../../../context/AuthContext';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import creatorImg1 from '@assets/スクリーンショット 2025-10-08 22.17.14_1760917144953.png';

const Creator = ({ activeTimeFilter }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const db = getFirestore();
    const [followedCreators, setFollowedCreators] = useState(new Set());
    const [creatorsData, setCreatorsData] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleClick = () => {
        navigate('/GenreNavigationSystem');
    };

    // Load followed creators from Firestore
    useEffect(() => {
        const loadFollowedCreators = async () => {
            if (!currentUser) return;
            
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const following = userDoc.data().following || [];
                    setFollowedCreators(new Set(following));
                }
            } catch (error) {
                console.error('Error loading followed creators:', error);
            }
        };

        loadFollowedCreators();
    }, [currentUser, db]);

    // Firestoreから承認されたクリエイターと投稿データを取得
    useEffect(() => {
        const fetchCreatorsData = async () => {
            setLoading(true);
            try {
                // 期間の日付範囲を計算
                const getDateRange = () => {
                    const now = new Date();
                    const startDate = new Date();
                    
                    switch (activeTimeFilter) {
                        case 'Daily':
                            startDate.setDate(now.getDate() - 1);
                            break;
                        case 'Weekly':
                            startDate.setDate(now.getDate() - 7);
                            break;
                        case 'Monthly':
                            startDate.setMonth(now.getMonth() - 1);
                            break;
                        case 'AllTime':
                            startDate.setFullYear(2000, 0, 1);
                            break;
                        default:
                            startDate.setMonth(now.getMonth() - 1);
                    }
                    
                    return startDate;
                };

                const startDate = getDateRange();

                // 期間内の投稿を取得
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('createdAt', '>=', startDate),
                    orderBy('createdAt', 'desc'),
                    limit(500)
                );

                const postsSnapshot = await getDocs(postsQuery);
                const creatorStats = {};

                // 投稿を集計
                postsSnapshot.docs.forEach((doc) => {
                    const post = doc.data();
                    const userId = post.userId;
                    
                    if (!creatorStats[userId]) {
                        creatorStats[userId] = {
                            likes: 0,
                            bookmarks: 0,
                            posts: 0
                        };
                    }
                    
                    creatorStats[userId].likes += post.likes || 0;
                    creatorStats[userId].bookmarks += post.bookmarks || 0;
                    creatorStats[userId].posts += 1;
                });

                // クリエイター情報を取得
                const creatorIds = Object.keys(creatorStats);
                if (creatorIds.length === 0) {
                    setCreatorsData([]);
                    setLoading(false);
                    return;
                }

                // クリエイター情報を取得（バッチ処理）
                const chunks = [];
                for (let i = 0; i < creatorIds.length; i += 10) {
                    chunks.push(creatorIds.slice(i, i + 10));
                }

                const fetchedCreators = [];
                for (const chunk of chunks) {
                    const usersQuery = query(
                        collection(db, 'users'),
                        where('__name__', 'in', chunk)
                    );
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.docs.forEach(doc => {
                        const userData = doc.data();
                        
                        // 承認されたクリエイターのみを表示
                        if (userData.isCreator && userData.creatorStatus === 'approved') {
                            const stats = creatorStats[doc.id];
                            fetchedCreators.push({
                                id: doc.id,
                                name: userData.displayName || userData.name || '名無しさん',
                                avatar: userData.photoURL || userData.avatar || creatorImg1,
                                backgroundImage: userData.photoURL || userData.avatar || creatorImg1,
                                followers: formatNumber(userData.followers || 0),
                                likes: formatNumber(stats.likes),
                                description: userData.bio || userData.description || '',
                                isVerified: true,
                                plan: "見放題プラン",
                                planPrice: "¥6,980",
                                posts: stats.posts.toString(),
                                recommendation: "💙 見放題プラン 💙",
                                purchaseAmount: stats.likes + stats.bookmarks
                            });
                        }
                    });
                }

                console.log(`✅ Fetched ${fetchedCreators.length} approved creators for ${activeTimeFilter}`);
                setCreatorsData(fetchedCreators);
            } catch (error) {
                console.error('Error fetching creators data:', error);
                setCreatorsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCreatorsData();
    }, [activeTimeFilter, db]);

    // 数値をフォーマット（例: 1234 → 1.2K）
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Toggle follow/unfollow
    const toggleFollow = async (creatorId) => {
        if (!currentUser) {
            alert(t('pleaseLogin'));
            return;
        }

        const isFollowing = followedCreators.has(creatorId);
        const userRef = doc(db, 'users', currentUser.uid);

        try {
            if (isFollowing) {
                // Unfollow
                await updateDoc(userRef, {
                    following: arrayRemove(creatorId)
                });
                setFollowedCreators(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(creatorId);
                    return newSet;
                });
            } else {
                // Follow
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    await updateDoc(userRef, {
                        following: arrayUnion(creatorId)
                    });
                } else {
                    await setDoc(userRef, {
                        following: [creatorId]
                    }, { merge: true });
                }
                setFollowedCreators(prev => new Set([...prev, creatorId]));
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            alert('フォロー操作に失敗しました');
        }
    };

    // Sort creators by purchaseAmount (highest first) and add rank
    const sortedCreators = useMemo(() => {
        return [...creatorsData].sort((a, b) => b.purchaseAmount - a.purchaseAmount);
    }, [creatorsData]);

    const topCreator = sortedCreators[0];
    const otherCreators = sortedCreators.slice(1);

    // ローディング状態
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-gray-200 rounded w-1/3" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                <div className="h-4 bg-gray-200 rounded w-2/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // データがない状態
    if (sortedCreators.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <Users className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">
                    この期間に承認されたクリエイターがいません
                </p>
            </div>
        );
    }

    const TopCreatorCard = ({ creator, categoryTitle }) => {
        const isFollowing = followedCreators.has(creator.id);
        
        return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 mb-4 relative"
            data-testid="card-top-creator"
        >
            {/* Ranking Badge */}
            <motion.div 
                className="absolute top-4 left-4 z-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                data-testid="rank-badge-1"
            >
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white text-lg font-bold px-4 py-2 rounded-full shadow-lg">
                    1位
                </div>
            </motion.div>

            {/* Profile Image - No Background Header */}
            <div className="pt-8 flex justify-center">
                <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <div 
                        className="relative cursor-pointer"
                        onClick={() => navigate(`/creator-profile/${creator.id}`)}
                    >
                        <motion.img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-pink-200 shadow-2xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                            data-testid={`img-avatar-${creator.id}`}
                        />
                        {creator.isVerified && (
                            <motion.div 
                                className="absolute -top-1 -right-1 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full p-1.5 shadow-lg"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                data-testid={`verified-badge-${creator.id}`}
                            >
                                <Crown className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Profile Content */}
            <div className="pt-4 pb-4 px-4 text-center">
                <motion.h3 
                    className="text-xl sm:text-2xl font-bold text-gray-900 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    data-testid={`text-creator-name-${creator.id}`}
                >
                    {creator.name}
                </motion.h3>

                <motion.div 
                    className="flex items-center justify-center space-x-6 text-sm mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <motion.div 
                        className="flex items-center space-x-1.5"
                        whileHover={{ scale: 1.1 }}
                        data-testid={`count-likes-${creator.id}`}
                    >
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        <span className="font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">{creator.likes}</span>
                    </motion.div>
                    <motion.div 
                        className="flex items-center space-x-1.5"
                        whileHover={{ scale: 1.1 }}
                        data-testid={`count-followers-${creator.id}`}
                    >
                        <Users className="w-5 h-5 text-pink-500 fill-pink-500" />
                        <span className="font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">{creator.followers}</span>
                        <span className="text-gray-500 text-xs">{t('creatorPage.followers')}</span>
                    </motion.div>
                </motion.div>

                <motion.p 
                    className="text-sm text-gray-600 mb-4 px-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    data-testid={`text-description-${creator.id}`}
                >
                    {creator.description}
                </motion.p>

                {/* Follow Button */}
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(creator.id);
                    }}
                    className={`w-full py-3 rounded-xl text-base font-bold transition-all shadow-lg flex items-center justify-center space-x-2 ${
                        isFollowing
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-pink-200'
                    }`}
                    data-testid={`button-follow-${creator.id}`}
                >
                    {isFollowing ? (
                        <>
                            <UserCheck className="w-5 h-5" />
                            <span>フォロー中</span>
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-5 h-5" />
                            <span>{t('creatorPage.subscribe')}</span>
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
        );
    };

    const CreatorListItem = ({ creator, rank }) => {
        const isFollowing = followedCreators.has(creator.id);
        
        return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02, x: 5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md mb-2"
            data-testid={`card-creator-${creator.id}`}
        >
            <motion.div 
                className="flex-shrink-0"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white text-sm font-bold px-2.5 py-1.5 rounded-full w-10 h-10 flex items-center justify-center shadow-md" data-testid={`rank-badge-${rank}`}>
                    {rank}位
                </div>
            </motion.div>

            <motion.div
                className="relative flex-shrink-0 cursor-pointer"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(`/creator-profile/${creator.id}`)}
            >
                <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-pink-200 shadow-md"
                    data-testid={`img-avatar-${creator.id}`}
                />
                {creator.isVerified && (
                    <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full p-0.5 shadow-md" data-testid={`verified-badge-${creator.id}`}>
                        <Crown className="w-3 h-3 fill-white" />
                    </div>
                )}
            </motion.div>

            <div className="flex-1 min-w-0">
                <motion.h4 
                    className="text-sm sm:text-base font-bold text-gray-900 truncate mb-1"
                    whileHover={{ scale: 1.02 }}
                    data-testid={`text-creator-name-${creator.id}`}
                >
                    {creator.name}
                </motion.h4>
                <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1" data-testid={`count-followers-${creator.id}`}>
                        <Users className="w-3.5 h-3.5 text-pink-500" />
                        <span className="font-semibold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">{creator.followers}</span>
                    </div>
                    <div className="flex items-center space-x-1" data-testid={`count-likes-${creator.id}`}>
                        <Heart className="w-3.5 h-3.5 text-pink-500" />
                        <span className="font-semibold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">{creator.likes}</span>
                    </div>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow(creator.id);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md flex items-center space-x-1 ${
                    isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-pink-200'
                }`}
                data-testid={`button-follow-${creator.id}`}
            >
                {isFollowing ? (
                    <>
                        <UserCheck className="w-4 h-4" />
                        <span>フォロー中</span>
                    </>
                ) : (
                    <>
                        <UserPlus className="w-4 h-4" />
                        <span>{t('creatorPage.subscribe')}</span>
                    </>
                )}
            </motion.button>
        </motion.div>
        );
    };

    return (
        <div className="space-y-6 pb-6">
            {/* Overall Ranking Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center space-x-2 mb-4 px-2" data-testid="section-overall-ranking">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Crown className="w-6 h-6 text-pink-600 fill-pink-600" />
                    </motion.div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                        {t('creatorPage.overallRanking')}
                    </h2>
                </div>

                {/* Top Creator Card */}
                {topCreator && <TopCreatorCard creator={topCreator} categoryTitle={t('creatorPage.overallRanking')} />}

                {/* Other Creators List */}
                <div className="space-y-2">
                    {otherCreators.map((creator, index) => (
                        <CreatorListItem 
                            key={creator.id} 
                            creator={creator} 
                            rank={index + 2}
                        />
                    ))}
                </div>

                {/* Show All Button */}
                <motion.button
                    onClick={handleClick}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg shadow-pink-200 flex items-center justify-center space-x-2"
                    data-testid="button-show-all-creators"
                >
                    <Eye className="w-5 h-5" />
                    <span>{t('creatorPage.seeAll')}</span>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Creator;
