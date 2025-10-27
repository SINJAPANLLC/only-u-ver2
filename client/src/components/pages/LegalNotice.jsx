import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LegalNotice = () => {
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
                    特定商取引法に基づく表記
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
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-6">特定商取引法に基づく表記</h1>

                    {/* Seller */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">販売業者</h2>
                        <p className="text-pink-900 leading-relaxed">合同会社SIN JAPAN KANAGAWA</p>
                    </div>

                    {/* Name of Responsible Person */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">運営統括責任者名</h2>
                        <p className="text-pink-900 leading-relaxed">榎本翔太</p>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">所在地</h2>
                        <p className="text-pink-900 leading-relaxed">神奈川県愛甲郡愛川町中津7287</p>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">電話番号</h2>
                        <p className="text-pink-900 leading-relaxed">050-5526-9906</p>
                        <p className="text-pink-700 leading-relaxed text-sm">
                            ※ お電話での対応は行っておりません。<br />
                            お急ぎの際は問い合わせフォームからお願いいたします。
                        </p>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">連絡先メールアドレス</h2>
                        <p className="text-pink-900 leading-relaxed">
                            <a href="mailto:kanagawa@sinjapan.jp" className="text-pink-600 underline hover:text-pink-700 transition-colors cursor-pointer" data-testid="link-email">
                                kanagawa@sinjapan.jp
                            </a>
                        </p>
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">ホームページ</h2>
                        <p className="text-pink-900 leading-relaxed">
                            <a href="https://only-u.fun" target="_blank" rel="noopener noreferrer" className="text-pink-600 underline hover:text-pink-700 transition-colors cursor-pointer" data-testid="link-website">
                                https://only-u.fun
                            </a>
                        </p>
                    </div>

                    {/* Sales Price */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">販売価格</h2>
                        <p className="text-pink-900 leading-relaxed">各商品ページの価格に準じます。</p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">お支払い方法</h2>
                        <p className="text-pink-900 leading-relaxed">クレジットカード・</p>
                    </div>

                    {/* Payment Deadline */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">お支払期限</h2>
                        <p className="text-pink-900 leading-relaxed">ご注文時にお支払い確定</p>
                    </div>

                    {/* Delivery Timing of Products */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">商品の引き渡し時期</h2>
                        <p className="text-pink-900 leading-relaxed">お支払い完了後、サービスの提供を行います。</p>
                    </div>

                    {/* Returns and Cancellations */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">返品・キャンセル</h2>
                        <p className="text-pink-900 leading-relaxed">
                            サービスの性質上、契約締結後のキャンセル、クーリングオフは一切認められず、お支払い頂いた料金については理由を問わず返還いたしません。
                        </p>
                    </div>

                    {/* Service Cancellation Conditions */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">サービスの解約条件</h2>
                        <p className="text-pink-900 leading-relaxed">
                            解約される場合は、当社サイト上の記載に従って解約手続を行う必要があります。
                        </p>
                    </div>

                    {/* Other Fees */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">その他費用</h2>
                        <div className="text-pink-900 leading-relaxed space-y-2">
                            <p>
                                当社が代理受領した料金を「主催者」が指定する振込先口座に振り込む際、振込手数料として３３０円（税込）を当社にお支払いいただきます。
                            </p>
                            <p>
                                なお、ご指定いただいた振込先口座情報の不備・誤記によって誤った振込先への振込がなされてしまった場合に、当社が任意で行う組戻し手続に際し、組戻し手数料として８８０円（税込）を当社にお支払いいただきます。
                            </p>
                        </div>
                    </div>

                    {/* Notification of Operations */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-pink-800">映像送信型性風俗特殊営業届出</h2>
                        <p className="text-pink-900 leading-relaxed">神奈川県公安委員会第　号</p>
                    </div>

                </motion.div>
            </motion.div>
        </div>
    );
};

export default LegalNotice;
