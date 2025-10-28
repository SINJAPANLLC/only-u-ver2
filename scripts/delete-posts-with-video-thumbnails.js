import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function deletePostsWithVideoThumbnails() {
  console.log('🗑️ Deleting posts with video thumbnails...\n');
  
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);
  
  let deletedCount = 0;
  
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    
    if (!data.files || data.files.length === 0) continue;
    
    for (const file of data.files) {
      // Check if it's a video with .mp4/.MP4 thumbnail (wrong!)
      if (file.type?.startsWith('video/') && 
          file.thumbnailUrl?.toLowerCase().endsWith('.mp4')) {
        console.log(`🗑️ Deleting post: ${docSnapshot.id} - ${data.title || data.explanation || 'Untitled'}`);
        await deleteDoc(doc(db, 'posts', docSnapshot.id));
        deletedCount++;
        break;
      }
    }
  }
  
  console.log(`\n✅ Deleted ${deletedCount} posts with video thumbnails.`);
  console.log('📝 Please re-upload these videos to generate proper thumbnails.');
  
  process.exit(0);
}

deletePostsWithVideoThumbnails().catch(console.error);
