import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';
import { genreData, getGenreVideoCount, updateGenreVideoCount } from '../data/constants';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import genreImage1 from '@assets/00035-3167998813_1760917144953.png';
import genreImage2 from '@assets/00220-1604543024_0_1760917144953.png';
import genreImage3 from '@assets/スクリーンショット 2025-10-08 22.17.14_1760917144953.png';
import genreImage4 from '@assets/スクリーンショット 2025-10-08 22.23.36_1760917144953.png';
import genreImage5 from '@assets/00021-2650716505_0_1760917144954.jpg';
import genreImage6 from '@assets/00465-2336099699_0_1760917144954.jpg';
import genreImage7 from '@assets/IMG_8987_1761583881581.JPG';
import genreImage8 from '@assets/IMG_8986_1761583898068.JPG';

const RecommendedGenres = ({ likedItems, toggleLike }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [genreCounts, setGenreCounts] = useState({});

    // ジャンルカード用の画像
    const genreImages = [
        genreImage1,  // 0: amateur
        genreImage2,  // 1: personalFilming
        genreImage3,  // 2: marriedWoman
        genreImage4,  // 3: largeBreasts
        genreImage5,  // 4: pervert
        genreImage6,  // 5: homeVideo
        genreImage7,  // 6: beautifulWoman (潮吹き)
        genreImage8   // 7: beautifulBreasts (アブノーマル)
    ];

    const handleGenreClick = (genreNameKey) => {
        // 翻訳されたジャンル名を取得
        const translatedName = t(`genres.${genreNameKey}`);
        navigate(`/genre/${encodeURIComponent(translatedName)}`);
    };

    // ジャンル別動画数を取得
    useEffect(() => {
        const fetchGenreCounts = async () => {
            const counts = {};
            for (const genre of genreData) {
                const count = await getGenreVideoCount(genre.nameKey);
                counts[genre.nameKey] = count;
            }
            setGenreCounts(counts);
        };

        fetchGenreCounts();
    }, []);

    // 動画数を更新する関数（他のコンポーネントから呼び出し可能）
    const refreshGenreCounts = async () => {
        const counts = {};
        for (const genre of genreData) {
            const count = await getGenreVideoCount(genre.nameKey);
            counts[genre.nameKey] = count;
        }
        setGenreCounts(counts);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-12"
        >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="mr-2 p-1.5 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 shadow-md"
                >
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" strokeWidth={2.5} />
                </motion.div>
                {t('genres.title')}
            </h2>

            {/* Responsive 2-column square grid for all screen sizes */}
            <div className="grid grid-cols-2 gap-3">
                {genreData.map((genre, index) => {
                    // 3つの画像を順番に繰り返す
                    const imageUrl = genreImages[index % genreImages.length];
                    
                    return (
                        <motion.div
                            key={genre.name}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.8 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleGenreClick(genre.nameKey)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all group aspect-square flex flex-col"
                            data-testid={`genre-card-${genre.nameKey}`}
                        >
                            {/* Thumbnail */}
                            <div className="relative flex-1 overflow-hidden">
                                <motion.img 
                                    src={imageUrl}
                                    alt={t(`genres.${genre.nameKey}`)}
                                    className="w-full h-full object-cover"
                                    animate={{ 
                                        scale: [1, 1.08, 1],
                                        rotate: [0, 1, 0]
                                    }}
                                    transition={{ 
                                        duration: 10,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.3
                                    }}
                                    whileHover={{ scale: 1.15 }}
                                />
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
                                    animate={{
                                        opacity: [0.8, 1, 0.8]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                ></motion.div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-3 flex-shrink-0 bg-white">
                                <h3 className="font-semibold text-gray-800 text-sm text-center mb-1">
                                    {t(`genres.${genre.nameKey}`)}
                                </h3>
                                <p className="text-xs text-gray-500 text-center">
                                    {(genreCounts[genre.nameKey] || genre.count).toLocaleString()} Videos
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/GenreNavigationSystem')}
                className="relative w-full mt-6 overflow-hidden rounded-full py-3.5 font-medium transition-all text-sm sm:text-base flex items-center justify-center gap-2 group"
                data-testid="button-see-more-genres"
                style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
                }}
            >
                <span className="relative z-10 text-white font-semibold flex items-center gap-2">
                    {t('genres.SeeMore')} 
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
        </motion.div>
    );
};

export default RecommendedGenres;
