import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Link as LinkIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { db } from '../../../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useToast } from '../../../hooks/use-toast';
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminStatsCard,
  AdminContentCard,
  AdminEmptyState,
  AdminLoadingState
} from './AdminPageContainer';

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

export default function HomeSliderManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSlider, setPreviewSlider] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    link: '',
    imageFile: null,
    imagePreview: null
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  // Firestoreからスライダーをリアルタイム取得
  useEffect(() => {
    const slidersQuery = query(
      collection(db, 'homeSliders'), 
      orderBy('position', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      slidersQuery,
      (snapshot) => {
        const slidersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? 
            doc.data().createdAt.toDate() : new Date()
        }));

        setSliders(slidersData);
        
        setStats({
          total: slidersData.length,
          active: slidersData.filter(s => s.isActive).length,
          inactive: slidersData.filter(s => !s.isActive).length
        });

        setLoading(false);
        setIsRefreshing(false);
      },
      (error) => {
        console.error('Error loading sliders:', error);
        toast({
          title: 'エラー',
          description: 'スライダーの読み込みに失敗しました',
          variant: 'destructive'
        });
        setLoading(false);
        setIsRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  // ファイル選択
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'エラー',
          description: '画像ファイルを選択してください',
          variant: 'destructive'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像アップロード（Object Storageを使用）
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-slider-image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.imageUrl;
  };

  // スライダー追加
  const handleAddSlider = async () => {
    if (!formData.imageFile) {
      toast({
        title: 'エラー',
        description: '画像を選択してください',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      // 画像をアップロード
      const imageUrl = await uploadImage(formData.imageFile);

      // 現在の最大positionを取得
      const maxPosition = sliders.reduce((max, slider) => 
        Math.max(max, slider.position || 0), 0
      );

      await addDoc(collection(db, 'homeSliders'), {
        imageUrl,
        title: formData.title || '',
        link: formData.link || '',
        position: maxPosition + 1,
        isActive: true,
        createdAt: serverTimestamp()
      });

      toast({
        title: '成功',
        description: 'スライダー画像を追加しました'
      });

      setShowAddModal(false);
      setFormData({
        title: '',
        link: '',
        imageFile: null,
        imagePreview: null
      });
    } catch (error) {
      console.error('Error adding slider:', error);
      toast({
        title: 'エラー',
        description: 'スライダーの追加に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // アクティブ状態を切り替え
  const handleToggleActive = async (sliderId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'homeSliders', sliderId), {
        isActive: !currentStatus
      });

      toast({
        title: '成功',
        description: `スライダーを${!currentStatus ? 'アクティブ' : '非アクティブ'}にしました`
      });
    } catch (error) {
      console.error('Error toggling slider:', error);
      toast({
        title: 'エラー',
        description: '状態の変更に失敗しました',
        variant: 'destructive'
      });
    }
  };

  // スライダー削除
  const handleDelete = async (sliderId) => {
    if (!window.confirm('このスライダーを削除しますか？')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'homeSliders', sliderId));
      toast({
        title: '成功',
        description: 'スライダーを削除しました'
      });
    } catch (error) {
      console.error('Error deleting slider:', error);
      toast({
        title: 'エラー',
        description: 'スライダーの削除に失敗しました',
        variant: 'destructive'
      });
    }
  };

  // プレビュー表示
  const handlePreview = (slider) => {
    setPreviewSlider(slider);
    setShowPreviewModal(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  if (loading) {
    return <AdminLoadingState message="スライダーデータを読み込み中..." />;
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="ホームスライダー管理"
        description="ホーム画面に表示されるスライダー画像を管理"
        icon={ImageIcon}
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              data-testid="button-add-slider"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">画像を追加</span>
            </motion.button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminStatsCard
          title="総スライダー数"
          value={<AnimatedNumber value={stats.total} />}
          icon={ImageIcon}
          color="pink"
        />
        <AdminStatsCard
          title="アクティブ"
          value={<AnimatedNumber value={stats.active} />}
          icon={Eye}
          color="green"
        />
        <AdminStatsCard
          title="非アクティブ"
          value={<AnimatedNumber value={stats.inactive} />}
          icon={EyeOff}
          color="orange"
        />
      </div>

      <AdminContentCard title="スライダー一覧">
        {sliders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sliders.map((slider, index) => (
              <motion.div
                key={slider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all group ${
                  slider.isActive ? 'ring-2 ring-green-500' : 'opacity-60'
                }`}
                data-testid={`slider-item-${slider.id}`}
              >
                <div className="aspect-video relative bg-gray-200">
                  <img
                    src={slider.imageUrl}
                    alt={slider.title || 'Slider'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-gradient-to-br from-pink-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                    #{slider.position}
                  </div>
                  {!slider.isActive && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">非アクティブ</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white">
                  {slider.title && (
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {slider.title}
                    </h3>
                  )}
                  {slider.link && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 truncate">
                      <LinkIcon className="w-3 h-3" />
                      <span className="truncate">{slider.link}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePreview(slider)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        data-testid={`button-preview-${slider.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleActive(slider.id, slider.isActive)}
                        className={`p-2 transition-colors ${
                          slider.isActive 
                            ? 'text-green-600 hover:text-gray-600' 
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        data-testid={`button-toggle-${slider.id}`}
                      >
                        {slider.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(slider.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      data-testid={`button-delete-${slider.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={ImageIcon}
            title="スライダーが登録されていません"
            description="画像を追加ボタンから最初のスライダーを追加してください"
          />
        )}
      </AdminContentCard>

      {/* 追加モーダル */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
              data-testid="modal-add-slider"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">スライダー追加</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-close-modal"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    画像
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-image-file"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 transition-colors"
                    data-testid="button-select-image"
                  >
                    {formData.imagePreview ? (
                      <div className="aspect-video relative rounded-lg overflow-hidden">
                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-600">クリックして画像を選択</p>
                      </div>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル（任意）
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="スライダーのタイトル"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    data-testid="input-slider-title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    リンク（任意）
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    data-testid="input-slider-link"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-cancel"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddSlider}
                  disabled={!formData.imageFile || isUploading}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-confirm-add"
                >
                  {isUploading ? 'アップロード中...' : '追加'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* プレビューモーダル */}
      <AnimatePresence>
        {showPreviewModal && previewSlider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full"
              data-testid="modal-preview"
            >
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
                data-testid="button-close-preview"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>
              <img
                src={previewSlider.imageUrl}
                alt={previewSlider.title || 'Preview'}
                className="w-full rounded-2xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageContainer>
  );
}
