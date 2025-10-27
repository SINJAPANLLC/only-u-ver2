import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Lock, Eye, EyeOff, Shield, Sparkles, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLoginPage = () => {
    const [, setLocation] = useLocation();
    const [formData, setFormData] = useState({
        id: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Login form submitted', { id: formData.id, hasPassword: !!formData.password });
        setIsLoading(true);
        setError('');

        try {
            console.log('Sending login request to /api/admin/login');
            // Call backend API for authentication
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.id,
                    password: formData.password
                }),
                credentials: 'include', // Important: Include cookies in requests
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);

            if (response.ok && data.success) {
                console.log('Login successful, redirecting to /admin');
                // Session cookie is set automatically by the server (HttpOnly)
                // No need to manually store anything in sessionStorage
                setLocation('/admin');
            } else {
                console.log('Login failed:', data.error);
                setError(data.error || 'IDまたはパスワードが正しくありません');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('ログイン中にエラーが発生しました: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <motion.div
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-0 right-0 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl"
            />
            <motion.div
                animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                }}
                className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl"
            />

            {/* Floating sparkles */}
            <motion.div
                animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 180, 360]
                }}
                transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-20 right-20 text-pink-400/40"
            >
                <Sparkles className="w-10 h-10" />
            </motion.div>
            <motion.div
                animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, -180, -360]
                }}
                transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute bottom-32 left-10 text-pink-300/40"
            >
                <Crown className="w-8 h-8" />
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full relative z-10"
            >
                {/* ロゴとタイトル */}
                <div className="text-center mb-8">
                    <motion.div
                        animate={{ 
                            rotate: [0, 10, -10, 0],
                            y: [0, -5, 0]
                        }}
                        transition={{ 
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full mb-4 shadow-2xl"
                    >
                        <Shield className="w-10 h-10 text-white" />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-2"
                    >
                        管理画面ログイン
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600"
                    >
                        Only-U 管理パネル
                    </motion.p>
                </div>

                {/* ログインフォーム */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-pink-100"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ID入力 */}
                        <div>
                            <label htmlFor="id" className="block text-sm font-semibold text-gray-700 mb-2">
                                管理者ID
                            </label>
                            <div className="relative">
                                <motion.input
                                    whileFocus={{ scale: 1.01 }}
                                    type="email"
                                    id="id"
                                    name="id"
                                    value={formData.id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3.5 pl-12 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white"
                                    placeholder="info@sinjapan.jp"
                                    required
                                    data-testid="input-admin-id"
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-pink-400" />
                                </div>
                            </div>
                        </div>

                        {/* パスワード入力 */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                パスワード
                            </label>
                            <div className="relative">
                                <motion.input
                                    whileFocus={{ scale: 1.01 }}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3.5 pl-12 pr-12 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white"
                                    placeholder="パスワードを入力"
                                    required
                                    data-testid="input-admin-password"
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-pink-400" />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    data-testid="button-toggle-password"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-pink-500 transition-colors" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-gray-400 hover:text-pink-500 transition-colors" />
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        {/* エラーメッセージ */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border-2 border-red-200 rounded-xl p-3"
                            >
                                <p className="text-red-600 text-sm font-medium">{error}</p>
                            </motion.div>
                        )}

                        {/* ログインボタン */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:from-pink-300 disabled:to-pink-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                            data-testid="button-admin-login"
                        >
                            {isLoading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                    />
                                    ログイン中...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5 mr-2" />
                                    ログイン
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* フッター */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            © 2025 合同会社SIN JAPAN KANAGAWA
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;
