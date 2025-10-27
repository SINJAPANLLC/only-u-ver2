// 支払いシステムユーティリティ

/**
 * 支払いスケジュール管理
 */
export class PaymentSchedule {
  constructor() {
    this.schedule = new Map();
  }

  // 支払いスケジュールを追加
  addPayment(paymentId, amount, dueDate, type = 'revenue') {
    this.schedule.set(paymentId, {
      id: paymentId,
      amount,
      dueDate: new Date(dueDate),
      type,
      status: 'pending',
      createdAt: new Date(),
      paidAt: null
    });
  }

  // 支払いを実行
  processPayment(paymentId, paymentMethod = 'bank_transfer') {
    const payment = this.schedule.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new Error('Payment already processed');
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.paymentMethod = paymentMethod;

    return payment;
  }

  // 支払いスケジュールを取得
  getSchedule(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.schedule.values()).filter(payment => 
      payment.dueDate >= start && payment.dueDate <= end
    );
  }

  // 未払いの支払いを取得
  getPendingPayments() {
    return Array.from(this.schedule.values()).filter(payment => 
      payment.status === 'pending'
    );
  }
}

/**
 * 末締翌々5日払いの支払い日を計算
 * @param {Date} targetDate - 対象日
 * @returns {Date} 支払い日
 */
export const calculatePaymentDate = (targetDate = new Date()) => {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  // 翌々月の5日
  const paymentDate = new Date(year, month + 2, 5);
  
  return paymentDate;
};

/**
 * 支払い期間を計算
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {object} 支払い期間情報
 */
export const calculatePaymentPeriod = (startDate, endDate) => {
  const paymentDate = calculatePaymentDate(endDate);
  const daysUntilPayment = Math.ceil((paymentDate - new Date()) / (1000 * 60 * 60 * 24));
  
  return {
    period: {
      start: startDate,
      end: endDate
    },
    paymentDate,
    daysUntilPayment,
    status: daysUntilPayment > 0 ? 'pending' : 'overdue'
  };
};

/**
 * 支払い履歴を管理
 */
export class PaymentHistory {
  constructor() {
    this.history = [];
  }

  // 支払い履歴を追加
  addPayment(payment) {
    this.history.push({
      id: Date.now().toString(),
      ...payment,
      createdAt: new Date()
    });
  }

  // 支払い履歴を取得
  getHistory(filters = {}) {
    let filtered = [...this.history];

    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(p => p.createdAt >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(p => p.createdAt <= new Date(filters.endDate));
    }

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  // 支払い統計を取得
  getStatistics(period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    const periodPayments = this.history.filter(p => p.createdAt >= startDate);
    
    const totalAmount = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = periodPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = periodPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      period,
      totalAmount,
      paidAmount,
      pendingAmount,
      paymentCount: periodPayments.length,
      averageAmount: periodPayments.length > 0 ? totalAmount / periodPayments.length : 0
    };
  }
}

/**
 * 支払い通知を送信
 * @param {object} payment - 支払い情報
 * @param {function} sendNotification - 通知送信関数
 */
export const sendPaymentNotification = async (payment, sendNotification) => {
  const notifications = [];

  // 支払い完了通知
  if (payment.status === 'paid') {
    notifications.push(
      sendNotification({
        type: 'payment',
        title: '支払い完了',
        message: `¥${payment.amount.toLocaleString()}の支払いが完了しました`,
        priority: 'high',
        data: { paymentId: payment.id, amount: payment.amount }
      })
    );
  }

  // 支払い予定通知（支払い日の3日前）
  const paymentDate = new Date(payment.dueDate);
  const reminderDate = new Date(paymentDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  if (new Date() >= reminderDate && payment.status === 'pending') {
    notifications.push(
      sendNotification({
        type: 'payment',
        title: '支払い予定のお知らせ',
        message: `¥${payment.amount.toLocaleString()}の支払いが3日後に予定されています`,
        priority: 'medium',
        data: { paymentId: payment.id, dueDate: payment.dueDate }
      })
    );
  }

  return notifications;
};

/**
 * 支払いレポートを生成
 * @param {Array} payments - 支払いデータ
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {object} 支払いレポート
 */
export const generatePaymentReport = (payments, startDate, endDate) => {
  const filteredPayments = payments.filter(p => 
    p.createdAt >= startDate && p.createdAt <= endDate
  );

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const statusBreakdown = filteredPayments.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const typeBreakdown = filteredPayments.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + p.amount;
    return acc;
  }, {});

  return {
    period: { startDate, endDate },
    summary: {
      totalAmount,
      paidAmount,
      pendingAmount,
      paymentCount: filteredPayments.length
    },
    breakdown: {
      status: statusBreakdown,
      type: typeBreakdown
    },
    payments: filteredPayments
  };
};
