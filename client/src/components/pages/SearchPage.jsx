import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Hash, Triangle, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const dummyData = {
    freeWords: [
        { id: 1, label: '"k"' }
    ],
    genres: [
        { id: 1, label: 'ギャル' },
        { id: 2, label: 'オナニー' },
        { id: 3, label: '潮吹き' },
        { id: 4, label: '熟女' },
    ],
    tags: [
        { id: 1, label: '美女' },
        { id: 2, label: 'かわいい' },
        { id: 3, label: 'オナニー' },
        { id: 4, label: 'ギャル' },
    ]
};

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // ジャンルをクリックした時の処理
    const handleGenreClick = (genreName) => {
        navigate(`/genre/${encodeURIComponent(genreName)}`);
    };

    // タグをクリックした時の処理
    const handleTagClick = (tagName) => {
        navigate(`/genre/${encodeURIComponent(tagName)}`);
    };

    // フリーワード検索を実行
    const handleFreeWordSearch = () => {
        if (searchTerm.trim()) {
            navigate(`/feed?search=${encodeURIComponent(searchTerm)}`);
        }
    };

    // キーボードでエンターキーが押された時の処理
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFreeWordSearch();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col pb-20"
        >
            {/* Header with back and search input */}
            <div className="flex items-center p-4 border-b border-gray-200 bg-white/95 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <motion.button 
                    onClick={() => navigate(-1)} 
                    className="text-pink-600 mr-3 p-2 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 rounded-full transition-all"
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </motion.button>
                <div className="relative flex-grow">
                    <motion.div
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500"
                        animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Search size={20} strokeWidth={2.5} />
                    </motion.div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="検索キーワードを入力してください"
                        className="w-full pl-10 pr-10 py-2.5 border-2 border-pink-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all font-medium"
                        data-testid="input-search"
                    />
                    {searchTerm && (
                        <motion.button 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={() => setSearchTerm('')} 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-600 font-bold text-lg"
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            ✕
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Search results sections */}
            <div className="flex-grow p-4 overflow-auto">

                {/* Free word search */}
                <AnimatePresence>
                    {searchTerm && (
                        <motion.div 
                            className="mb-6"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <motion.h3 
                                className="font-bold text-lg bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-3"
                                animate={{ opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                フリーワード検索
                            </motion.h3>
                            <motion.div 
                                className="flex items-center space-x-3 bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300 cursor-pointer p-3 rounded-xl shadow-sm"
                                onClick={handleFreeWordSearch}
                                whileHover={{ scale: 1.02, x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                data-testid="button-search-freeword"
                            >
                                <motion.div
                                    animate={{ 
                                        rotate: [0, 360],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="w-5 h-5 text-pink-600" strokeWidth={2.5} />
                                </motion.div>
                                <span className="font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent italic">{`"${searchTerm}"`}</span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Genre */}
                <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <motion.h3 
                        className="font-bold text-lg bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-3"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ジャンル
                    </motion.h3>
                    {dummyData.genres.map((genre, index) => (
                        <motion.div 
                            key={genre.id} 
                            className="flex items-center space-x-3 mb-3 cursor-pointer bg-gradient-to-r from-pink-50/50 to-rose-50/50 border border-pink-200 p-3 rounded-xl shadow-sm hover:border-pink-400 transition-all"
                            onClick={() => handleGenreClick(genre.label)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            data-testid={`button-genre-${genre.id}`}
                        >
                            <motion.div
                                className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-md"
                                animate={{ 
                                    rotate: [0, 5, -5, 0],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                            >
                                <Triangle className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </motion.div>
                            <span className="font-bold text-gray-800">{genre.label}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Tags */}
                <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <motion.h3 
                        className="font-bold text-lg bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-3"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        タグ
                    </motion.h3>
                    {dummyData.tags.map((tag, index) => (
                        <motion.div 
                            key={tag.id} 
                            className="flex items-center space-x-3 mb-3 cursor-pointer bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-200 p-3 rounded-xl shadow-sm hover:border-pink-400 transition-all"
                            onClick={() => handleTagClick(tag.label)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            data-testid={`button-tag-${tag.id}`}
                        >
                            <motion.div
                                className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-md"
                                animate={{ 
                                    rotate: [0, -5, 5, 0],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                            >
                                <Hash className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </motion.div>
                            <span className="font-bold text-gray-800">{tag.label}</span>
                        </motion.div>
                    ))}
                </motion.div>

            </div>
            <BottomNavigationWithCreator active="account" />
        </motion.div>
    );
};

export default SearchPage;
