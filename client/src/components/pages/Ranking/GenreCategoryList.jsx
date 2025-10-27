import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BottomNavigationWithCreator from '../../BottomNavigationWithCreator';
import {
    ArrowLeft,
    ChevronRight,
    Info,
    User,
    Play,
    Heart,
    MapPin,
    Shirt
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';


const GenreSubcategoryPage = ({ selectedGenre, onBack, onSubcategorySelect }) => {
    // Information notices at the top
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSubcategoryClick = (genreName) => {
        navigate(`/genre/${encodeURIComponent(genreName)}`);
    };

    const notices = [
        { id: 1, title: t('notices.creditCard'), icon: Info },
        { id: 2, title: t('notices.termsUpdate'), icon: Info }
    ];

    // State for dynamic genre counts
    const [genreCounts, setGenreCounts] = useState({});

    // Function to get genre count from Firestore
    const getGenreCount = async (genreName) => {
        try {
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, where('genres', 'array-contains', genreName));
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error(`Error getting count for genre "${genreName}":`, error);
            return 0;
        }
    };

    // Load genre counts on mount
    useEffect(() => {
        const fetchAllGenreCounts = async () => {
            const allGenreNames = [
                // Appearance
                'ロリ顔', '地味顔', 'ギャル', 'お姉さん', '熟女', 'デカ尻', '巨乳', '貧乳', '入れ墨',
                // Play
                '正常位', '騎乗位', 'バック', '種付けプレス', 'フェラチオ', 'パイずり', '中だし', '顔射', 
                '言葉責め', 'クンニ', '玩具', '潮吹き（女）', 'アナル', '企画',
                // Situation
                '複数プレイ', '女性優位', '寝取られ', '野外・露出', 'オナニー', 'ハメ撮り', 'コスプレ', 
                '主観', '盗撮', 'レイプ', 'ＧＬ', 'ＢＬ',
                // Abnormal
                '緊縛', '浣腸', '調教', '拡張', '殴打', '女装・男の娘', '潮吹き（男）', '尿道', 'その他フェチ',
                // Other
                '会いに行ける', 'イベント', 'HowTo', 'ASMR'
            ];

            const counts = {};
            for (const genreName of allGenreNames) {
                const count = await getGenreCount(genreName);
                counts[genreName] = count;
            }
            setGenreCounts(counts);
            console.log('📊 All genre counts loaded:', counts);
        };

        fetchAllGenreCounts();
    }, []);

    // Genre data with subcategories (counts will be updated from state)
    const genreData = {
        appearance: {
            title: 'ビジュアル',
            icon: User,
            subcategories: [
                { name: 'ロリ顔', posts: `${(genreCounts['ロリ顔'] || 0).toLocaleString()} posts` },
                { name: '地味顔', posts: `${(genreCounts['地味顔'] || 0).toLocaleString()} posts` },
                { name: 'ギャル', posts: `${(genreCounts['ギャル'] || 0).toLocaleString()} posts` },
                { name: 'お姉さん', posts: `${(genreCounts['お姉さん'] || 0).toLocaleString()} posts` },
                { name: '熟女', posts: `${(genreCounts['熟女'] || 0).toLocaleString()} posts` },
                { name: 'デカ尻', posts: `${(genreCounts['デカ尻'] || 0).toLocaleString()} posts` },
                { name: '巨乳', posts: `${(genreCounts['巨乳'] || 0).toLocaleString()} posts` },
                { name: '貧乳', posts: `${(genreCounts['貧乳'] || 0).toLocaleString()} posts` },
                { name: '入れ墨', posts: `${(genreCounts['入れ墨'] || 0).toLocaleString()} posts` }
            ]
        },
        play: {
            title: 'プレイ',
            icon: Play,
            subcategories: [
                { name: '正常位', posts: `${(genreCounts['正常位'] || 0).toLocaleString()} posts` },
                { name: '騎乗位', posts: `${(genreCounts['騎乗位'] || 0).toLocaleString()} posts` },
                { name: 'バック', posts: `${(genreCounts['バック'] || 0).toLocaleString()} posts` },
                { name: '種付けプレス', posts: `${(genreCounts['種付けプレス'] || 0).toLocaleString()} posts` },
                { name: 'フェラチオ', posts: `${(genreCounts['フェラチオ'] || 0).toLocaleString()} posts` },
                { name: 'パイずり', posts: `${(genreCounts['パイずり'] || 0).toLocaleString()} posts` },
                { name: '中だし', posts: `${(genreCounts['中だし'] || 0).toLocaleString()} posts` },
                { name: '顔射', posts: `${(genreCounts['顔射'] || 0).toLocaleString()} posts` },
                { name: '言葉責め', posts: `${(genreCounts['言葉責め'] || 0).toLocaleString()} posts` },
                { name: 'クンニ', posts: `${(genreCounts['クンニ'] || 0).toLocaleString()} posts` },
                { name: '玩具', posts: `${(genreCounts['玩具'] || 0).toLocaleString()} posts` },
                { name: '潮吹き（女）', posts: `${(genreCounts['潮吹き（女）'] || 0).toLocaleString()} posts` },
                { name: 'アナル', posts: `${(genreCounts['アナル'] || 0).toLocaleString()} posts` },
                { name: '企画', posts: `${(genreCounts['企画'] || 0).toLocaleString()} posts` }
            ]
        },
        situation: {
            title: 'シチュエーション',
            icon: MapPin,
            subcategories: [
                { name: '複数プレイ', posts: `${(genreCounts['複数プレイ'] || 0).toLocaleString()} posts` },
                { name: '女性優位', posts: `${(genreCounts['女性優位'] || 0).toLocaleString()} posts` },
                { name: '寝取られ', posts: `${(genreCounts['寝取られ'] || 0).toLocaleString()} posts` },
                { name: '野外・露出', posts: `${(genreCounts['野外・露出'] || 0).toLocaleString()} posts` },
                { name: 'オナニー', posts: `${(genreCounts['オナニー'] || 0).toLocaleString()} posts` },
                { name: 'ハメ撮り', posts: `${(genreCounts['ハメ撮り'] || 0).toLocaleString()} posts` },
                { name: 'コスプレ', posts: `${(genreCounts['コスプレ'] || 0).toLocaleString()} posts` },
                { name: '主観', posts: `${(genreCounts['主観'] || 0).toLocaleString()} posts` },
                { name: '盗撮', posts: `${(genreCounts['盗撮'] || 0).toLocaleString()} posts` },
                { name: 'レイプ', posts: `${(genreCounts['レイプ'] || 0).toLocaleString()} posts` },
                { name: 'ＧＬ', posts: `${(genreCounts['ＧＬ'] || 0).toLocaleString()} posts` },
                { name: 'ＢＬ', posts: `${(genreCounts['ＢＬ'] || 0).toLocaleString()} posts` }
            ]
        },
        abnormal: {
            title: 'アブノーマル',
            icon: Heart,
            subcategories: [
                { name: '緊縛', posts: `${(genreCounts['緊縛'] || 0).toLocaleString()} posts` },
                { name: '浣腸', posts: `${(genreCounts['浣腸'] || 0).toLocaleString()} posts` },
                { name: '調教', posts: `${(genreCounts['調教'] || 0).toLocaleString()} posts` },
                { name: '拡張', posts: `${(genreCounts['拡張'] || 0).toLocaleString()} posts` },
                { name: '殴打', posts: `${(genreCounts['殴打'] || 0).toLocaleString()} posts` },
                { name: '女装・男の娘', posts: `${(genreCounts['女装・男の娘'] || 0).toLocaleString()} posts` },
                { name: '潮吹き（男）', posts: `${(genreCounts['潮吹き（男）'] || 0).toLocaleString()} posts` },
                { name: '尿道', posts: `${(genreCounts['尿道'] || 0).toLocaleString()} posts` },
                { name: 'その他フェチ', posts: `${(genreCounts['その他フェチ'] || 0).toLocaleString()} posts` }
            ]
        },
        other: {
            title: 'その他',
            icon: Shirt,
            subcategories: [
                { name: '会いに行ける', posts: `${(genreCounts['会いに行ける'] || 0).toLocaleString()} posts` },
                { name: 'イベント', posts: `${(genreCounts['イベント'] || 0).toLocaleString()} posts` },
                { name: 'HowTo', posts: `${(genreCounts['HowTo'] || 0).toLocaleString()} posts` },
                { name: 'ASMR', posts: `${(genreCounts['ASMR'] || 0).toLocaleString()} posts` }
            ]
        }
    };

    // Get current genre data or default
    const currentGenre = genreData[selectedGenre] || genreData.appearance;

    const NoticeItem = ({ notice }) => (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg mb-3"
        >
            <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <notice.icon className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm text-blue-800 font-medium">
                    {notice.title}
                </span>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400" />
        </motion.div>
    );

    const SubcategoryItem = ({ subcategory }) => (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSubcategoryClick(subcategory.name)}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 hover:border-pink-200"
        >
            <div className="flex-1">
                <h3 className="text-base font-medium text-pink-600 mb-1">
                    {subcategory.name}
                </h3>
                <p className="text-sm text-gray-600">
                    {subcategory.posts}
                </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </motion.div>
    );

    return (
        <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </motion.button>
                        <div className="flex items-center space-x-2">
                            <currentGenre.icon className="w-5 h-5 text-pink-500" />
                            <h1 className="text-lg font-semibold text-gray-800">
                                {currentGenre.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6">

                {/* Subcategories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-6">
                    {currentGenre.subcategories.map((subcategory, index) => (
                        <motion.div
                            key={subcategory.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <SubcategoryItem subcategory={subcategory} />
                        </motion.div>
                    ))}
                </div>

                {/* Load More Button */}
                <div className="text-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-pink-500 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-600 transition-colors shadow-lg"
                    >
                        さらにカテゴリを読み込む
                    </motion.button>
                </div>
            </div>

            {/* Bottom Navigation Placeholder */}
            <div className="h-20"></div>
        </div>
    );
};

