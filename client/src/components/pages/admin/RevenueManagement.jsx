import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Search, 
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  CreditCard,
  Eye
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  AdminPageContainer, 
  AdminPageHeader, 
  AdminStatsCard, 
  AdminContentCard, 
  AdminTableContainer, 
  AdminEmptyState, 
  AdminLoadingState 
} from './AdminPageContainer';

// カウントアップアニメーションコンポーネント
const AnimatedNumber = ({ value, duration = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / (duration * 1000);
      
      if (progress < 1) {
        setDisplayValue(Math.floor(value * progress));
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const RevenueManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFee: 0,
    tax: 0,
    purchaseRevenue: 0,
    creatorPayments: 0,
    transferSystemFee: 0,
    transferBankFee: 0,
    totalPlatformProfit: 0,
    actualCreatorPayouts: 0,
    pendingAmount: 0,
    transactionCount: 0
  });

  const statusOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'pending', label: '処理中' },
    { value: 'completed', label: '完了' },
    { value: 'failed', label: '失敗' },
    { value: 'cancelled', label: 'キャンセル' }
  ];

  const typeOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'subscription', label: 'サブスクリプション' },
    { value: 'purchase', label: '単品購入' },
    { value: 'tip', label: 'チップ' },
    { value: 'donation', label: '寄付' },
    { value: 'refund', label: '返金' }
  ];

  // Firestoreから取引データと振込申請データをリアルタイム取得
  useEffect(() => {
    const transactionsQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const transfersQuery = query(collection(db, 'transferRequests'));
    
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        // transactionsに保存されたplatformFeeとtaxを直接使用（二重計算を回避）
        const platformFee = data.platformFee || 0;
        const tax = data.tax || 0;
        const totalFees = platformFee + tax;
        const creatorAmount = data.creatorAmount || (amount - totalFees);
        
        return {
          id: doc.id,
          type: data.type || 'subscription',
          amount: amount,
          fees: {
            platformFee: platformFee,
            tax: tax,
            totalFees: totalFees
          },
          netAmount: creatorAmount,
          status: data.status || 'pending',
          userName: data.userName || data.customerName || 'Unknown',
          creatorName: data.creatorName || 'Unknown',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : null,
          paymentMethod: data.paymentMethod || 'credit_card',
          description: data.description || ''
        };
      });
      
      setTransactions(transactionsData);
      setLoading(false);
      setIsRefreshing(false);
    });

    // 振込申請データを取得して統計に反映
    const unsubscribeTransfers = onSnapshot(transfersQuery, (snapshot) => {
      const transfersData = snapshot.docs.map(doc => doc.data());
      
      // システム利用料の合計（16.5%）
      const totalSystemFee = transfersData.reduce((sum, t) => {
        const platformFee = t.platformFee || 0;
        const platformFeeTax = t.platformFeeTax || 0;
        return sum + platformFee + platformFeeTax;
      }, 0);
      
      // 振込手数料の合計（¥330/件）
      const totalBankFee = transfersData.reduce((sum, t) => sum + (t.transferFee || 0), 0);
      
      // 実際のクリエイター振込額の合計
      const totalActualPayouts = transfersData.reduce((sum, t) => sum + (t.netAmount || 0), 0);
      
      // 統計を更新
      setStats(prev => {
        // 振込申請がない場合は、トランザクションベースの計算を保持
        const finalSystemFee = totalSystemFee > 0 ? totalSystemFee : prev.transferSystemFee;
        const finalBankFee = totalBankFee > 0 ? totalBankFee : prev.transferBankFee;
        
        // 総プラットフォーム利益 = 購入時収益 + システム利用料 + 振込手数料
        const totalPlatformProfit = (prev.platformFee + prev.tax) + finalSystemFee + finalBankFee;
        
        return {
          ...prev,
          transferSystemFee: finalSystemFee,
          transferBankFee: finalBankFee,
          totalPlatformProfit: totalPlatformProfit,
          actualCreatorPayouts: totalActualPayouts
        };
      });
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeTransfers();
    };
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterStatus, filterType]);

  // 統計を更新
  useEffect(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // 各トランザクションから手数料と税金を計算または取得
    let platformFee = 0;
    let tax = 0;
    let creatorPayments = 0;
    
    transactions.forEach(t => {
      if (t.platformFee !== undefined && t.tax !== undefined && t.creatorAmount !== undefined) {
        // 既にフィールドがある場合はそのまま使用
        platformFee += t.platformFee;
        tax += t.tax;
        creatorPayments += t.creatorAmount;
      } else {
        // フィールドがない場合は総額から逆算
        const basePrice = Math.floor(t.amount / 1.2); // クリエイター受取額
        const calculatedPlatformFee = Math.floor(basePrice * 0.10); // 10%
        const calculatedTax = Math.floor(basePrice * 0.10); // 10%
        
        platformFee += calculatedPlatformFee;
        tax += calculatedTax;
        creatorPayments += basePrice;
      }
    });
    
    // 購入時収益 = 購入手数料 + 税金
    const purchaseRevenue = platformFee + tax;
    
    // 振込時の手数料を計算（クリエイター売上から）
    // システム利用料 = 15% + 消費税10% = 16.5%
    const systemFee = Math.floor(creatorPayments * 0.165); // 16.5% システム利用料（税込）
    const transferFee = 0; // 振込申請機能実装後に1件あたり¥330を計算
    const transferRevenue = systemFee + transferFee; // 振込時収益
    const actualTransferAmount = creatorPayments - systemFee - transferFee; // 実振込額
    
    const pendingAmount = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    setStats(prev => {
      // 総プラットフォーム利益 = 購入時収益 + 振込時収益
      const totalPlatformProfit = purchaseRevenue + transferRevenue;
      
      return {
        ...prev,
        totalRevenue,
        platformFee,
        tax,
        purchaseRevenue,
        creatorPayments,
        transferSystemFee: systemFee,
        transferBankFee: transferFee,
        transferRevenue: transferRevenue,
        actualTransferAmount: actualTransferAmount,
        totalPlatformProfit,
        pendingAmount,
        transactionCount: transactions.length
      };
    });
  }, [transactions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString()}`;
  };

  if (loading) {
    return <AdminLoadingState message="売上データを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      {/* ページヘッダー */}
      <AdminPageHeader
        title="売上管理"
        description="取引履歴、売上統計を確認します"
        icon={DollarSign}
        actions={
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">更新</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">エクスポート</span>
            </motion.button>
          </>
        }
      />

      {/* プラットフォーム収益カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminStatsCard
          title="総取引数"
          value={<AnimatedNumber value={stats.transactionCount} />}
          icon={CreditCard}
          color="blue"
        />
        <AdminStatsCard
          title="総売上"
          value={`¥${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <AdminStatsCard
          title="総純利益"
          value={`¥${stats.totalPlatformProfit.toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* 購入時収益カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <AdminStatsCard
          title="購入手数料"
          value={`¥${stats.platformFee.toLocaleString()}`}
          icon={TrendingUp}
          color="orange"
        />
        <AdminStatsCard
          title="税金"
          value={`¥${stats.tax.toLocaleString()}`}
          icon={TrendingUp}
          color="orange"
        />
        <AdminStatsCard
          title="購入時収益"
          value={`¥${stats.purchaseRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* クリエイター収益カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
        <AdminStatsCard
          title="クリエイター売上"
          value={`¥${stats.creatorPayments.toLocaleString()}`}
          icon={CheckCircle}
          color="green"
        />
        <AdminStatsCard
          title="システム利用料"
          value={`¥${stats.transferSystemFee.toLocaleString()}`}
          icon={TrendingUp}
          color="orange"
        />
        <AdminStatsCard
          title="振込手数料"
          value={`¥${stats.transferBankFee.toLocaleString()}`}
          icon={TrendingUp}
          color="orange"
        />
        <AdminStatsCard
          title="振込時収益"
          value={`¥${stats.transferRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
        <AdminStatsCard
          title="実振込額"
          value={`¥${stats.actualTransferAmount.toLocaleString()}`}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* フィルターと検索 */}
      <AdminContentCard title="検索・フィルター">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="取引を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              data-testid="select-status"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              data-testid="select-type"
            >
              {typeOptions.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminContentCard>

      {/* 取引一覧テーブル */}
      <AdminTableContainer>
        {filteredTransactions.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  取引ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction, index) => (
                <motion.tr 
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-pink-50 transition-colors"
                  data-testid={`row-transaction-${transaction.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{transaction.id}</div>
                    <div className="text-xs text-gray-500">{transaction.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {typeOptions.find(t => t.value === transaction.type)?.label || transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.userName}</div>
                    <div className="text-xs text-gray-500">→ {transaction.creatorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.amount)}</div>
                    <div className="text-xs text-gray-500">純額: {formatCurrency(transaction.netAmount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {statusOptions.find(s => s.value === transaction.status)?.label || transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-pink-600 hover:text-pink-900 flex items-center space-x-1"
                      data-testid={`button-view-${transaction.id}`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>詳細</span>
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <AdminEmptyState
            icon={DollarSign}
            title="取引が見つかりません"
            description="検索条件を変更してください"
          />
        )}
      </AdminTableContainer>
    </AdminPageContainer>
  );
};

export default RevenueManagement;
