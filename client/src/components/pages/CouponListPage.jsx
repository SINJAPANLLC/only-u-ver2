import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Copy, 
  Check,
  Gift,
  Percent,
  Calendar,
  Clock,
  Star,
  Tag,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const CouponListPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Firestoreからユーザーのクーポンを取得
    const couponsQuery = query(
      collection(db, 'coupons'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(couponsQuery, (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validUntil: doc.data().validUntil?.toDate?.() || new Date(doc.data().validUntil)
      }));
      setCoupons(couponsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const formatDate = (dateString) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysUntilExpiry = (dateString) => {
    const today = new Date();
    const expiry = dateString instanceof Date ? dateString : new Date(dateString);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'expired': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
      case 'used': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '利用可能';
      case 'expired': return '期限切れ';
      case 'used': return '使用済み';
      default: return '不明';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case '新規会員': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'プラン': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300';
      case '特別': return 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300';
      case '一般': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const activeCoupons = coupons.filter(coupon => coupon.status === 'active');
  const expiredCoupons = coupons.filter(coupon => coupon.status === 'expired');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-white mr-4 p-2 hover:bg-white/20 rounded-full" data-testid="button-back">
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex items-center">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
            <Gift className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">クーポン一覧</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 border-2 border-pink-200 shadow-xl relative overflow-hidden">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-xl font-bold text-pink-900">利用可能なクーポン</h2>
              <p className="text-pink-700 font-medium" data-testid="text-active-coupon-count">{activeCoupons.length}件</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-pink-900" data-testid="text-total-discount">{activeCoupons.reduce((sum, c) => sum + (c.type === 'percentage' ? (c.maxDiscount || 0) : (c.discount || 0)), 0).toLocaleString()}</p>
              <p className="text-pink-700 font-medium">円分の割引</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">有効なクーポン</h2>
          {activeCoupons.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-pink-100">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">有効なクーポンがありません</p>
            </motion.div>
          ) : (
            activeCoupons.map((coupon, index) => (
              <motion.div key={coupon.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02, y: -2 }} className="bg-white border-2 border-pink-100 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: index * 2 }} className="absolute top-4 right-4 w-16 h-16 bg-pink-100 rounded-full blur-xl opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900" data-testid={`text-coupon-title-${coupon.id}`}>{coupon.title || 'クーポン'}</h3>
                        {coupon.category && (
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getCategoryColor(coupon.category)}`} data-testid={`text-category-${coupon.id}`}>{coupon.category}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium mb-3">{coupon.description || ''}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center" data-testid={`text-valid-until-${coupon.id}`}><Calendar className="w-4 h-4 mr-1" />{formatDate(coupon.validUntil)}</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" />残り{getDaysUntilExpiry(coupon.validUntil)}日</span>
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-3 border-2 border-pink-200">
                      <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent" data-testid={`text-discount-${coupon.id}`}>
                        {coupon.type === 'percentage' ? `${coupon.discount}%` : `¥${(coupon.discount || 0).toLocaleString()}`}
                      </div>
                      <div className="text-xs text-pink-700 font-bold">OFF</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-100 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-pink-500" />
                        <code className="font-bold text-pink-700 text-lg" data-testid={`text-code-${coupon.id}`}>{coupon.code}</code>
                      </div>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleCopyCode(coupon.code)} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2 font-bold text-sm" data-testid={`button-copy-${coupon.id}`}>
                        {copiedCoupon === coupon.code ? (<><Check className="w-4 h-4" /><span>コピー済み</span></>) : (<><Copy className="w-4 h-4" /><span>コピー</span></>)}
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-1" />最低購入金額: ¥{(coupon.minAmount || 0).toLocaleString()}</span>
                    <span>使用回数: {coupon.usageCount || 0}/{coupon.maxUsage || '無制限'}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {expiredCoupons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-500">期限切れ</h2>
            {expiredCoupons.map((coupon, index) => (
              <motion.div key={coupon.id} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} className="bg-gray-100 border-2 border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-700">{coupon.title || 'クーポン'}</h3>
                    <p className="text-sm text-gray-500">{coupon.code}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(coupon.status)}`}>{getStatusText(coupon.status)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <Sparkles className="w-6 h-6 text-pink-600 mt-1" />
            <div>
              <h4 className="font-bold text-pink-900 mb-2 text-lg">クーポンの使い方</h4>
              <ul className="text-base text-pink-800 space-y-2">
                <li className="flex items-center"><Check className="w-4 h-4 mr-2" />クーポンコードをコピーして使用</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-2" />有効期限内にご利用ください</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-2" />最低購入金額に注意してください</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default CouponListPage;
