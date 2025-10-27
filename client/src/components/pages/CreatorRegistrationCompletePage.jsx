import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle, 
    Clock, 
    Mail, 
    ArrowRight,
    Sparkles,
    FileCheck,
    Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreatorRegistrationCompletePage = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Clear any saved form data
        localStorage.removeItem('creatorRegistrationForm');

        // Auto redirect after 10 seconds
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/account');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Success Header */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4"
                    >
                        <CheckCircle className="w-16 h-16 text-green-500" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold text-white mb-2"
                    >
                        申請が完了しました！
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-pink-100"
                    >
                        クリエイター登録の申請を受け付けました
                    </motion.p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Status Timeline */}
                    <div className="space-y-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border-2 border-green-200"
                        >
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-green-900 mb-1">申請完了</h3>
                                <p className="text-sm text-green-700">
                                    個人情報と電話番号の認証が完了しました
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200"
                        >
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900 mb-1">審査中</h3>
                                <p className="text-sm text-blue-700 mb-2">
                                    現在、提出された情報を審査しています
                                </p>
                                <div className="bg-blue-100 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "60%" }}
                                        transition={{ delay: 0.7, duration: 1 }}
                                        className="h-full bg-blue-500"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
                        >
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                    <FileCheck className="w-6 h-6 text-gray-500" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-700 mb-1">審査結果</h3>
                                <p className="text-sm text-gray-600">
                                    審査が完了次第、メールでお知らせします
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Information Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl mb-6"
                    >
                        <div className="flex items-start space-x-3 mb-4">
                            <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-purple-900 mb-2">次のステップ</h3>
                                <ul className="space-y-2 text-sm text-purple-800">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>審査には通常<strong>1〜3営業日</strong>かかります</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>審査結果は登録されたメールアドレスに送信されます</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>承認後、すぐにクリエイターとして活動を開始できます</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 bg-white rounded-xl">
                            <Mail className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-700">
                                <strong className="text-gray-900">重要：</strong>
                                メールが届かない場合は、迷惑メールフォルダをご確認ください
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/account')}
                            className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                        >
                            <Home className="w-5 h-5" />
                            <span>アカウントページへ戻る</span>
                        </motion.button>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-center text-sm text-gray-500"
                        >
                            {countdown}秒後に自動的にリダイレクトされます
                        </motion.div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -z-10 opacity-10">
                    <div className="w-64 h-64 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-3xl" />
                </div>
                <div className="absolute bottom-0 left-0 -z-10 opacity-10">
                    <div className="w-64 h-64 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-3xl" />
                </div>
            </motion.div>
        </div>
    );
};

export default CreatorRegistrationCompletePage;
