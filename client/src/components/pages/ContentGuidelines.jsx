import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ContentGuidelines = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-pink-100 to-pink-50">
            {/* Top Navigation */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between p-4 border-b border-pink-200 sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm"
            >
                <motion.button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center p-2 bg-gradient-to-r from-pink-100 to-pink-200 hover:from-pink-200 hover:to-pink-300 rounded-full transition-all"
                    aria-label="Go back"
                    data-testid="button-back"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft size={20} className="text-pink-700" />
                </motion.button>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent flex-1 text-center mr-10">
                    掲載ガイドライン
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-6 max-w-4xl mx-auto overflow-y-auto pb-8"
            >
                <motion.div 
                    className="text-left space-y-6 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-pink-100"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {/* Title */}
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-6">掲載ガイドライン</h1>
                    
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-pink-800 mb-4">1. 禁止コンテンツ</h2>
                            <div className="text-pink-900 leading-relaxed space-y-2">
                                <p>以下のコンテンツは掲載を禁止します：</p>
                                <ul className="list-disc list-inside pl-6 space-y-1">
                                    <li>18歳未満の人物が関与するコンテンツ</li>
                                    <li>強制・脅迫・暴力を伴うコンテンツ</li>
                                    <li>動物との性的行為を描写するコンテンツ</li>
                                    <li>排泄物や血液を過度に描写するコンテンツ</li>
                                    <li>違法薬物の使用を推奨するコンテンツ</li>
                                    <li>自殺や自傷行為を助長するコンテンツ</li>
                                    <li>第三者の著作権を侵害するコンテンツ</li>
                                    <li>虚偽の情報や詐欺的なコンテンツ</li>
                                    <li>生成AIにより作成されたコンテンツ</li>
                                    <li>その他、弊社が不適切と判断したコンテンツ</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-pink-800 mb-4">2. 掲載要件</h2>
                            <div className="text-pink-900 leading-relaxed space-y-2">
                                <p>コンテンツを掲載する際は以下を遵守してください：</p>
                                <ul className="list-disc list-inside pl-6 space-y-1">
                                    <li>出演者の年齢確認書類の提出</li>
                                    <li>出演同意書の取得</li>
                                    <li>映像送信型性風俗特殊営業の届出</li>
                                    <li>適切なモザイク処理の実施</li>
                                    <li>正確な情報の提供</li>
                                    <li>プライバシーの保護</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-pink-800 mb-4">3. コンテンツの品質基準</h2>
                            <div className="text-pink-900 leading-relaxed space-y-2">
                                <ul className="list-disc list-inside pl-6 space-y-1">
                                    <li>映像・音声の品質が良好であること</li>
                                    <li>適切な照明と撮影環境であること</li>
                                    <li>明確で理解しやすいタイトルと説明文</li>
                                    <li>適切なカテゴリ分類</li>
                                    <li>正確なタグ付け</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-pink-800 mb-4">4. コミュニケーションガイドライン</h2>
                            <div className="text-pink-900 leading-relaxed space-y-2">
                                <ul className="list-disc list-inside pl-6 space-y-1">
                                    <li>相手を尊重した丁寧なコミュニケーション</li>
                                    <li>ハラスメント行為の禁止</li>
                                    <li>個人情報の適切な取り扱い</li>
                                    <li>スパム行為の禁止</li>
                                    <li>適切な言語の使用</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-pink-800 mb-4">5. 違反時の措置</h2>
                            <div className="text-pink-900 leading-relaxed space-y-2">
                                <p>ガイドライン違反が発覚した場合、以下の措置を講じます：</p>
                                <ul className="list-disc list-inside pl-6 space-y-1">
                                    <li>コンテンツの削除</li>
                                    <li>アカウントの一時停止</li>
                                    <li>アカウントの永久停止</li>
                                    <li>法的措置の検討</li>
                                </ul>
                            </div>
                        </div>

                        <motion.div 
                            className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-4 mt-6"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <p className="text-pink-800 text-sm">
                                <strong>注意：</strong>本ガイドラインは、安全で適切なサービス提供のために定められています。
                                全てのユーザーは本ガイドラインを遵守し、責任ある利用をお願いします。
                                疑問点がございましたら、サポートまでお問い合わせください。
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ContentGuidelines;
