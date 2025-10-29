// Firebase Admin SDK initialization singleton
// This ensures firebase-admin is initialized only once and can be safely imported
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Check if we're in production (VPS) - use NODE_ENV=production flag
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Production (VPS): Use service account key file
      const serviceAccountPath = join(process.cwd(), 'firebase-admin-key.json');
      
      if (!existsSync(serviceAccountPath)) {
        throw new Error('firebase-admin-key.json not found in production environment');
      }
      
      console.log('🔑 Initializing Firebase with service account key (Production)...');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'onlyu1020-c6696.firebasestorage.app',
      });
      console.log('✅ Firebase initialized with service account (Production)');
    } else {
      // Development (Replit): Use Application Default Credentials
      console.log('🔑 Initializing Firebase with default credentials (Development/Replit)...');
      admin.initializeApp({
        projectId: 'onlyu1020-c6696',
        storageBucket: 'onlyu1020-c6696.firebasestorage.app',
      });
      console.log('✅ Firebase initialized with default credentials (Development)');
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
