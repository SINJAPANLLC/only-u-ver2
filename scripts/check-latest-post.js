import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "onlyu1020-c6696.firebaseapp.com",
  projectId: "onlyu1020-c6696",
  storageBucket: "onlyu1020-c6696.firebasestorage.app",
  messagingSenderId: "394928420564",
  appId: "1:394928420564:web:f033a0a05cd2e06eb7ffc5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkLatestPost() {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'), limit(2));
  const snapshot = await getDocs(q);
  
  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`\n📄 Post #${index + 1} (${doc.id}):`);
    console.log('Title:', data.title);
    console.log('Created:', data.createdAt?.toDate());
    console.log('Files:', data.files?.length || 0);
    
    if (data.files && data.files.length > 0) {
      data.files.forEach((file, i) => {
        console.log(`\n  File ${i + 1}:`);
        console.log('    Type:', file.type);
        console.log('    URL:', file.url);
        console.log('    ThumbnailURL:', file.thumbnailUrl);
        console.log('    ResourceType:', file.resourceType);
      });
    }
  });
  
  process.exit(0);
}

checkLatestPost().catch(console.error);
