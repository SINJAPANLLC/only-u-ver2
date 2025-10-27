import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Edit3,
  Save,
  X,
  Calendar,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const PersonalInfoPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [personalInfo, setPersonalInfo] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: ''
  });

  const [formData, setFormData] = useState(personalInfo);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const info = {
            displayName: userData.displayName || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            birthDate: userData.birthDate || '',
            gender: userData.gender || ''
          };
          setPersonalInfo(info);
          setFormData(info);
        }
        setLoading(false);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!formData.displayName.trim()) {
      alert('表示名を入力してください');
      return;
    }

    if (formData.birthDate && !isValidDate(formData.birthDate)) {
      alert('有効な生年月日を入力してください');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        displayName: formData.displayName.trim(),
        updatedAt: new Date()
      };

      if (formData.firstName.trim()) {
        updateData.firstName = formData.firstName.trim();
      }

      if (formData.lastName.trim()) {
        updateData.lastName = formData.lastName.trim();
      }

      if (formData.birthDate) {
        updateData.birthDate = formData.birthDate;
      }

      if (formData.gender) {
        updateData.gender = formData.gender;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      
      const updatedPersonalInfo = {
        ...personalInfo,
        ...updateData
      };
      setPersonalInfo(updatedPersonalInfo);
      setFormData(updatedPersonalInfo);
      setIsEditing(false);
      alert('個人情報を更新しました');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleCancel = () => {
    setFormData(personalInfo);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <User className="w-12 h-12 text-pink-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 border-b border-pink-300 p-6 flex items-center justify-between z-10 shadow-lg">
        <div className="flex items-center">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-white mr-4 p-2 hover:bg-white/20 rounded-full" data-testid="button-back">
            <ArrowLeft size={24} />
          </motion.button>
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <User className="w-7 h-7 text-white mr-3" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">個人情報</h1>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(!isEditing)} className="text-white p-2 hover:bg-white/20 rounded-full" data-testid="button-edit-toggle">
          {isEditing ? <X size={24} /> : <Edit3 size={24} />}
        </motion.button>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* 情報メッセージ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200"
        >
          <p className="text-sm text-blue-700">
            ℹ️ この情報はプロフィールに表示されます。正確な情報を入力してください。
          </p>
        </motion.div>

        {/* 基本情報 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border-2 border-pink-100 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
            <User className="w-6 h-6 mr-3 text-pink-500" />
            基本情報
          </h2>
          
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                表示名 <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.displayName} 
                  onChange={(e) => handleInputChange('displayName', e.target.value)} 
                  placeholder="山田 太郎"
                  className="w-full px-5 py-3 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold shadow-sm" 
                  data-testid="input-displayName" 
                />
              ) : (
                <p className="px-5 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl flex items-center font-semibold border border-pink-100">
                  <User className="w-4 h-4 mr-2 text-pink-500" />
                  {personalInfo.displayName || '未設定'}
                </p>
              )}
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <label className="block text-sm font-bold text-gray-700 mb-2">姓</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.lastName} 
                    onChange={(e) => handleInputChange('lastName', e.target.value)} 
                    placeholder="山田"
                    className="w-full px-5 py-3 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold shadow-sm" 
                    data-testid="input-lastName" 
                  />
                ) : (
                  <p className="px-5 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl font-semibold border border-pink-100">
                    {personalInfo.lastName || '未設定'}
                  </p>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <label className="block text-sm font-bold text-gray-700 mb-2">名</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.firstName} 
                    onChange={(e) => handleInputChange('firstName', e.target.value)} 
                    placeholder="太郎"
                    className="w-full px-5 py-3 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold shadow-sm" 
                    data-testid="input-firstName" 
                  />
                ) : (
                  <p className="px-5 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl font-semibold border border-pink-100">
                    {personalInfo.firstName || '未設定'}
                  </p>
                )}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                生年月日
              </label>
              {isEditing ? (
                <input 
                  type="date" 
                  value={formData.birthDate} 
                  onChange={(e) => handleInputChange('birthDate', e.target.value)} 
                  className="w-full px-5 py-3 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold shadow-sm" 
                  data-testid="input-birthDate" 
                />
              ) : (
                <p className="px-5 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl flex items-center font-semibold border border-pink-100">
                  <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                  {personalInfo.birthDate || '未設定'}
                </p>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <label className="block text-sm font-bold text-gray-700 mb-2">性別</label>
              {isEditing ? (
                <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)} className="w-full px-5 py-3 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold shadow-sm" data-testid="select-gender">
                  <option value="">選択してください</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                  <option value="prefer_not_to_say">回答しない</option>
                </select>
              ) : (
                <p className="px-5 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl font-semibold border border-pink-100">
                  {personalInfo.gender === 'male' ? '男性' : personalInfo.gender === 'female' ? '女性' : personalInfo.gender === 'other' ? 'その他' : personalInfo.gender === 'prefer_not_to_say' ? '回答しない' : '未設定'}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* 保存/キャンセルボタン */}
        {isEditing && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex space-x-4">
            <motion.button 
              onClick={handleSave} 
              disabled={saving}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50" 
              data-testid="button-save"
            >
              <Save className="w-6 h-6" />
              <span>{saving ? '保存中...' : '保存する'}</span>
            </motion.button>
            <motion.button 
              onClick={handleCancel} 
              disabled={saving}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              className="flex-1 bg-gray-200 text-gray-700 py-5 rounded-2xl font-bold text-lg hover:bg-gray-300 transition-all flex items-center justify-center space-x-3 disabled:opacity-50" 
              data-testid="button-cancel"
            >
              <X className="w-6 h-6" />
              <span>キャンセル</span>
            </motion.button>
          </motion.div>
        )}

        {/* ヘルプ情報 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 rounded-2xl p-6 relative overflow-hidden">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
          <div className="flex items-start space-x-4 relative z-10">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Sparkles className="w-6 h-6 text-pink-600 mt-1" />
            </motion.div>
            <div>
              <h4 className="font-bold text-pink-900 mb-2 text-lg">プライバシーについて</h4>
              <ul className="text-base text-pink-800 space-y-2">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2" />生年月日は本人確認に使用されます</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2" />表示名はプロフィールに公開されます</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2" />姓名は本人確認時に使用される場合があります</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNavigationWithCreator active="account" />
    </div>
  );
};

export default PersonalInfoPage;
