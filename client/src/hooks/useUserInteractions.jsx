import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getUserInteractions, 
  toggleUserLike, 
  toggleUserSave,
  initializeUserInteractions 
} from '../utils/userInteractions';

/**
 * ユーザーのいいね・保存機能を管理するカスタムフック
 */
export const useUserInteractions = () => {
  const { currentUser } = useAuth();
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [purchasedPosts, setPurchasedPosts] = useState(new Set());
  const [viewingHistory, setViewingHistory] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ユーザーのインタラクションデータを読み込み
  const loadUserInteractions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    if (!currentUser) {
      // 認証されていない場合は空の状態を設定
      setLikedPosts(new Set());
      setSavedPosts(new Set());
      setPurchasedPosts(new Set());
      setViewingHistory(new Set());
      setLoading(false);
      return;
    }
    
    try {
      // ユーザーデータを初期化（存在しない場合）
      await initializeUserInteractions(currentUser.uid);
      
      // ユーザーのインタラクションデータを取得
      const interactions = await getUserInteractions(currentUser.uid);
      setLikedPosts(interactions.likedPosts);
      setSavedPosts(interactions.savedPosts);
      setPurchasedPosts(interactions.purchasedPosts);
      setViewingHistory(interactions.viewingHistory);
    } catch (err) {
      console.error('Error loading user interactions:', err);
      setError(err.message);
      // エラーが発生した場合でも空の状態を設定
      setLikedPosts(new Set());
      setSavedPosts(new Set());
      setPurchasedPosts(new Set());
      setViewingHistory(new Set());
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // コンポーネントマウント時とユーザー変更時にデータを読み込み
  useEffect(() => {
    loadUserInteractions();
  }, [loadUserInteractions]);

  // いいねをトグル
  const toggleLike = useCallback(async (postId) => {
    console.log('toggleLike called with postId:', postId, 'currentUser:', currentUser);
    if (!currentUser) {
      console.warn('User not authenticated, updating local state only');
      // 認証されていない場合でもローカル状態を更新
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
          console.log('Removed like from local state');
        } else {
          newSet.add(postId);
          console.log('Added like to local state');
        }
        return newSet;
      });
      return false;
    }

    try {
      const isLiked = await toggleUserLike(currentUser.uid, postId);
      
      // ローカル状態を更新
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      return isLiked;
    } catch (err) {
      console.error('Error toggling like:', err);
      setError(err.message);
      return false;
    }
  }, [currentUser]);

  // 保存をトグル
  const toggleSave = useCallback(async (postId) => {
    console.log('toggleSave called with postId:', postId, 'currentUser:', currentUser);
    if (!currentUser) {
      console.warn('User not authenticated, updating local state only');
      // 認証されていない場合でもローカル状態を更新
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
          console.log('Removed save from local state');
        } else {
          newSet.add(postId);
          console.log('Added save to local state');
        }
        return newSet;
      });
      return false;
    }

    try {
      const isSaved = await toggleUserSave(currentUser.uid, postId);
      
      // ローカル状態を更新
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      return isSaved;
    } catch (err) {
      console.error('Error toggling save:', err);
      setError(err.message);
      return false;
    }
  }, [currentUser]);

  // いいね状態をチェック
  const isLiked = useCallback((postId) => {
    return likedPosts.has(postId);
  }, [likedPosts]);

  // 保存状態をチェック
  const isSaved = useCallback((postId) => {
    return savedPosts.has(postId);
  }, [savedPosts]);

  // 購入済み状態をチェック
  const isPurchased = useCallback((postId) => {
    return purchasedPosts.has(postId);
  }, [purchasedPosts]);

  // 視聴履歴をチェック
  const isViewed = useCallback((postId) => {
    return viewingHistory.has(postId);
  }, [viewingHistory]);

  // データを再読み込み
  const refresh = useCallback(() => {
    loadUserInteractions();
  }, [loadUserInteractions]);

  return {
    likedPosts,
    savedPosts,
    purchasedPosts,
    viewingHistory,
    loading,
    error,
    toggleLike,
    toggleSave,
    isLiked,
    isSaved,
    isPurchased,
    isViewed,
    refresh
  };
};
