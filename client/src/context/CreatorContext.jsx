import React, { createContext, useContext, useState, useEffect } from 'react';

const CreatorContext = createContext();

export const useCreator = () => {
  const context = useContext(CreatorContext);
  if (!context) {
    throw new Error('useCreator must be used within a CreatorProvider');
  }
  return context;
};

export const CreatorProvider = ({ children }) => {
  const [isCreator, setIsCreator] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [creatorStatus, setCreatorStatus] = useState('none'); // none, pending, approved, rejected
  const [creatorData, setCreatorData] = useState(null);

  // クリエイター状態を初期化
  useEffect(() => {
    // 実際のアプリでは、APIからユーザーのクリエイター状態を取得
    const initializeCreatorStatus = async () => {
      try {
        // ローカルストレージから状態を取得（デモ用）
        const savedStatus = localStorage.getItem('creatorStatus');
        const savedData = localStorage.getItem('creatorData');
        
        if (savedStatus) {
          setCreatorStatus(savedStatus);
          setIsCreator(savedStatus === 'approved');
          setIsApproved(savedStatus === 'approved');
        }
        
        if (savedData) {
          setCreatorData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Failed to initialize creator status:', error);
      }
    };

    initializeCreatorStatus();
  }, []);

  // クリエイター登録申請
  const applyForCreator = async (data) => {
    try {
      setCreatorStatus('pending');
      setCreatorData(data);
      localStorage.setItem('creatorStatus', 'pending');
      localStorage.setItem('creatorData', JSON.stringify(data));
      
      // 実際のアプリでは、APIに申請を送信
      console.log('Creator application submitted:', data);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to apply for creator:', error);
      return { success: false, error: error.message };
    }
  };

  // クリエイター承認（管理者用）
  const approveCreator = async (userId) => {
    try {
      setCreatorStatus('approved');
      setIsCreator(true);
      setIsApproved(true);
      localStorage.setItem('creatorStatus', 'approved');
      
      // 実際のアプリでは、APIで承認を実行
      console.log('Creator approved:', userId);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to approve creator:', error);
      return { success: false, error: error.message };
    }
  };

  // クリエイター拒否（管理者用）
  const rejectCreator = async (userId) => {
    try {
      setCreatorStatus('rejected');
      setIsCreator(false);
      setIsApproved(false);
      localStorage.setItem('creatorStatus', 'rejected');
      
      // 実際のアプリでは、APIで拒否を実行
      console.log('Creator rejected:', userId);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to reject creator:', error);
      return { success: false, error: error.message };
    }
  };

  // クリエイター状態をリセット
  const resetCreatorStatus = () => {
    setCreatorStatus('none');
    setIsCreator(false);
    setIsApproved(false);
    setCreatorData(null);
    localStorage.removeItem('creatorStatus');
    localStorage.removeItem('creatorData');
  };

  const value = {
    isCreator,
    isApproved,
    creatorStatus,
    creatorData,
    applyForCreator,
    approveCreator,
    rejectCreator,
    resetCreatorStatus,
    // 便利な状態チェック関数
    canCreatePosts: isCreator && isApproved,
    canAccessDashboard: isCreator && isApproved,
    isPendingApproval: creatorStatus === 'pending',
    isRejected: creatorStatus === 'rejected'
  };

  return (
    <CreatorContext.Provider value={value}>
      {children}
    </CreatorContext.Provider>
  );
};

export default CreatorContext;
