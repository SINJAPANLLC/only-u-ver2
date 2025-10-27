import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit3, Trash2, Copy, Calendar, Users, Gift, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const CouponManagementPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: '',
    minAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    description: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Firestoreからクリエイターのクーポンを取得
    const couponsQuery = query(
      collection(db, 'coupons'),
      where('creatorId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(couponsQuery, (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom?.toDate?.() || new Date(doc.data().validFrom),
        validUntil: doc.data().validUntil?.toDate?.() || new Date(doc.data().validUntil),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setCoupons(couponsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const statusOptions = [
    { id: 'all', name: 'すべて' },
    { id: 'active', name: 'アクティブ' },
    { id: 'expired', name: '期限切れ' },
    { id: 'scheduled', name: '予定' },
    { id: 'paused', name: '一時停止' }
  ];

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const validUntil = coupon.validUntil instanceof Date ? coupon.validUntil : new Date(coupon.validUntil);
    const validFrom = coupon.validFrom instanceof Date ? coupon.validFrom : new Date(coupon.validFrom);
    
    if (validUntil < now) return 'expired';
    if (validFrom > now) return 'scheduled';
    if (coupon.status === 'paused') return 'paused';
    return 'active';
  };

  const filteredCoupons = coupons.filter(coupon => {
    if (filterStatus === 'all') return true;
    return getCouponStatus(coupon) === filterStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const couponData = {
        creatorId: currentUser.uid,
        name: formData.name,
        code: formData.code,
        type: formData.type,
        value: parseInt(formData.value),
        minAmount: parseInt(formData.minAmount) || 0,
        maxDiscount: parseInt(formData.maxDiscount) || 0,
        usageLimit: parseInt(formData.usageLimit) || 0,
        usedCount: 0,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
        description: formData.description,
        status: 'active',
        createdAt: new Date()
      };

      if (editingId) {
        // 編集処理
        await updateDoc(doc(db, 'coupons', editingId), {
          ...couponData,
          updatedAt: new Date()
        });
      } else {
        // 新規作成処理
        await addDoc(collection(db, 'coupons'), couponData);
      }
      
      setIsCreating(false);
      setEditingId(null);
      setFormData({
        name: '',
        code: '',
        type: 'percentage',
        value: '',
        minAmount: '',
        maxDiscount: '',
        usageLimit: '',
        validFrom: '',
        validUntil: '',
        description: ''
      });
    } catch (error) {
      console.error('クーポン保存エラー:', error);
      alert('クーポンの保存に失敗しました');
    }
  };

  const handleEdit = (coupon) => {
    const validFrom = coupon.validFrom instanceof Date ? coupon.validFrom : new Date(coupon.validFrom);
    const validUntil = coupon.validUntil instanceof Date ? coupon.validUntil : new Date(coupon.validUntil);
    
    setFormData({
      name: coupon.name,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      minAmount: coupon.minAmount.toString(),
      maxDiscount: coupon.maxDiscount.toString(),
      usageLimit: coupon.usageLimit.toString(),
      validFrom: validFrom.toISOString().split('T')[0],
      validUntil: validUntil.toISOString().split('T')[0],
      description: coupon.description || ''
    });
    setEditingId(coupon.id);
    setIsCreating(true);
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('このクーポンを削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'coupons', couponId));
      } catch (error) {
        console.error('クーポン削除エラー:', error);
        alert('クーポンの削除に失敗しました');
      }
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('クーポンコードをコピーしました');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'アクティブ';
      case 'expired':
        return '期限切れ';
      case 'scheduled':
        return '予定';
      case 'paused':
        return '一時停止';
      default:
        return '不明';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'paused':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">戻る</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">クーポン管理</h1>
          <button
            onClick={() => {
              setIsCreating(true);
              setEditingId(null);
              setFormData({
                name: '',
                code: '',
                type: 'percentage',
                value: '',
                minAmount: '',
                maxDiscount: '',
                usageLimit: '',
                validFrom: '',
                validUntil: '',
                description: ''
              });
            }}
            className="bg-pink-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            新規作成
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600">総クーポン数</p>
              <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600">アクティブ</p>
              <p className="text-2xl font-bold text-green-600">{coupons.filter(c => getCouponStatus(c) === 'active').length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600">使用済み</p>
              <p className="text-2xl font-bold text-blue-600">{coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}</p>
            </div>
          </motion.div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">ステータスフィルター</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'クーポンを編集' : '新しいクーポンを作成'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">クーポン名</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="例: 新規ユーザー割引"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">クーポンコード</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="例: WELCOME20"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      生成
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">割引タイプ</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="percentage">パーセント割引</option>
                    <option value="fixed">固定金額割引</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'percentage' ? '割引率 (%)' : '割引額 (円)'}
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder={formData.type === 'percentage' ? '20' : '1000'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最小購入金額</label>
                  <input
                    type="number"
                    name="minAmount"
                    value={formData.minAmount}
                    onChange={handleInputChange}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大割引額</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">使用回数制限</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="100 (0 = 無制限)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有効期限</label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="クーポンの説明を入力してください"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  {editingId ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Coupons List */}
        <div className="space-y-4">
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Gift className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">クーポンがありません</h3>
              <p className="text-gray-600 mb-4">新しいクーポンを作成してユーザーに特典を提供しましょう</p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
              >
                クーポンを作成
              </button>
            </div>
          ) : (
            filteredCoupons.map((coupon, index) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{coupon.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(getCouponStatus(coupon))}`}>
                        {getStatusIcon(getCouponStatus(coupon))}
                        <span>{getStatusText(getCouponStatus(coupon))}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{coupon.code}</span>
                      <span>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)} 割引
                      </span>
                      <span>最小: {formatCurrency(coupon.minAmount)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>使用: {coupon.usedCount || 0}/{coupon.usageLimit || '∞'}</span>
                      <span>期限: {formatDate(coupon.validUntil)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default CouponManagementPage;
