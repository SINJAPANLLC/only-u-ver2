// Firebase Admin SDK initialization singleton
// This ensures firebase-admin is initialized only once and can be safely imported
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  // Check if we're in production (VPS) and have a service account key file
  const serviceAccountPath = join(process.cwd(), 'firebase-admin-key.json');
  
  if (existsSync(serviceAccountPath)) {
    // Production: Use service account key file
    console.log('🔑 Initializing Firebase with service account key...');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'onlyu1020-c6696.firebasestorage.app',
    });
    console.log('✅ Firebase initialized with service account');
  } else {
    // Development: Use Application Default Credentials (Replit environment)
    console.log('🔑 Initializing Firebase with default credentials...');
    admin.initializeApp({
      projectId: 'onlyu1020-c6696',
      storageBucket: 'onlyu1020-c6696.firebasestorage.app',
    });
    console.log('✅ Firebase initialized');
  }
}

export { admin };
export const firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
