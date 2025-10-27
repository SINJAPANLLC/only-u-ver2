import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  Star, 
  Calendar,
  CreditCard,
  Settings,
  AlertCircle,
  Crown,
  Zap,
  Download,
  Shield,
  Sparkles,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const CurrentPlanPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [subscribedCreators, setSubscribedCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  const calculateServiceFee = (basePrice) => {
    const serviceFeeRate = 0.10;
    const taxRate = 0.10;
    const serviceFeeExcludingTax = Math.floor(basePrice * serviceFeeRate);
    const serviceFeeTax = Math.floor(serviceFeeExcludingTax * taxRate);
    const serviceFeeIncludingTax = serviceFeeExcludingTax + serviceFeeTax;
    return {
      basePrice,
      serviceFeeExcludingTax,
      serviceFeeTax,
      serviceFeeIncludingTax,
      totalAmount: basePrice + serviceFeeIncludingTax
    };
  };

  useEffect(() => {
    if (!currentUser) return;

    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', currentUser.uid),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(subscriptionsQuery, (snapshot) => {
      const subscriptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubscribedCreators(subscriptionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleCancelPlan = async () => {
    if (!selectedCreator) return;

    try {
      const subscriptionRef = doc(db, 'subscriptions', selectedCreator.id);
      await updateDoc(subscriptionRef, {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      setShowCancelModal(false);
      setSelectedCreator(null);
    } catch (error) {
      console.error('解約エラー:', error);
      alert('プランの解約に失敗しました');
    }
  };

  const totalBasePrice = subscribedCreators.reduce((sum, creator) => sum + creator.price, 0);
  const totalServiceFee = subscribedCreators.reduce((sum, creator) => {
    const feeCalculation = calculateServiceFee(creator.price);
    return sum + feeCalculation.serviceFeeIncludingTax;
  }, 0);
  const totalAmount = totalBasePrice + totalServiceFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-white mr-4 p-2 hover:bg-white/20 rounded-full" data-testid="button-back">
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex items-center">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Star className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">加入中のプラン</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
            />
          </div>
        ) : subscribedCreators.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-12 text-center shadow-lg border-2 border-pink-100">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">加入中のプランはありません</h3>
            <p className="text-gray-600 mb-6">お気に入りのクリエイターをサポートしてみましょう！</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/feed')}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-3 rounded-xl font-bold"
              data-testid="button-explore"
            >
              クリエイターを探す
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 border-2 border-pink-200 shadow-xl relative overflow-hidden">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <h2 className="text-xl font-bold text-pink-900">加入中のサブスク</h2>
                  <p className="text-pink-700 font-medium">{subscribedCreators.length}人のクリエイター</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-pink-900" data-testid="text-total-amount">{formatCurrency(totalAmount)}</p>
                  <p className="text-pink-700 font-medium">/月合計</p>
                  <p className="text-xs text-pink-600 font-semibold mt-1" data-testid="text-fee-breakdown">基本: {formatCurrency(totalBasePrice)} + 手数料: {formatCurrency(totalServiceFee)}</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              {subscribedCreators.map((creator, index) => (
                <motion.div key={creator.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02, y: -2 }} className="bg-white border-2 border-pink-100 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}>
                      <img src={creator.avatar || 'https://via.placeholder.com/100'} alt={creator.name} className="w-16 h-16 rounded-full object-cover border-2 border-pink-200 shadow-md" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900" data-testid={`text-creator-name-${creator.id}`}>{creator.name}</h3>
                      <p className="text-pink-600 font-semibold" data-testid={`text-plan-name-${creator.id}`}>{creator.planName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs px-3 py-1 rounded-full font-bold border border-green-300" data-testid={`text-status-${creator.id}`}>
                          {creator.status === 'active' ? 'アクティブ' : '停止中'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent" data-testid={`text-price-${creator.id}`}>{formatCurrency(creator.price)}</p>
                      <p className="text-sm text-gray-500 font-medium">/{creator.billingCycle || '月額'}</p>
                    </div>
                  </div>

                  {creator.features && creator.features.length > 0 && (
                    <div className="border-t-2 border-pink-100 pt-4 mb-4">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center"><Check className="w-5 h-5 mr-2 text-pink-500" />プラン特典</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {creator.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm text-gray-700"><div className="w-2 h-2 bg-pink-400 rounded-full"></div><span data-testid={`text-feature-${creator.id}-${idx}`}>{feature}</span></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {creator.usage && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 mb-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-2xl font-bold text-pink-600" data-testid={`text-videos-watched-${creator.id}`}>{creator.usage.videosWatched || 0}</p><p className="text-xs text-gray-600 font-medium">視聴数</p></div>
                        <div><p className="text-2xl font-bold text-purple-600" data-testid={`text-messages-sent-${creator.id}`}>{creator.usage.messagesSent || 0}</p><p className="text-xs text-gray-600 font-medium">メッセージ</p></div>
                        <div><p className="text-xs font-bold text-gray-900" data-testid={`text-last-activity-${creator.id}`}>{creator.usage.lastActivity || '-'}</p><p className="text-xs text-gray-600 font-medium">最終活動</p></div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600"><Calendar className="w-4 h-4" /><span>次回更新: {formatDate(creator.nextBillingDate)}</span></div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedCreator(creator); setShowCancelModal(true); }} className="text-red-600 hover:text-red-700 font-bold flex items-center space-x-1" data-testid={`button-cancel-${creator.id}`}>
                      <X className="w-4 h-4" />
                      <span>解約</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancelModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">プランを解約しますか？</h3>
                <p className="text-gray-600">解約後も次回更新日まで特典を利用できます</p>
              </div>
              <div className="space-y-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCancelPlan} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all">解約する</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCancelModal(false)} className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all">キャンセル</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default CurrentPlanPage;
