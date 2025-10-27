// Firebase Admin SDK initialization singleton
// This ensures firebase-admin is initialized only once and can be safely imported
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'onlyu1020-c6696',
  });
}

export { admin };
export const firestore = admin.firestore();
export const auth = admin.auth();
