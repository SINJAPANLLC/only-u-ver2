// Firebase Admin SDK initialization singleton
// This ensures firebase-admin is initialized only once and can be safely imported
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Check for environment variable with Firebase credentials (Replit Secrets)
    const firebaseCredentials = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (firebaseCredentials) {
      // Use credentials from environment variable (Replit or VPS)
      console.log('🔑 Initializing Firebase with credentials from environment variable...');
      const serviceAccount = JSON.parse(firebaseCredentials);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'onlyu1020-c6696.firebasestorage.app',
      });
      console.log('✅ Firebase initialized with service account from environment');
    } else {
      // Fallback: Try to use service account key file (VPS production)
      const serviceAccountPath = join(process.cwd(), 'firebase-admin-key.json');
      
      if (existsSync(serviceAccountPath)) {
        console.log('🔑 Initializing Firebase with service account key file...');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: 'onlyu1020-c6696.firebasestorage.app',
        });
        console.log('✅ Firebase initialized with service account file');
      } else {
        throw new Error(
          'Firebase credentials not found! Please set FIREBASE_SERVICE_ACCOUNT environment variable ' +
          'or create firebase-admin-key.json file.'
        );
      }
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

export { admin };
export const firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
