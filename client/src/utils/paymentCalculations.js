/**
 * 決済計算ユーティリティ
 * 合同会社SIN JAPAN KANAGAWA - Only-U Fans Platform
 */

// 定数
export const CONSTANTS = {
  TAX_RATE: 0.10,                    // 消費税率 10%
  PURCHASE_FEE_RATE: 0.10,           // 購入手数料 10%
  PLATFORM_FEE_RATE: 0.15,           // プラットフォーム手数料 15%
  EARLY_PAYMENT_FEE_RATE: 0.08,      // 早払い手数料 8%
  TRANSFER_FEE: 330,                 // 振込手数料 330円
  MINIMUM_TRANSFER_AMOUNT: 10000,    // 最小振込金額 10,000円
  EARLY_PAYMENT_DAYS: 3,             // 早払い支払サイト 3営業日以内
  COMPANY_NAME: '合同会社SIN JAPAN KANAGAWA'
};

/**
 * ユーザー側の支払い金額を計算
 * クリエイターが設定した金額 + 消費税10% + 購入手数料10%
 * 
 * @param {number} creatorSetPrice - クリエイターが設定した金額
 * @returns {object} 支払い詳細
 */
export const calculateUserPayment = (creatorSetPrice) => {
  const baseAmount = Number(creatorSetPrice) || 0;
  
  // 消費税を計算
  const tax = Math.floor(baseAmount * CONSTANTS.TAX_RATE);
  
  // 購入手数料を計算
  const purchaseFee = Math.floor(baseAmount * CONSTANTS.PURCHASE_FEE_RATE);
  
  // 合計金額
  const totalAmount = baseAmount + tax + purchaseFee;
  
  return {
    baseAmount,              // 基本金額
    tax,                     // 消費税10%
    purchaseFee,             // 購入手数料10%
    totalAmount,             // 合計
    breakdown: {
      baseAmountLabel: 'クリエイター設定金額',
      taxLabel: '消費税（10%）',
      purchaseFeeLabel: '購入手数料（10%）',
      totalLabel: '合計お支払い金額'
    }
  };
};

/**
 * クリエイター側の手取り金額を計算
 * 売上から15%のプラットフォーム手数料 + その消費税を差し引き
 * 
 * @param {number} salesAmount - 売上金額（クリエイターが設定した金額）
 * @returns {object} 手取り詳細
 */
export const calculateCreatorPayout = (salesAmount) => {
  const baseAmount = Number(salesAmount) || 0;
  
  // プラットフォーム手数料15%
  const platformFee = Math.floor(baseAmount * CONSTANTS.PLATFORM_FEE_RATE);
  
  // プラットフォーム手数料に対する消費税10%
  const platformFeeTax = Math.floor(platformFee * CONSTANTS.TAX_RATE);
  
  // 手取り金額
  const netAmount = baseAmount - platformFee - platformFeeTax;
  
  return {
    salesAmount: baseAmount,          // 売上金額
    platformFee,                      // プラットフォーム手数料15%
    platformFeeTax,                   // プラットフォーム手数料の消費税10%
    totalDeduction: platformFee + platformFeeTax,  // 総差引額
    netAmount,                        // 手取り金額
    breakdown: {
      salesAmountLabel: '売上金額',
      platformFeeLabel: 'プラットフォーム手数料（15%）',
      platformFeeTaxLabel: '手数料消費税（10%）',
      netAmountLabel: '手取り金額'
    }
  };
};

/**
 * 早払い申請時の手数料を計算
 * プラットフォーム手数料15% + 手数料消費税10% + 早払い手数料8% + 早払い手数料消費税10% + 振込手数料330円
 * 
 * @param {number} requestAmount - 早払い申請金額
 * @returns {object} 早払い詳細
 */
export const calculateEarlyPayment = (requestAmount) => {
  const baseAmount = Number(requestAmount) || 0;
  
  // プラットフォーム手数料15%
  const platformFee = Math.floor(baseAmount * CONSTANTS.PLATFORM_FEE_RATE);
  
  // プラットフォーム手数料の消費税10%
  const platformFeeTax = Math.floor(platformFee * CONSTANTS.TAX_RATE);
  
  // 早払い手数料8%
  const earlyPaymentFee = Math.floor(baseAmount * CONSTANTS.EARLY_PAYMENT_FEE_RATE);
  
  // 早払い手数料の消費税10%
  const earlyPaymentFeeTax = Math.floor(earlyPaymentFee * CONSTANTS.TAX_RATE);
  
  // 振込手数料
  const transferFee = CONSTANTS.TRANSFER_FEE;
  
  // 総手数料
  const totalFees = platformFee + platformFeeTax + earlyPaymentFee + earlyPaymentFeeTax + transferFee;
  
  // 実際の振込金額
  const netAmount = baseAmount - totalFees;
  
  return {
    requestAmount: baseAmount,        // 申請金額
    platformFee,                      // プラットフォーム手数料15%
    platformFeeTax,                   // プラットフォーム手数料の消費税10%
    earlyPaymentFee,                  // 早払い手数料8%
    earlyPaymentFeeTax,               // 早払い手数料の消費税10%
    transferFee,                      // 振込手数料330円
    totalFees,                        // 総手数料
    netAmount,                        // 実際の振込金額
    paymentDays: CONSTANTS.EARLY_PAYMENT_DAYS,  // 支払サイト
    breakdown: {
      requestAmountLabel: '早払い申請金額',
      platformFeeLabel: 'プラットフォーム手数料（15%）',
      platformFeeTaxLabel: '手数料消費税（10%）',
      earlyPaymentFeeLabel: '早払い手数料（8%）',
      earlyPaymentFeeTaxLabel: '早払い手数料の消費税（10%）',
      transferFeeLabel: '振込手数料',
      totalFeesLabel: '総手数料',
      netAmountLabel: '実際の振込金額',
      paymentDaysLabel: '支払サイト'
    }
  };
};

