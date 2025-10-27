import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown, Heart, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

const RankingPosts = ({ activeTimeFilter = 'Daily', activeTagFilter = 'all' }) => {
    const [activeTab] = useState('Post');
    const [visibleSection, setVisibleSection] = useState('overall');
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
    const [rankingPosts, setRankingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [videoDurations, setVideoDurations] = useState({});
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    // Format duration to mm:ss
    const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Handle video metadata loaded
    const handleVideoMetadata = (e, postId) => {
        const duration = e.target.duration;
        // 既に取得済みの場合は何もしない（無限ループ防止）
        if (duration && !isNaN(duration) && !videoDurations[postId]) {
            setVideoDurations(prev => ({
                ...prev,
                [postId]: formatDuration(duration)
            }));
        }
    };

    // Refs for carousel scrolling
    const adultServicesRef = useRef(null);
    const noPantiesRef = useRef(null);
    const spaSectionRef = useRef(null);
    const ntrcheatingSectionRef = useRef(null);
    const ntrcheatingRef = useRef(null);
    const spaRef = useRef(null);
    const chubbyRef = useRef(null);
    const chubbySectionRef = useRef(null);
    const buttRef = useRef(null);
    const buttSectionRef = useRef(null);

    // Refs for section visibility detection
    const overallSectionRef = useRef(null);
    const adultServicesSectionRef = useRef(null);
    const noPantiesSectionRef = useRef(null);

    const handleGenreList = () => {
        navigate('/GenreNavigationSystem');
    };
    
    // Toggle like function
    const toggleLike = (postId) => {
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    // Toggle bookmark function
    const toggleBookmark = (postId) => {
        setBookmarkedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };
    
    // Helper function to check if a post is new (within 3 days)
    const isPostNew = (createdAt) => {
        const now = new Date();
        const postDate = new Date(createdAt);
        const diffInDays = (now - postDate) / (1000 * 60 * 60 * 24);
        return diffInDays <= 3;
    };
    
    // URL変換ヘルパー関数
    const convertToProxyUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('/api/proxy/')) return url;
        if (url.includes('storage.googleapis.com')) {
            const match = url.match(/\/(public|\.private)\/([^?]+)/);
            if (match) {
                const [, folder, filename] = match;
                return `/api/proxy/${folder}/${filename}`;
            }
        }
        if (url.startsWith('/objects/')) {
            const filename = url.replace('/objects/', '');
            return `/api/proxy/public/${filename}`;
        }
        return url;
    };
    
    // Fetch ranking posts from Firestore
    useEffect(() => {
        const fetchRankingPosts = async () => {
            try {
                setLoading(true);
                
                // 全ての公開投稿を取得（クライアント側でソート・フィルタリング）
                const postsQuery = collection(db, 'posts');
                const q = query(
                    postsQuery,
                    where('visibility', '==', 'public'),
                    limit(100)
                );
                
                const querySnapshot = await getDocs(q);
                const fetchedPosts = [];
                const userIds = new Set();
                
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    
                    // 限定コンテンツはランキングから除外
                    if (data.isExclusiveContent === true) {
                        return;
                    }
                    
                    const thumbnail = data.files && data.files.length > 0 
                        ? convertToProxyUrl(data.files[0].thumbnailUrl || data.files[0].url)
                        : null;
                    
                    // tagsを配列に正規化（文字列または配列の可能性がある）
                    let tags = [];
                    if (Array.isArray(data.tags)) {
                        tags = data.tags;
                    } else if (typeof data.tags === 'string' && data.tags.trim()) {
                        tags = [data.tags.trim()];
                    }
                    
                    fetchedPosts.push({
                        id: docSnap.id,
                        title: data.title || 'タイトルなし',
                        likes: data.likes || 0,
                        bookmarks: data.bookmarks || 0,
                        thumbnail: thumbnail,
                        userId: data.userId,
                        userName: data.userName || '匿名',
                        userAvatar: data.userAvatar || null,
                        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
                        tags: tags,
                        duration: data.duration || '00:00',
                        score: (data.likes || 0) + (data.bookmarks || 0)
                    });
                    
                    if (data.userId) {
                        userIds.add(data.userId);
                    }
                });
                
                // ユーザー情報を取得
                const usersMap = {};
                for (const userId of userIds) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', userId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            usersMap[userId] = {
                                userName: userData.displayName || userData.username || '匿名',
                                userAvatar: convertToProxyUrl(userData.photoURL) || null
                            };
                        }
                    } catch (error) {
                        console.error('Error fetching user:', error);
                    }
                }
                
                // ユーザー情報を投稿に統合
                let postsWithUserInfo = fetchedPosts.map(post => ({
                    ...post,
                    creator: usersMap[post.userId]?.userName || post.userName,
                    userName: usersMap[post.userId]?.userName || post.userName,
                    userAvatar: usersMap[post.userId]?.userAvatar || post.userAvatar
                }));
                
                // クライアント側で作成日時でソート（新しい順）
                postsWithUserInfo.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return dateB - dateA;
                });
                
                // クライアント側でタグフィルタリング
                if (activeTagFilter && activeTagFilter !== 'all') {
                    postsWithUserInfo = postsWithUserInfo.filter(post => 
                        post.tags && post.tags.includes(activeTagFilter)
                    );
                }
                
                // スコアでソート
                const sortedPosts = postsWithUserInfo.sort((a, b) => b.score - a.score);
                
                // 上位50件に制限
                const limitedPosts = sortedPosts.slice(0, 50);
                
                setRankingPosts(limitedPosts);
                console.log(`✅ Fetched ${limitedPosts.length} ranking posts with tag filter: ${activeTagFilter}`);
                
            } catch (error) {
                console.error('Error fetching ranking posts:', error);
                
                // Firestoreインデックスエラーの場合はユーザーにわかりやすいメッセージを表示
                if (error.code === 'failed-precondition') {
                    console.error('❌ Firestore index required. Please create the composite index in Firebase Console.');
                    console.error('Index needed: Collection: posts, Fields: visibility (ASC), tags (ASC), createdAt (DESC)');
                }
                
                setRankingPosts([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchRankingPosts();
    }, [activeTagFilter, activeTimeFilter]);

    // Overall ranking data by time period
    const overallRankingDataRaw = {
        Daily: [
            {
                id: 1,
                title: "【今だけ80%OFF】ハマり過ぎて毎日やりたくなっちゃう特別配信",
                duration: "2:00:00",
                likes: 433,
                bookmarks: 151,
                purchaseAmount: 15000,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                thumbnail: rankingImg1,
                creator: "Creator Name",
                timeAgo: "2 hours ago"
            },
            {
                id: 2,
                title: "【人妻だからこそ醸す家庭主婦との配信】",
                duration: "1:59:31",
                likes: 147,
                bookmarks: 138,
                purchaseAmount: 12000,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                thumbnail: rankingImg2,
                creator: "Creator Name",
                timeAgo: "1 day ago"
            },
            {
                id: 3,
                title: "【くろ三百はゲーム実況・レッスン】この流れを見つけた三つの要",
                duration: "1:01:26",
                likes: 157,
                bookmarks: 133,
                purchaseAmount: 8500,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
                thumbnail: rankingImg3,
                creator: "Creator Name",
                timeAgo: "5 hours ago"
            },
            {
                id: 4,
                title: "【女優の身体に慣れては参加できるエピソード全集】",
                duration: "2:54:02",
                likes: 157,
                bookmarks: 89,
                purchaseAmount: 6200,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                thumbnail: rankingImg4,
                creator: "Creator Name",
                timeAgo: "2 days ago"
            },
            {
                id: 5,
                title: "【未開発定期便】ゼーマ美魚中】息子マール、昇って",
                duration: "1:36:25",
                likes: 48,
                bookmarks: 36,
                purchaseAmount: 5800,
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                thumbnail: rankingImg5,
                creator: "Creator Name",
                timeAgo: "6 hours ago"
            },
            {
                id: 6,
                title: "【限定配信】特別なコンテンツをお楽しみください",
                duration: "1:15:30",
                likes: 89,
                bookmarks: 67,
                purchaseAmount: 3200,
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
                thumbnail: rankingImg6,
                creator: "Creator Name",
                timeAgo: "8 days ago"
            }
        ],
        Weekly: [
            {
                id: 7,
                title: "【週間ランキング1位】最高の配信をお届け",
                duration: "2:15:45",
                likes: 892,
                bookmarks: 456,
                purchaseAmount: 45000,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                thumbnail: rankingImg1,
                creator: "Top Creator",
                timeAgo: "2 days ago"
            },
            {
                id: 8,
                title: "【週間話題作】みんなが注目している配信",
                duration: "1:45:20",
                likes: 567,
                bookmarks: 234,
                purchaseAmount: 32000,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
                thumbnail: rankingImg2,
                creator: "Popular Creator",
                timeAgo: "4 days ago"
            },
            {
                id: 9,
                title: "【週間3位】継続的に人気の配信",
                duration: "1:30:15",
                likes: 345,
                bookmarks: 123,
                purchaseAmount: 28000,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                thumbnail: rankingImg3,
                creator: "Rising Creator",
                timeAgo: "5 days ago"
            },
            {
                id: 10,
                title: "【週間4位】注目の新人配信者",
                duration: "55:30",
                likes: 234,
                bookmarks: 89,
                purchaseAmount: 18000,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                thumbnail: rankingImg4,
                creator: "New Creator",
                timeAgo: "1 day ago"
            },
            {
                id: 11,
                title: "【週間5位】安定した人気を誇る配信",
                duration: "2:05:45",
                likes: 198,
                bookmarks: 78,
                purchaseAmount: 15000,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
                thumbnail: rankingImg5,
                creator: "Veteran Creator",
                timeAgo: "1 week ago"
            },
            {
                id: 12,
                title: "【週間6位】話題性抜群のコンテンツ",
                duration: "1:20:10",
                likes: 167,
                bookmarks: 65,
                purchaseAmount: 12000,
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
                thumbnail: rankingImg6,
                creator: "Trending Creator",
                timeAgo: "6 days ago"
            }
        ],
        Monthly: [
            {
                id: 13,
                title: "【月間王者】圧倒的な支持を得た配信",
                duration: "3:00:00",
                likes: 2456,
                bookmarks: 1234,
                purchaseAmount: 185000,
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
                thumbnail: rankingImg1,
                creator: "Champion Creator",
                timeAgo: "2 weeks ago"
            },
            {
                id: 14,
                title: "【月間2位】安定した高評価配信",
                duration: "2:30:45",
                likes: 1567,
                bookmarks: 789,
                purchaseAmount: 125000,
                createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
                thumbnail: rankingImg2,
                creator: "Elite Creator",
                timeAgo: "3 weeks ago"
            },
            {
                id: 15,
                title: "【月間3位】話題沸騰の人気配信",
                duration: "2:00:30",
                likes: 1234,
                bookmarks: 567,
                purchaseAmount: 98000,
                createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
                thumbnail: rankingImg3,
                creator: "Popular Creator",
                timeAgo: "1 month ago"
            },
            {
                id: 16,
                title: "【月間4位】継続的な人気を誇る配信",
                duration: "1:45:15",
                likes: 987,
                bookmarks: 456,
                purchaseAmount: 76000,
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // ~3 weeks ago
                thumbnail: rankingImg4,
                creator: "Consistent Creator",
                timeAgo: "3 weeks ago"
            },
            {
                id: 17,
                title: "【月間5位】注目度急上昇中の配信",
                duration: "1:30:00",
                likes: 765,
                bookmarks: 345,
                purchaseAmount: 65000,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                thumbnail: rankingImg5,
                creator: "Rising Star",
                timeAgo: "2 days ago"
            },
            {
                id: 18,
                title: "【月間6位】クオリティの高い配信",
                duration: "2:15:30",
                likes: 654,
                bookmarks: 298,
                purchaseAmount: 52000,
                createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // ~1 month ago
                thumbnail: rankingImg6,
                creator: "Quality Creator",
                timeAgo: "1 month ago"
            }
        ],
        "All time": [
            {
                id: 19,
                title: "【殿堂入り】史上最高の配信コンテンツ",
                duration: "4:00:00",
                likes: 15678,
                bookmarks: 8901,
                purchaseAmount: 850000,
                createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
                thumbnail: rankingImg1,
                creator: "Legend Creator",
                timeAgo: "6 months ago"
            },
            {
                id: 20,
                title: "【永久保存版】絶対に見るべき名作配信",
                duration: "3:30:45",
                likes: 12345,
                bookmarks: 6789,
                purchaseAmount: 620000,
                createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(), // 8 months ago
                thumbnail: rankingImg2,
                creator: "Master Creator",
                timeAgo: "8 months ago"
            },
            {
                id: 21,
                title: "【歴史的名作】語り継がれる伝説の配信",
                duration: "2:45:20",
                likes: 9876,
                bookmarks: 5432,
                purchaseAmount: 490000,
                createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                thumbnail: rankingImg3,
                creator: "Legendary Creator",
                timeAgo: "1 year ago"
            },
            {
                id: 22,
                title: "【名作選】時代を超えて愛される配信",
                duration: "3:15:10",
                likes: 7890,
                bookmarks: 4321,
                purchaseAmount: 380000,
                createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(), // 10 months ago
                thumbnail: rankingImg4,
                creator: "Classic Creator",
                timeAgo: "10 months ago"
            },
            {
                id: 23,
                title: "【不朽の名作】永遠に残る傑作配信",
                duration: "2:20:35",
                likes: 6543,
                bookmarks: 3210,
                purchaseAmount: 290000,
                createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                thumbnail: rankingImg5,
                creator: "Timeless Creator",
                timeAgo: "1 year ago"
            },
            {
                id: 24,
                title: "【殿堂級】圧倒的クオリティの配信",
                duration: "2:50:45",
                likes: 5678,
                bookmarks: 2890,
                purchaseAmount: 210000,
                createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(), // 8 months ago
                thumbnail: rankingImg6,
                creator: "Hall of Fame Creator",
                timeAgo: "8 months ago"
            }
        ]
    };

    // Sort and process ranking data
    const overallRankingData = Object.keys(overallRankingDataRaw).reduce((acc, period) => {
        // Sort by purchaseAmount (highest first)
        const sorted = [...overallRankingDataRaw[period]].sort((a, b) => b.purchaseAmount - a.purchaseAmount);
        // Add isNew flag based on createdAt
        acc[period] = sorted.map(item => ({
            ...item,
            isNew: isPostNew(item.createdAt)
        }));
        return acc;
    }, {});

    const adultServicesData = [
        {
            id: 1,
            title: "【デリ嬢配信】ゼーマ美魚中】息子マール昇って",
            duration: "1:36:25",
            likes: 48,
            bookmarks: 36,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "1 day ago"
        },
        {
            id: 2,
            title: "【書記の身体マッション】配信配信テーマしない",
            duration: "33:20",
            likes: 5,
            bookmarks: 3,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "10 hours ago"
        },
        {
            id: 3,
            title: "【美緑色の身体】",
            duration: "45:12",
            likes: 2,
            bookmarks: 1,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "1 day ago"
        },
        {
            id: 4,
            title: "【美緑色の身体】",
            duration: "45:12",
            likes: 2,
            bookmarks: 1,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "1 day ago"
        },
        {
            id: 5,
            title: "【美緑色の身体】",
            duration: "45:12",
            likes: 2,
            bookmarks: 1,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "1 day ago"
        },
        {
            id: 6,
            title: "【美緑色の身体】",
            duration: "45:12",
            likes: 2,
            bookmarks: 1,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "1 day ago"
        }
    ];

    const noPantiesData = [
        {
            id: 1,
            title: "9/1まで500円OFF!!【不倫奥さん】嫌山さ◯か似",
            duration: "1:26:22",
            likes: 2,
            bookmarks: 3,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "15 hours ago"
        },
        {
            id: 2,
            title: "【スカートめくり】スカートの奥について",
            duration: "00:45",
            likes: 4,
            bookmarks: 0,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "8 hours ago"
        },
        {
            id: 3,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 4,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 5,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 6,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 7,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        }
    ];
    const ntrcheating = [
        {
            id: 1,
            title: "9/1まで500円OFF!!【不倫奥さん】嫌山さ◯か似",
            duration: "1:26:22",
            likes: 2,
            bookmarks: 3,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "15 hours ago"
        },
        {
            id: 2,
            title: "【スカートめくり】スカートの奥について",
            duration: "00:45",
            likes: 4,
            bookmarks: 0,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "8 hours ago"
        },
        {
            id: 3,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 4,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 5,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 6,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 7,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        }
    ];
    const spa = [
        {
            id: 1,
            title: "9/1まで500円OFF!!【不倫奥さん】嫌山さ◯か似",
            duration: "1:26:22",
            likes: 2,
            bookmarks: 3,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "15 hours ago"
        },
        {
            id: 2,
            title: "【スカートめくり】スカートの奥について",
            duration: "00:45",
            likes: 4,
            bookmarks: 0,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "8 hours ago"
        },
        {
            id: 3,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 4,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 5,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 6,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 7,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        }
    ];
    const chubby = [
        {
            id: 1,
            title: "9/1まで500円OFF!!【不倫奥さん】嫌山さ◯か似",
            duration: "1:26:22",
            likes: 2,
            bookmarks: 3,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "15 hours ago"
        },
        {
            id: 2,
            title: "【スカートめくり】スカートの奥について",
            duration: "00:45",
            likes: 4,
            bookmarks: 0,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "8 hours ago"
        },
        {
            id: 3,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 4,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 5,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 6,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 7,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        }
    ];
    const ButtRanking = [
        {
            id: 1,
            title: "9/1まで500円OFF!!【不倫奥さん】嫌山さ◯か似",
            duration: "1:26:22",
            likes: 2,
            bookmarks: 3,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "15 hours ago"
        },
        {
            id: 2,
            title: "【スカートめくり】スカートの奥について",
            duration: "00:45",
            likes: 4,
            bookmarks: 0,
            isNew: true,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "8 hours ago"
        },
        {
            id: 3,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 4,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 5,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 6,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        },
        {
            id: 7,
            title: "【学生】見えち奥美と女子",
            duration: "12:34",
            likes: 585,
            bookmarks: 234,
            isNew: false,
            thumbnail: rankingImg1,
            creator: "Creator Name",
            timeAgo: "3 months ago"
        }
    ];

    // ジャンル別にフィルタリングする関数
    const filterByGenre = (posts, genreTags) => {
        return posts.filter(post => {
            if (!post.tags || post.tags.length === 0) return false;
            
            // ジャンルタグのいずれかに一致するかチェック
            return genreTags.some(genreTag => 
                post.tags.some(postTag => 
                    postTag.toLowerCase().includes(genreTag.toLowerCase()) ||
                    genreTag.toLowerCase().includes(postTag.toLowerCase())
                )
            );
        });
    };

    // 各ジャンル別ランキングデータ（Firestoreベース）
    const climaxRankingFirestore = filterByGenre(rankingPosts, ['絶頂', 'climax', 'オーガズム', 'orgasm']);
    const gonzoRankingFirestore = filterByGenre(rankingPosts, ['ハメ撮り', 'gonzo', '個人撮影', 'personalFilming']);
    const shavedRankingFirestore = filterByGenre(rankingPosts, ['パイパン', 'shaved', 'smooth', 'hairless']);
    const beautyRankingFirestore = filterByGenre(rankingPosts, ['美女', 'beautiful', 'beauty', 'gorgeous']);
    const lotionOilRankingFirestore = filterByGenre(rankingPosts, ['ローション', 'オイル', 'lotion', 'oil']);
    const analRankingFirestore = filterByGenre(rankingPosts, ['アナル', 'anal']);
    const adultServicesDataFirestore = filterByGenre(rankingPosts, ['デリヘル', 'adult', 'デリ']);
    const noPantiesDataFirestore = filterByGenre(rankingPosts, ['ノーパン', 'noPanties', 'ノーパン配信']);
    const ntrcheatingFirestore = filterByGenre(rankingPosts, ['寝取られ', 'ntr', '不倫', 'cheating', 'NTR']);
    const spaFirestore = filterByGenre(rankingPosts, ['エステ', 'spa', 'マッサージ']);
    const chubbyFirestore = filterByGenre(rankingPosts, ['ぽっちゃり', 'chubby', 'ムチムチ']);
    const buttRankingFirestore = filterByGenre(rankingPosts, ['お尻', 'butt', '尻', 'けつ']);

    // Intersection Observer to detect visible sections
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (entry.target === overallSectionRef.current) {
                            setVisibleSection('overall');
                        } else if (entry.target === adultServicesSectionRef.current) {
                            setVisibleSection('adult');
                        } else if (entry.target === noPantiesSectionRef.current) {
                            setVisibleSection('nopanties');
                        }
                    }
                });
            },
            {
                threshold: 0.3,
                rootMargin: '-88px 0px -50% 0px'
            }
        );

        if (overallSectionRef.current) observer.observe(overallSectionRef.current);
        if (adultServicesSectionRef.current) observer.observe(adultServicesSectionRef.current);
        if (noPantiesSectionRef.current) observer.observe(noPantiesSectionRef.current);

        return () => observer.disconnect();
    }, []);

    const scrollCarousel = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = 300;
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Content card for carousel sections
    const ContentCard = ({ item, showRanking = false, rank }) => {
        const isLiked = likedPosts.has(item.id);
        const isBookmarked = bookmarkedPosts.has(item.id);
        
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl relative cursor-pointer"
                data-testid={`content-card-${item.id}`}
            >
                <div className="relative aspect-square">
                    <motion.img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                    />
                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {item.isNew && (
                        <motion.div 
                            className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            data-testid={`new-badge-${item.id}`}
                        >
                            NEW
                        </motion.div>
                    )}
                    {showRanking && (
                        <motion.div 
                            className="absolute top-3 left-3 bg-gradient-to-br from-pink-500 to-pink-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-lg"
                            whileHover={{ scale: 1.1 }}
                            data-testid={`rank-badge-${rank}`}
                        >
                            #{rank}
                        </motion.div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-sm px-2.5 py-1 rounded-lg font-semibold">
                        {item.duration}
                    </div>
                </div>

                <div className="p-3">
                    <motion.h3 
                        className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {item.title}
                    </motion.h3>

                    <motion.div 
                        className="flex items-center gap-2 mb-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <img
                            src="https://via.placeholder.com/24x24/cccccc/ffffff?text=U"
                            alt="Creator"
                            className="w-6 h-6 rounded-full"
                        />
                        <span className="text-xs text-gray-600 truncate">{item.creator}</span>
                    </motion.div>

                    <motion.div 
                        className="flex items-center gap-4 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.button 
                            className="flex items-center gap-1.5 hover:bg-pink-50 p-1.5 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(item.id);
                            }}
                            data-testid={`button-like-${item.id}`}
                        >
                            <Heart 
                                className={`w-4 h-4 transition-all ${
                                    isLiked 
                                        ? 'text-pink-500 fill-pink-500' 
                                        : 'text-gray-400 hover:text-pink-500'
                                }`}
                            />
                            <span 
                                className={`font-bold ${
                                    isLiked 
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent' 
                                        : 'text-gray-600'
                                }`}
                                data-testid={`count-likes-${item.id}`}
                            >
                                {item.likes + (isLiked ? 1 : 0)}
                            </span>
                        </motion.button>
                        <motion.button 
                            className="flex items-center gap-1.5 hover:bg-pink-50 p-1.5 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(item.id);
                            }}
                            data-testid={`button-bookmark-${item.id}`}
                        >
                            <Bookmark 
                                className={`w-4 h-4 transition-all ${
                                    isBookmarked 
                                        ? 'text-pink-500 fill-pink-500' 
                                        : 'text-gray-400 hover:text-pink-500'
                                }`}
                            />
                            <span 
                                className={`font-bold ${
                                    isBookmarked 
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent' 
                                        : 'text-gray-600'
                                }`}
                                data-testid={`count-bookmarks-${item.id}`}
                            >
                                {item.bookmarks + (isBookmarked ? 1 : 0)}
                            </span>
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        );
    };

    // Grid card for overall ranking
    const GridCard = ({ item, rank }) => {
        const isLiked = likedPosts.has(item.id);
        const isBookmarked = bookmarkedPosts.has(item.id);
        
        // ビデオファイルかどうかをチェック
        const isVideo = item.thumbnail && (
            item.thumbnail.includes('.mp4') || 
            item.thumbnail.includes('.MP4') ||
            item.thumbnail.includes('.quicktime') || 
            item.thumbnail.includes('.MOV') || 
            item.thumbnail.includes('.mov')
        );
        
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl relative cursor-pointer"
                data-testid={`grid-card-${item.id}`}
                onClick={() => navigate(`/video/${item.id}`)}
            >
                <div className="relative aspect-square">
                    {isVideo ? (
                        <video
                            src={item.thumbnail}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                            onLoadedMetadata={(e) => handleVideoMetadata(e, item.id)}
                            style={{ pointerEvents: 'none' }}
                        />
                    ) : (
                        <motion.img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                        />
                    )}
                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {item.isNew && (
                        <motion.div 
                            className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            data-testid={`new-badge-${item.id}`}
                        >
                            NEW
                        </motion.div>
                    )}
                    <motion.div 
                        className="absolute top-3 left-3 bg-gradient-to-br from-pink-500 to-pink-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        data-testid={`rank-badge-${rank}`}
                    >
                        #{rank}
                    </motion.div>
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-sm px-2.5 py-1 rounded-lg font-semibold" data-testid={`duration-${item.id}`}>
                        {videoDurations[item.id] || item.duration || '00:00'}
                    </div>
                </div>

                <div className="p-3">
                    <motion.h3 
                        className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {item.title}
                    </motion.h3>

                    <motion.div 
                        className="flex items-center gap-2 mb-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {item.userAvatar ? (
                            <img
                                src={item.userAvatar}
                                alt={item.creator || item.userName}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                                {(item.creator || item.userName || '?').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-xs text-gray-600 truncate">{item.creator || item.userName || t('rankingPage.creatorName')}</span>
                    </motion.div>

                    <motion.div 
                        className="flex items-center gap-4 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.button 
                            className="flex items-center gap-1.5 hover:bg-pink-50 p-1.5 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(item.id);
                            }}
                            data-testid={`button-like-${item.id}`}
                        >
                            <Heart 
                                className={`w-4 h-4 transition-all ${
                                    isLiked 
                                        ? 'text-pink-500 fill-pink-500' 
                                        : 'text-gray-400 hover:text-pink-500'
                                }`}
                            />
                            <span 
                                className={`font-bold ${
                                    isLiked 
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent' 
                                        : 'text-gray-600'
                                }`}
                                data-testid={`count-likes-${item.id}`}
                            >
                                {item.likes + (isLiked ? 1 : 0)}
                            </span>
                        </motion.button>
                        <motion.button 
                            className="flex items-center gap-1.5 hover:bg-pink-50 p-1.5 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(item.id);
                            }}
                            data-testid={`button-bookmark-${item.id}`}
                        >
                            <Bookmark 
                                className={`w-4 h-4 transition-all ${
                                    isBookmarked 
                                        ? 'text-pink-500 fill-pink-500' 
                                        : 'text-gray-400 hover:text-pink-500'
                                }`}
                            />
                            <span 
                                className={`font-bold ${
                                    isBookmarked 
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent' 
                                        : 'text-gray-600'
                                }`}
                                data-testid={`count-bookmarks-${item.id}`}
                            >
                                {item.bookmarks + (isBookmarked ? 1 : 0)}
                            </span>
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        );
    };


    // Get the section title for sticky header
    const getSectionTitle = () => {
        switch (visibleSection) {
            case 'overall':
                return t('rankingPage.overallRanking');
            case 'adult':
                return t('rankingPage.adultServicesRanking');
            case 'nopanties':
                return t('rankingPage.noPantiesRanking');
            case 'ntrcheating':
                return t('rankingPage.ntrCheatingRanking');
            case 'spa':
                return t('rankingPage.spaRanking');
            case 'chubby':
                return t('rankingPage.chubbyRanking');
            case 'butt':
                return t('rankingPage.buttRanking');

            default:
                return t('rankingPage.overallRanking');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-15">

            {/* Content */}
            <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
                {activeTab === 'Post' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Overall Ranking Section - Horizontal Swipeable Grid */}
                        <div ref={overallSectionRef} className="mb-6 sm:mb-8">
                            <motion.div 
                                className="flex items-center justify-between mb-4"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex items-center space-x-2">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                    </motion.div>
                                    <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{t('rankingPage.overallRanking')}</h2>
                                </div>
                                <div className="text-xs text-gray-500 hidden sm:block">
                                    👉 スワイプ
                                </div>
                            </motion.div>
                            <div 
                                className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                style={{ 
                                    WebkitOverflowScrolling: 'touch',
                                    scrollBehavior: 'smooth'
                                }}
                                data-testid="overall-ranking-scroll-container"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-gray-500">読み込み中...</div>
                                    </div>
                                ) : rankingPosts.length > 0 ? (
                                    <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                        {rankingPosts.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = rankingPosts[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`${activeTimeFilter}-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-gray-500">投稿がありません</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Climax Ranking Section */}
                        <div className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">絶頂ランキング</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    {climaxRankingFirestore.length > 0 ? (
                                        <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                            {climaxRankingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = climaxRankingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`climax-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-gray-500">投稿がありません</div>
                                        </div>
                                    )}
                                </div>
                        </div>

                        {/* Gonzo Ranking Section */}
                        <div className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">ハメ撮りランキング</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    {gonzoRankingFirestore.length > 0 ? (
                                        <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                            {gonzoRankingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = gonzoRankingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`gonzo-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-gray-500">投稿がありません</div>
                                        </div>
                                    )}
                                </div>
                        </div>

                        {/* Shaved Ranking Section */}
                        <div className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">パイパンランキング</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    {shavedRankingFirestore.length > 0 ? (
                                        <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                            {shavedRankingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = shavedRankingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`shaved-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-gray-500">投稿がありません</div>
                                        </div>
                                    )}
                                </div>
                        </div>

                        {/* Beauty Ranking Section */}
                        <div className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">美女ランキング</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    {beautyRankingFirestore.length > 0 ? (
                                        <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                            {beautyRankingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = beautyRankingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`beauty-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-gray-500">投稿がありません</div>
                                        </div>
                                    )}
                                </div>
                        </div>

                        {/* Lotion Oil Ranking Section */}
                        <div className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">ローション・オイルランキング</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    {lotionOilRankingFirestore.length > 0 ? (
                                        <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                            {lotionOilRankingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = lotionOilRankingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`lotion-oil-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-gray-500">投稿がありません</div>
                                        </div>
                                    )}
                                </div>
                        </div>

                        {/* Anal Ranking Section */}
                        <div className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">アナルランキング</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    {analRankingFirestore.length > 0 ? (
                                        <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                            {analRankingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = analRankingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`anal-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-gray-500">投稿がありません</div>
                                        </div>
                                    )}
                                </div>
                        </div>

                        {/* Adult Services Ranking Section */}
                        {adultServicesDataFirestore.length > 0 && (
                            <div ref={adultServicesSectionRef} className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{t('rankingPage.adultServicesRanking')}</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                        {adultServicesDataFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = adultServicesDataFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`adult-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Panties Ranking Section */}
                        {noPantiesDataFirestore.length > 0 && (
                            <div ref={noPantiesSectionRef} className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{t('rankingPage.noPantiesRanking')}</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                        {noPantiesDataFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = noPantiesDataFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`nopanties-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NTR/Cheating Ranking Section */}
                        {ntrcheatingFirestore.length > 0 && (
                            <div ref={ntrcheatingSectionRef} className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{t('rankingPage.ntrCheatingRanking')}</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                        {ntrcheatingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = ntrcheatingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`ntr-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Spa Ranking Section */}
                        {spaFirestore.length > 0 && (
                            <div ref={spaSectionRef} className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{t('rankingPage.spaRanking')}</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                        {spaFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = spaFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`spa-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chubby Ranking Section */}
                        {chubbyFirestore.length > 0 && (
                            <div ref={chubbySectionRef} className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{t('rankingPage.chubbyRanking')}</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                        {chubbyFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = chubbyFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`chubby-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Butt Ranking Section */}
                        {buttRankingFirestore.length > 0 && (
                            <div ref={buttSectionRef} className="mb-6 sm:mb-8">
                                <motion.div 
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Crown className="w-6 h-6 text-pink-500 fill-pink-500" />
                                        </motion.div>
                                        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{t('rankingPage.buttRanking')}</h2>
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        👉 スワイプ
                                    </div>
                                </motion.div>
                                <div 
                                    className="overflow-x-auto scrollbar-hide touch-pan-x snap-x snap-mandatory"
                                    style={{ 
                                        WebkitOverflowScrolling: 'touch',
                                        scrollBehavior: 'smooth'
                                    }}
                                >
                                    <div className="flex space-x-3 pb-4" style={{ width: 'max-content' }}>
                                        {buttRankingFirestore.reduce((pairs, item, index) => {
                                            if (index % 2 === 0) {
                                                const nextItem = buttRankingFirestore[index + 1];
                                                pairs.push([item, nextItem]);
                                            }
                                            return pairs;
                                        }, []).map((pair, pairIndex) => (
                                            <motion.div
                                                key={`butt-pair-${pairIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: pairIndex * 0.1 }}
                                                className="flex space-x-3 flex-shrink-0 snap-start"
                                            >
                                                <div className="w-48 aspect-square">
                                                    <GridCard
                                                        item={pair[0]}
                                                        rank={pairIndex * 2 + 1}
                                                    />
                                                </div>
                                                {pair[1] && (
                                                    <div className="w-48 aspect-square">
                                                        <GridCard
                                                            item={pair[1]}
                                                            rank={pairIndex * 2 + 2}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* All Genres Button */}
                        <div className="text-center mt-6 sm:mt-8">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGenreList}
                                className="bg-pink-500 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-full text-sm sm:text-base font-semibold hover:bg-pink-600 transition-colors"
                            >
                                {t('postPage.allgenres')}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'Creator' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-20"
                    >
                        <div className="text-gray-500 text-lg">
                            {t('postPage.creatorcomingsoon')}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default RankingPosts;