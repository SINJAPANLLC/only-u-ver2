import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to ensure user document exists
const ensureUserDocument = async (user) => {
  if (!user) return;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // ユーザードキュメントが存在しない場合は作成
      await setDoc(userDocRef, {
        displayName: user.displayName || 'ユーザー',
        email: user.email,
        photoURL: user.photoURL || null,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true,
        bio: '',
        username: `@user${user.uid.slice(0, 6)}`,
        postsCount: 0,
        likesCount: 0,
        followersCount: 0,
        followingCount: 0
      });
      console.log('Created Firestore document for user:', user.uid);
    } else {
      // 既存ユーザーの場合、最終ログイン時間を更新
      await setDoc(userDocRef, {
        lastSeen: new Date().toISOString(),
        isOnline: true
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error creating/updating user document:', error);
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      
      if (user) {
        // ユーザーがログインしている場合、ドキュメントを作成/更新してから状態を更新
        await ensureUserDocument(user);
      }
      
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