// Main component that handles navigation between genre list and subcategory pages
const GenreNavigationSystem = () => {
    const [currentPage, setCurrentPage] = useState('list'); // 'list' or 'subcategory'
    const [selectedGenre, setSelectedGenre] = useState('appearance');

    const { t } = useTranslation();
    // Genre categories for the main list
    const genreCategories = [
        {
            id: 'appearance',
            title: 'ビジュアル',
            description: 'ロリ顔、地味顔、ギャルなど出演者の属性に応じたジャンル',
            icon: User,
            color: 'text-pink-500'
        },
        {
            id: 'play',
            title: 'プレイ',
            description: '騎乗位、フェラチオなどプレイ内容に応じたジャンル',
            icon: Play,
            color: 'text-purple-500'
        },
        {
            id: 'situation',
            title: 'シチュエーション',
            description: '複数プレイ、野外・露出など撮影状況に応じたジャンル',
            icon: MapPin,
            color: 'text-blue-500'
        },
        {
            id: 'abnormal',
            title: 'アブノーマル',
            description: '緊縛、調教など特殊なプレイに応じたジャンル',
            icon: Heart,
            color: 'text-red-500'
        },
        {
            id: 'other',
            title: 'その他',
            description: '会いに行ける、イベントなどその他のジャンル',
            icon: Shirt,
            color: 'text-green-500'
        }
    ];


    const handleGenreSelect = (genreId) => {
        setSelectedGenre(genreId);
        setCurrentPage('subcategory');
    };

    const handleBackToList = () => {
        setCurrentPage('list');
    };

    const handleSubcategorySelect = (subcategory) => {
        console.log('Selected subcategory:', subcategory);
        // Handle subcategory selection here
    };

    if (currentPage === 'subcategory') {
        return (
            <GenreSubcategoryPage
                selectedGenre={selectedGenre}
                onBack={handleBackToList}
                onSubcategorySelect={handleSubcategorySelect}
            />
        );
    }

    // Genre List Page
    const NoticeItem = ({ notice }) => (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg mb-3"
        >
            <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <notice.icon className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm text-blue-800 font-medium">
                    {notice.title}
                </span>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400" />
        </motion.div>
    );


    return (
        <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => window.history.back()}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 rounded-full transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-pink-500 transition-colors" strokeWidth={2.5} />
                        </motion.button>
                        <motion.h1 
                            className="text-lg font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent"
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            {t('GenreCategory.listTitle')}
                        </motion.h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6">

                {/* Categories */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {t('GenreCategory.browseByCategory')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {genreCategories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleGenreSelect(category.id)}
                                className="relative rounded-2xl p-5 shadow-xl cursor-pointer hover:shadow-2xl transition-all aspect-square flex flex-col justify-center items-center text-center overflow-hidden group"
                            >
                                {/* アニメーション付きグラデーション背景 */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600"
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 2, 0]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                                
                                {/* グロウエフェクト */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                />
                                
                                {/* アイコン */}
                                <motion.div
                                    className="relative z-10 mb-3"
                                    animate={{ 
                                        y: [0, -5, 0],
                                        rotate: [0, 5, 0, -5, 0]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.2
                                    }}
                                >
                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                                        <category.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                                    </div>
                                </motion.div>
                                
                                {/* テキスト */}
                                <div className="relative z-10">
                                    <motion.h3 
                                        className="text-xl font-black mb-2 text-white"
                                        style={{
                                            textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
                                        }}
                                    >
                                        {category.title}
                                    </motion.h3>
                                    <p 
                                        className="text-xs leading-tight text-white/90 font-medium"
                                        style={{
                                            textShadow: '1px 1px 4px rgba(0,0,0,0.3)',
                                        }}
                                    >
                                        {category.description}
                                    </p>
                                </div>
                                
                                {/* 角の装飾 */}
                                <motion.div
                                    className="absolute top-2 right-2 w-2 h-2 bg-white/50 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Placeholder */}
            <BottomNavigationWithCreator active="ranking" />
            <div className="h-20"></div>
        </div>
    );
};

export default GenreNavigationSystem;