/**
 * 通常振込時の手数料を計算
 * プラットフォーム手数料15% + 手数料消費税10% + 振込手数料330円（末締め翌々5日払い）
 * 
 * @param {number} requestAmount - 振込申請金額
 * @returns {object} 通常振込詳細
 */
export const calculateNormalTransfer = (requestAmount) => {
  const baseAmount = Number(requestAmount) || 0;
  
  // プラットフォーム手数料15%
  const platformFee = Math.floor(baseAmount * CONSTANTS.PLATFORM_FEE_RATE);
  
  // プラットフォーム手数料の消費税10%
  const platformFeeTax = Math.floor(platformFee * CONSTANTS.TAX_RATE);
  
  // 振込手数料
  const transferFee = CONSTANTS.TRANSFER_FEE;
  
  // 総手数料
  const totalFees = platformFee + platformFeeTax + transferFee;
  
  // 実際の振込金額
  const netAmount = baseAmount - totalFees;
  
  // 次回支払日を計算（末締め翌々5日払い）
  const paymentDate = calculateNextPaymentDate();
  
  return {
    requestAmount: baseAmount,        // 申請金額
    platformFee,                      // プラットフォーム手数料15%
    platformFeeTax,                   // プラットフォーム手数料の消費税10%
    transferFee,                      // 振込手数料330円
    totalFees,                        // 総手数料
    netAmount,                        // 実際の振込金額
    paymentDate,                      // 支払予定日
    breakdown: {
      requestAmountLabel: '振込申請金額',
      platformFeeLabel: 'プラットフォーム手数料（15%）',
      platformFeeTaxLabel: '手数料消費税（10%）',
      transferFeeLabel: '振込手数料',
      totalFeesLabel: '総手数料',
      netAmountLabel: '実際の振込金額',
      paymentDateLabel: '支払予定日'
    }
  };
};

/**
 * 次回支払日を計算（末締め翌々5日払い）
 * 
 * @param {Date} targetDate - 基準日（デフォルト: 今日）
 * @returns {Date} 次回支払日
 */
export const calculateNextPaymentDate = (targetDate = new Date()) => {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  // 翌々月の5日
  const paymentDate = new Date(year, month + 2, 5);
  
  // 土日の場合は翌営業日に調整
  const dayOfWeek = paymentDate.getDay();
  if (dayOfWeek === 0) { // 日曜日
    paymentDate.setDate(paymentDate.getDate() + 1);
  } else if (dayOfWeek === 6) { // 土曜日
    paymentDate.setDate(paymentDate.getDate() + 2);
  }
  
  return paymentDate;
};

/**
 * 早払い支払予定日を計算（申請から3営業日以内）
 * 
 * @param {Date} requestDate - 申請日（デフォルト: 今日）
 * @returns {Date} 支払予定日
 */
export const calculateEarlyPaymentDate = (requestDate = new Date()) => {
  const paymentDate = new Date(requestDate);
  let businessDays = 0;
  
  // 3営業日後を計算
  while (businessDays < CONSTANTS.EARLY_PAYMENT_DAYS) {
    paymentDate.setDate(paymentDate.getDate() + 1);
    const dayOfWeek = paymentDate.getDay();
    
    // 土日を除外
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
  }
  
  return paymentDate;
};

/**
 * 振込可能かチェック
 * 
 * @param {number} amount - 申請金額
 * @param {number} availableBalance - 利用可能残高
 * @returns {object} バリデーション結果
 */
export const validateTransferRequest = (amount, availableBalance) => {
  const requestAmount = Number(amount) || 0;
  const balance = Number(availableBalance) || 0;
  
  const errors = [];
  
  if (requestAmount < CONSTANTS.MINIMUM_TRANSFER_AMOUNT) {
    errors.push(`最小振込金額は${formatCurrency(CONSTANTS.MINIMUM_TRANSFER_AMOUNT)}です`);
  }
  
  if (requestAmount > balance) {
    errors.push('利用可能残高を超えています');
  }
  
  if (requestAmount <= 0) {
    errors.push('有効な金額を入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 通貨フォーマット
 * 
 * @param {number} amount - 金額
 * @returns {string} フォーマット済み金額
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * 日付フォーマット
 * 
 * @param {Date} date - 日付
 * @returns {string} フォーマット済み日付
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * 売上サマリーを計算
 * 
 * @param {Array} sales - 売上データ配列
 * @returns {object} サマリー
 */
export const calculateSalesSummary = (sales) => {
  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalPayout = sales.reduce((sum, sale) => {
    const payout = calculateCreatorPayout(sale.amount);
    return sum + payout.netAmount;
  }, 0);
  
  const totalPlatformFees = totalSales - totalPayout;
  
  return {
    totalSales,              // 総売上
    totalPayout,             // 総手取り
    totalPlatformFees,       // 総プラットフォーム手数料
    salesCount: sales.length,
    averageSale: sales.length > 0 ? totalSales / sales.length : 0
  };
};
