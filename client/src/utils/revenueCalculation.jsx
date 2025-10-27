// 売上手数料計算ユーティリティ

/**
 * 売上手数料を計算する
 * @param {number} amount - 売上金額
 * @param {string} type - 手数料タイプ ('purchase', 'sale', 'early_payment')
 * @returns {object} 手数料詳細
 */
export const calculateFee = (amount, type) => {
  const taxRate = 0.10; // 消費税率10%
  
  let feeRate;
  let feeName;
  
  switch (type) {
    case 'purchase':
      feeRate = 0.10; // 購入手数料10%税別
      feeName = '購入手数料';
      break;
    case 'sale':
      feeRate = 0.15; // 売上手数料15%税別
      feeName = '売上手数料';
      break;
    case 'early_payment':
      feeRate = 0.08; // 早払い手数料8%税別
      feeName = '早払い手数料';
      break;
    default:
      throw new Error('Invalid fee type');
  }
  
  const feeExcludingTax = Math.floor(amount * feeRate);
  const feeTax = Math.floor(feeExcludingTax * taxRate);
  const feeIncludingTax = feeExcludingTax + feeTax;
  
  return {
    feeName,
    feeRate: feeRate * 100,
    amount,
    feeExcludingTax,
    feeTax,
    feeIncludingTax,
    netAmount: amount - feeIncludingTax
  };
};

/**
 * 振込手数料を計算する
 * @returns {object} 振込手数料詳細
 */
export const calculateTransferFee = () => {
  const transferFee = 330; // 振込手数料330円税込
  const taxRate = 0.10;
  
  // 税込から税抜を逆算
  const feeExcludingTax = Math.floor(transferFee / (1 + taxRate));
  const feeTax = transferFee - feeExcludingTax;
  
  return {
    feeName: '振込手数料',
    feeIncludingTax: transferFee,
    feeExcludingTax,
    feeTax,
    taxRate: taxRate * 100
  };
};

/**
 * 総手数料を計算する
 * @param {number} saleAmount - 売上金額
 * @param {number} purchaseAmount - 購入金額
 * @param {boolean} isEarlyPayment - 早払いかどうか
 * @returns {object} 総手数料詳細
 */
export const calculateTotalFees = (saleAmount, purchaseAmount = 0, isEarlyPayment = false) => {
  const saleFee = calculateFee(saleAmount, 'sale');
  const purchaseFee = purchaseAmount > 0 ? calculateFee(purchaseAmount, 'purchase') : null;
  const earlyPaymentFee = isEarlyPayment ? calculateFee(saleAmount, 'early_payment') : null;
  const transferFee = calculateTransferFee();
  
  const totalFees = saleFee.feeIncludingTax + 
    (purchaseFee ? purchaseFee.feeIncludingTax : 0) + 
    (earlyPaymentFee ? earlyPaymentFee.feeIncludingTax : 0) + 
    transferFee.feeIncludingTax;
  
  const netAmount = saleAmount - totalFees;
  
  return {
    saleFee,
    purchaseFee,
    earlyPaymentFee,
    transferFee,
    totalFees,
    netAmount,
    breakdown: {
      saleAmount,
      purchaseAmount,
      isEarlyPayment,
      totalFeesIncludingTax: totalFees,
      netAmount
    }
  };
};

/**
 * 高画質プラン料金を計算する
 * @returns {object} 高画質プラン料金詳細
 */
export const calculateHighQualityPlanFee = () => {
  const basePrice = 980; // 高画質プラン980円月税込
  const taxRate = 0.10;
  
  // 税込から税抜を逆算
  const priceExcludingTax = Math.floor(basePrice / (1 + taxRate));
  const tax = basePrice - priceExcludingTax;
  
  return {
    planName: '高画質プラン',
    priceIncludingTax: basePrice,
    priceExcludingTax,
    tax,
    taxRate: taxRate * 100,
    period: '月額'
  };
};

/**
 * 支払いスケジュールを計算する（末締翌々5日払い）
 * @param {Date} targetDate - 対象日
 * @returns {object} 支払いスケジュール
 */
export const calculatePaymentSchedule = (targetDate = new Date()) => {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  // 月末日を取得
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const closingDate = new Date(year, month, lastDayOfMonth);
  
  // 翌々月の5日
  const paymentDate = new Date(year, month + 2, 5);
  
  return {
    closingDate,
    paymentDate,
    description: '末締翌々5日払い',
    daysUntilPayment: Math.ceil((paymentDate - targetDate) / (1000 * 60 * 60 * 24))
  };
};

/**
 * 売上レポートを生成する
 * @param {Array} transactions - 取引データ
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {object} 売上レポート
 */
export const generateRevenueReport = (transactions, startDate, endDate) => {
  const filteredTransactions = transactions.filter(tx => 
    tx.date >= startDate && tx.date <= endDate
  );
  
  const totalSales = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalFees = filteredTransactions.reduce((sum, tx) => {
    const fees = calculateTotalFees(tx.amount, tx.purchaseAmount, tx.isEarlyPayment);
    return sum + fees.totalFees;
  }, 0);
  
  const netRevenue = totalSales - totalFees;
  
  return {
    period: { startDate, endDate },
    totalSales,
    totalFees,
    netRevenue,
    transactionCount: filteredTransactions.length,
    averageTransactionValue: totalSales / filteredTransactions.length || 0,
    feePercentage: totalSales > 0 ? (totalFees / totalSales) * 100 : 0
  };
};
