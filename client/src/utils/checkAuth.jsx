// Authentication Status Checker
// Use this to debug authentication issues

import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const checkAuthStatus = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      
      if (user) {
        console.log('✅ User is authenticated:');
        console.log('  - UID:', user.uid);
        console.log('  - Email:', user.email);
        console.log('  - Display Name:', user.displayName);
        console.log('  - Is Anonymous:', user.isAnonymous);
        console.log('  - Email Verified:', user.emailVerified);
        
        // Get the ID token to verify it's valid
        user.getIdToken().then(token => {
          console.log('  - Has valid token:', token ? 'Yes' : 'No');
          resolve({ authenticated: true, user, token });
        }).catch(error => {
          console.error('❌ Token error:', error);
          resolve({ authenticated: false, error });
        });
      } else {
        console.log('❌ No user authenticated');
        resolve({ authenticated: false });
      }
    });
  });
};

// For browser console use
if (typeof window !== 'undefined') {
  window.checkAuthStatus = checkAuthStatus;
}

export default checkAuthStatus;
