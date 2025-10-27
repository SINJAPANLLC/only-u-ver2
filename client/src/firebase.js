// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCvUJiZlQMztRs61qTZD7UnY5AYQQ3N1TM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "onlyu1020-c6696.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://onlyu1020-c6696-default-rtdb.firebaseio.com/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "onlyu1020-c6696",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "onlyu1020-c6696.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "627626524087",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:627626524087:web:3fb2db22334c6c4e79bc32",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-M3V52VC833"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// デバッグ：Firebase設定を確認
console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyLength: firebaseConfig.apiKey?.length
});

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
console.log('✅ Firebase Auth initialized');

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Realtime Database and get a reference to the service
export const rtdb = getDatabase(app);

export default app;
