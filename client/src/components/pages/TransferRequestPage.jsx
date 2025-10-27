import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, Send, CheckCircle, AlertCircle, Calendar, CreditCard, Sparkles, TrendingUp, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';
import {
  calculateNormalTransfer,
  calculateEarlyPayment,
  validateTransferRequest,
  formatCurrency,
  formatDate,
  calculateNextPaymentDate,
  calculateEarlyPaymentDate,
  CONSTANTS
} from '@/utils/paymentCalculations';

const TransferRequestPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [transferAmount, setTransferAmount] = useState('');
  const [isEarlyPayment, setIsEarlyPayment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firestoreから利用可能残高を取得（仮の実装、実際は売上から計算）
  useEffect(() => {
    if (!currentUser) return;

    // 振込履歴を取得
    const transfersQuery = query(
      collection(db, 'transferRequests'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(transfersQuery, (snapshot) => {
      const transfersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      setRecentTransfers(transfersData);
    });

    // 銀行口座情報を取得
    const fetchBankAccount = async () => {
      try {
        const bankQuery = query(
          collection(db, 'bankAccounts'),
          where('userId', '==', currentUser.uid),
          limit(1)
        );
        const bankSnapshot = await getDocs(bankQuery);
        if (!bankSnapshot.empty) {
          setBankAccount({ id: bankSnapshot.docs[0].id, ...bankSnapshot.docs[0].data() });
        }

        // 実際の売上データから利用可能残高を計算
        // transactionsコレクションからクリエイター受取額を集計
        // amount = ユーザー支払い総額（手数料・税込み）
        // creatorAmount = クリエイター受取額（手数料・税抜き後）
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('creatorId', '==', currentUser.uid),
          where('status', '==', 'completed')
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const creatorRevenue = transactionsSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          // creatorAmountを使用（クリエイターが実際に受け取る金額）
          return sum + (data.creatorAmount || 0);
        }, 0);

        // 既に振込申請済みの金額を取得
        const transferredQuery = query(
          collection(db, 'transferRequests'),
          where('userId', '==', currentUser.uid),
          where('status', 'in', ['pending', 'completed'])
        );
        const transferredSnapshot = await getDocs(transferredQuery);
        const transferredAmount = transferredSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.requestedAmount || 0);
        }, 0);

        // 利用可能残高 = クリエイター受取総額 - 既に振込申請済みの金額
        const available = creatorRevenue - transferredAmount;
        setAvailableBalance(Math.max(0, available));
        setLoading(false);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setLoading(false);
      }
    };

    fetchBankAccount();

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300';
      case 'pending': return 'bg-gradient-to-r from-pink-50 to-pink-100 text-pink-600 border-pink-200';
      default: return 'bg-gradient-to-r from-pink-50 to-pink-100 text-pink-500 border-pink-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '振込完了';
      case 'pending': return '処理中';
      default: return '不明';
    }
  };

  const getTypeLabel = (type) => {
    return type === 'early' ? '早払い' : '通常';
  };

  const handleSubmit = async () => {
    if (!currentUser || !bankAccount) {
      alert('銀行口座が登録されていません');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'transferRequests'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Unknown User',
        requestedAmount: requestedAmount,
        platformFee: transferCalculation.platformFee,
        platformFeeTax: transferCalculation.platformFeeTax,
        earlyPaymentFee: transferCalculation.earlyPaymentFee || 0,
        earlyPaymentFeeTax: transferCalculation.earlyPaymentFeeTax || 0,
        transferFee: transferCalculation.transferFee,
        totalFees: transferCalculation.totalFees,
        netAmount: netAmount,
        isEarlyPayment: isEarlyPayment,
        paymentDate: paymentDate,
        bankName: bankAccount.bankName,
        branchName: bankAccount.branchName,
        accountType: bankAccount.accountType,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
        status: 'pending',
        type: isEarlyPayment ? 'early' : 'normal',
        createdAt: new Date()
      });

      setIsSubmitting(false);
      setShowConfirm(false);
      setIsCompleted(true);
    } catch (error) {
      console.error('振込申請エラー:', error);
      alert('振込申請に失敗しました。もう一度お試しください。');
      setIsSubmitting(false);
    }
  };

  const requestedAmount = parseInt(transferAmount) || 0;
  const validation = validateTransferRequest(requestedAmount, availableBalance);
  
  // 金額が有効な場合のみ計算、それ以外は0を表示
  const shouldCalculate = requestedAmount >= CONSTANTS.MINIMUM_TRANSFER_AMOUNT && requestedAmount <= availableBalance;
  
  const transferCalculation = shouldCalculate 
    ? (isEarlyPayment ? calculateEarlyPayment(requestedAmount) : calculateNormalTransfer(requestedAmount))
    : {
        requestAmount: 0,
        platformFee: 0,
        platformFeeTax: 0,
        earlyPaymentFee: 0,
        earlyPaymentFeeTax: 0,
        transferFee: 0,
        totalFees: 0,
        netAmount: 0
      };

  const { netAmount } = transferCalculation;

  // 支払予定日
  const paymentDate = isEarlyPayment 
    ? calculateEarlyPaymentDate()
    : calculateNextPaymentDate();

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

  if (!bankAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-white mr-4 p-2 hover:bg-white/20 rounded-full" data-testid="button-back">
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">振込申請</h1>
        </motion.div>

        <div className="p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 text-center shadow-xl border-2 border-pink-100">
            <AlertCircle className="w-24 h-24 text-pink-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">口座登録が必要です</h2>
            <p className="text-gray-600 mb-6 text-lg">
              振込申請を行うには、まず銀行口座を登録してください。
            </p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/bank-account-registration')} className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all shadow-lg" data-testid="button-register-bank">
              口座を登録する
            </motion.button>
          </motion.div>
        </div>

        <BottomNavigationWithCreator active="account" />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center z-10 shadow-lg">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-white mr-4 p-2 hover:bg-white/20 rounded-full" data-testid="button-back">
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">申請完了</h1>
        </motion.div>

        <div className="p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 text-center shadow-xl border-2 border-pink-100">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <CheckCircle className="w-24 h-24 text-pink-500 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">振込申請完了！</h2>
            <p className="text-gray-600 mb-6 text-lg">
              {isEarlyPayment ? '早払い振込申請を受け付けました。' : '振込申請を受け付けました。'}<br />
              {formatDate(paymentDate)}までに指定口座へ振り込まれます。
            </p>
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 mb-6">
              <p className="text-xl font-bold text-gray-900">{formatCurrency(netAmount)}</p>
              <p className="text-sm text-gray-600 font-medium">振込金額（手数料差引後）</p>
            </div>
            {isEarlyPayment && (
              <div className="bg-gradient-to-r from-pink-100 to-pink-200 rounded-xl p-3 mb-6 border border-pink-300">
                <p className="text-sm text-pink-800 font-semibold flex items-center justify-center">
                  <Zap className="w-4 h-4 mr-1" />
                  早払い申請（{CONSTANTS.EARLY_PAYMENT_DAYS}営業日以内に振込）
                </p>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/sales-management')} className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all shadow-lg" data-testid="button-sales">
              売上管理へ
            </motion.button>
          </motion.div>
        </div>

        <BottomNavigationWithCreator active="account" />
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
            <Send className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">振込申請</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* 利用可能残高 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 shadow-xl border-2 border-pink-200 relative overflow-hidden">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-pink-900 mb-3 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              利用可能残高
            </h3>
            <p className="text-4xl font-bold text-pink-900 mb-2" data-testid="text-available-balance">{formatCurrency(availableBalance)}</p>
            <p className="text-sm text-pink-700 font-medium">最低振込金額: {formatCurrency(CONSTANTS.MINIMUM_TRANSFER_AMOUNT)}</p>
          </div>
        </motion.div>

        {/* 振込タイプ選択 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-6 shadow-xl border-2 border-pink-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-pink-500" />
            振込タイプ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* 通常振込 */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEarlyPayment(false)}
              className={`p-4 rounded-xl border-2 transition-all ${
                !isEarlyPayment
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-pink-400 shadow-lg'
                  : 'bg-white text-gray-700 border-pink-100 hover:border-pink-300'
              }`}
              data-testid="button-normal-payment"
            >
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <h4 className="font-bold text-sm mb-1">通常振込</h4>
              <p className={`text-xs ${!isEarlyPayment ? 'text-pink-100' : 'text-gray-500'}`}>
                末締め翌々5日払い
              </p>
            </motion.button>

            {/* 早払い */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEarlyPayment(true)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isEarlyPayment
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-pink-400 shadow-lg'
                  : 'bg-white text-gray-700 border-pink-100 hover:border-pink-300'
              }`}
              data-testid="button-early-payment"
            >
              <Zap className="w-8 h-8 mx-auto mb-2" />
              <h4 className="font-bold text-sm mb-1">早払い</h4>
              <p className={`text-xs ${isEarlyPayment ? 'text-pink-100' : 'text-gray-500'}`}>
                {CONSTANTS.EARLY_PAYMENT_DAYS}営業日以内
              </p>
            </motion.button>
          </div>
        </motion.div>

        {/* 振込金額入力 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-xl border-2 border-pink-100 space-y-5">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-pink-500" />
            振込金額
          </h3>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">振込希望金額 *</label>
            <div className="relative">
              <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full px-4 py-4 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-bold text-xl" placeholder="金額を入力" min={CONSTANTS.MINIMUM_TRANSFER_AMOUNT} max={availableBalance} data-testid="input-amount" />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">円</span>
            </div>
            {!validation.isValid && transferAmount && (
              <div className="mt-2 space-y-1">
                {validation.errors.map((error, index) => (
                  <p key={index} className="text-sm text-pink-600 font-medium flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* 手数料詳細 */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-700 font-medium">振込希望金額</span><span className="font-bold" data-testid="text-requested-amount">{formatCurrency(requestedAmount)}</span></div>
            
            {/* システム利用料（税込） */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">システム利用料（税込16.5%）</span>
              <span className="font-bold" data-testid="text-platform-fee">{formatCurrency(transferCalculation.platformFee + transferCalculation.platformFeeTax)}</span>
            </div>
            
            {/* 早払い手数料（税込・早払いのみ） */}
            {isEarlyPayment && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">早払い手数料（税込8.8%）</span>
                <span className="font-bold" data-testid="text-early-fee">{formatCurrency(transferCalculation.earlyPaymentFee + transferCalculation.earlyPaymentFeeTax)}</span>
              </div>
            )}
            
            {/* 振込手数料 */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">振込手数料</span>
              <span className="font-bold" data-testid="text-transfer-fee">{formatCurrency(transferCalculation.transferFee)}</span>
            </div>
            
            {/* 総手数料 */}
            <div className="flex justify-between text-sm border-t border-pink-200 pt-2">
              <span className="text-gray-700 font-medium">総手数料</span>
              <span className="font-bold text-pink-600" data-testid="text-total-fees">{formatCurrency(transferCalculation.totalFees)}</span>
            </div>
            
            {/* 差引振込金額 */}
            <div className="border-t-2 border-pink-200 pt-2 flex justify-between"><span className="font-bold text-lg">差引振込金額</span><span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent" data-testid="text-net-amount">{formatCurrency(netAmount)}</span></div>
          </div>

          {/* 支払予定日 */}
          <div className="bg-gradient-to-r from-pink-100 to-pink-200 rounded-xl p-4 border border-pink-300">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-pink-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                支払予定日
              </span>
              <span className="text-lg font-bold text-pink-900" data-testid="text-payment-date">
                {formatDate(paymentDate)}
              </span>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowConfirm(true)} disabled={!validation.isValid || !transferAmount} className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed" data-testid="button-request">
            <Send className="w-6 h-6" />
            <span>{isEarlyPayment ? '早払いを申請する' : '振込を申請する'}</span>
          </motion.button>
        </motion.div>

        {/* 振込履歴 */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900">振込履歴</h3>
          {recentTransfers.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-pink-100">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">振込履歴はありません</p>
            </motion.div>
          ) : (
            recentTransfers.map((transfer, index) => (
              <motion.div key={transfer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.05 }} whileHover={{ scale: 1.02, y: -2 }} className="bg-white rounded-2xl p-5 shadow-lg border-2 border-pink-100" data-testid={`transfer-item-${transfer.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-gray-900 text-lg" data-testid={`text-bank-${transfer.id}`}>{transfer.bankName || '銀行名不明'}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(transfer.status)}`} data-testid={`text-status-${transfer.id}`}>{getStatusText(transfer.status)}</span>
                      {transfer.type === 'early' && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-200 to-pink-300 text-pink-800 border border-pink-400 flex items-center" data-testid={`text-type-${transfer.id}`}>
                          <Zap className="w-3 h-3 mr-1" />
                          {getTypeLabel(transfer.type)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium flex items-center" data-testid={`text-date-${transfer.id}`}><Calendar className="w-4 h-4 mr-1" />{formatDate(transfer.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent" data-testid={`text-amount-${transfer.id}`}>{formatCurrency(transfer.netAmount || 0)}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 振込について（ピンクグラデーション） */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-pink-100 to-pink-200 border-2 border-pink-300 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-pink-700 mt-1" />
            <div>
              <h4 className="font-bold text-pink-900 mb-2 text-lg">振込について</h4>
              <ul className="text-base text-pink-800 space-y-2">
                <li>• システム利用料: 税込16.5%</li>
                <li>• 通常振込: 末締め翌々5日払い（振込手数料: {formatCurrency(CONSTANTS.TRANSFER_FEE)}）</li>
                <li>• 早払い: {CONSTANTS.EARLY_PAYMENT_DAYS}営業日以内（早払い手数料: 税込8.8%）</li>
                <li>• 最低振込金額は{formatCurrency(CONSTANTS.MINIMUM_TRANSFER_AMOUNT)}です</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 確認モーダル */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !isSubmitting && setShowConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isEarlyPayment ? <Zap className="w-8 h-8 text-pink-600" /> : <Send className="w-8 h-8 text-pink-600" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isEarlyPayment ? '早払い申請の確認' : '振込申請の確認'}
                </h3>
                <p className="text-gray-600 mb-4">以下の金額で{isEarlyPayment ? '早払い' : ''}振込申請を行います</p>
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 mb-3">
                  <p className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">{formatCurrency(netAmount)}</p>
                  <p className="text-xs text-gray-500 mt-1">（手数料{formatCurrency(isEarlyPayment ? transferCalculation.totalFees : transferCalculation.transferFee)}差引後）</p>
                </div>
                <div className="bg-gradient-to-r from-pink-100 to-pink-200 rounded-xl p-3 border border-pink-300">
                  <p className="text-sm text-pink-800 font-semibold">
                    支払予定日: {formatDate(paymentDate)}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center space-x-2" data-testid="button-confirm">
                  {isSubmitting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>処理中...</span>
                    </>
                  ) : (
                    <span>申請する</span>
                  )}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowConfirm(false)} disabled={isSubmitting} className="w-full bg-pink-100 text-pink-800 py-4 rounded-xl font-bold hover:bg-pink-200 transition-all" data-testid="button-cancel-confirm">キャンセル</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default TransferRequestPage;
