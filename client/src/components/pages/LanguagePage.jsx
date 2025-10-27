import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const LanguageSettings = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    const languageOptions = {
        en: 'English',
        ja: '日本語 (Japanese)',
        zh: '中文 (Chinese)',
        ko: '한국어 (Korean)',
        fr: 'Français (French)',
        de: 'Deutsch (German)',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg"
            >
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(-1)} 
                    className="text-white mr-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    data-testid="button-back"
                >
                    <ArrowLeft size={24} />
                </motion.button>
                <div className="flex items-center">
                    <motion.div
                        animate={{ 
                            rotate: [0, 360],
                        }}
                        transition={{ 
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <Globe className="w-7 h-7 text-white mr-3" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-white">言語設定</h1>
                </div>
            </motion.div>

            <div className="p-6 space-y-6">
                {/* Language Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="bg-white rounded-2xl p-6 shadow-xl border-2 border-pink-100"
                >
                    <h2 className="text-xl font-bold mb-6 flex items-center bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                        <Globe className="w-6 h-6 mr-3 text-pink-500" />
                        表示言語の選択
                    </h2>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                現在の言語
                            </label>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-pink-200"
                            >
                                <CheckCircle className="w-6 h-6 text-pink-500" />
                                <span className="font-bold text-gray-900 text-lg">
                                    {languageOptions[i18n.language]}
                                </span>
                            </motion.div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                言語を変更
                            </label>
                            <select
                                value={i18n.language}
                                onChange={handleLanguageChange}
                                className="w-full px-5 py-4 border-2 border-pink-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg font-semibold shadow-sm"
                                data-testid="select-language"
                            >
                                {Object.entries(languageOptions).map(([code, name]) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Language Information */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-xl border-2 border-pink-100"
                >
                    <h3 className="text-xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                        対応言語について
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(languageOptions).map(([code, name], index) => (
                            <motion.div
                                key={code}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                whileHover={{ scale: 1.05, x: 5 }}
                                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100 cursor-pointer"
                            >
                                <motion.div
                                    animate={{ 
                                        rotate: [0, 360],
                                    }}
                                    transition={{ 
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "linear",
                                        delay: index * 0.5
                                    }}
                                    className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-md"
                                >
                                    <Globe className="w-5 h-5 text-white" />
                                </motion.div>
                                <div>
                                    <div className="font-bold text-gray-900">{name}</div>
                                    <div className="text-sm text-pink-500 font-medium">コード: {code.toUpperCase()}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Help Information */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 rounded-2xl p-6 relative overflow-hidden"
                >
                    <motion.div
                        animate={{ 
                            rotate: [0, 360],
                        }}
                        transition={{ 
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"
                    />
                    <div className="flex items-start space-x-4 relative z-10">
                        <motion.div
                            animate={{ 
                                y: [0, -5, 0],
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Sparkles className="w-6 h-6 text-pink-600 mt-1" />
                        </motion.div>
                        <div>
                            <h4 className="font-bold text-pink-900 mb-2 text-lg">言語設定について</h4>
                            <p className="text-base text-pink-800 mb-3 leading-relaxed">
                                選択した言語でアプリ全体の表示が変更されます。
                            </p>
                            <ul className="text-base text-pink-800 space-y-2">
                                <li className="flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2 text-pink-600" />
                                    メニューやボタンのテキスト
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2 text-pink-600" />
                                    通知やメッセージの言語
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2 text-pink-600" />
                                    ヘルプやサポート情報
                                </li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>

            <BottomNavigationWithCreator active="account" />
        </div>
    );
};

export default LanguageSettings;
