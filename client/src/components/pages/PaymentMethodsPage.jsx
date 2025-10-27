import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  CreditCard,
  Trash2,
  Check,
  AlertCircle,
  Shield,
  Lock,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const PaymentMethodsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Firestoreから支払い方法を取得
    const paymentsQuery = query(
      collection(db, 'paymentMethods'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const methods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPaymentMethods(methods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const getCardIcon = (brand) => {
    return '💳';
  };

  const handleSetDefault = async (id) => {
    try {
      // 全ての支払い方法のisDefaultをfalseに
      for (const method of paymentMethods) {
        await updateDoc(doc(db, 'paymentMethods', method.id), {
          isDefault: method.id === id
        });
      }
    } catch (error) {
      console.error('デフォルト設定エラー:', error);
      alert('デフォルトの設定に失敗しました');
    }
  };

  const handleDeleteMethod = async (id) => {
    try {
      await deleteDoc(doc(db, 'paymentMethods', id));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('削除エラー:', error);
      alert('支払い方法の削除に失敗しました');
    }
  };

  const handleAddMethod = () => {
    console.log('新しい支払い方法を追加');
    setShowAddModal(false);
    // Stripe統合が必要です
    alert('Stripe統合後に実装されます');
  };

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
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <CreditCard className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">支払い方法</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 rounded-2xl p-6 relative overflow-hidden shadow-lg">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
          <div className="flex items-start space-x-4 relative z-10">
            <Shield className="w-6 h-6 text-blue-700 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2 text-lg">セキュリティ</h3>
              <p className="text-base text-blue-800">お客様の支払い情報は暗号化され、安全に保存されています。</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">登録済みの支払い方法</h2>
          {paymentMethods.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-pink-100">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">支払い方法が登録されていません</p>
            </motion.div>
          ) : (
            paymentMethods.map((method, index) => (
              <motion.div key={method.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02, y: -2 }} className="bg-white rounded-2xl p-5 shadow-lg border-2 border-pink-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }} className="w-14 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white text-xl">{getCardIcon(method.brand)}</span>
                    </motion.div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 text-lg" data-testid={`text-card-info-${method.id}`}>{method.brand} •••• {method.last4}</span>
                        {method.isDefault && (
                          <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs px-3 py-1 rounded-full font-bold border border-green-300" data-testid={`text-default-badge-${method.id}`}>デフォルト</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium" data-testid={`text-holder-expiry-${method.id}`}>{method.holderName} • {method.expiryMonth}/{method.expiryYear}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!method.isDefault && (
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleSetDefault(method.id)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" data-testid={`button-set-default-${method.id}`}>
                        <Check className="w-5 h-5" />
                      </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowDeleteModal(method.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" data-testid={`button-delete-${method.id}`}>
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal(true)} className="w-full bg-white border-2 border-dashed border-pink-300 rounded-2xl p-6 flex items-center justify-center space-x-3 hover:border-pink-500 hover:bg-pink-50 transition-all shadow-md" data-testid="button-add">
          <Plus className="w-6 h-6 text-pink-500" />
          <span className="font-bold text-pink-700">新しい支払い方法を追加</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <Sparkles className="w-6 h-6 text-pink-600 mt-1" />
            <div>
              <h4 className="font-bold text-pink-900 mb-2 text-lg">お支払いについて</h4>
              <ul className="text-base text-pink-800 space-y-2">
                <li className="flex items-center"><Lock className="w-4 h-4 mr-2" />すべての決済は暗号化されています</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-2" />カード情報は安全に保管されます</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-2" />いつでも支払い方法を変更できます</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">支払い方法を削除</h3>
                <p className="text-gray-600">この支払い方法を削除してもよろしいですか？</p>
              </div>
              <div className="space-y-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDeleteMethod(showDeleteModal)} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all">削除する</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDeleteModal(null)} className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all">キャンセル</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default PaymentMethodsPage;
