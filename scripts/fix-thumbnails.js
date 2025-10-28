// Fix thumbnails for existing posts
// This script updates posts where thumbnailUrl is null but should be set

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function fixThumbnails() {
  console.log('🔧 Starting thumbnail fix...');
  
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);
  
  let fixed = 0;
  let skipped = 0;
  
  for (const postDoc of snapshot.docs) {
    const data = postDoc.data();
    
    if (!data.files || data.files.length === 0) {
      skipped++;
      continue;
    }
    
    let needsUpdate = false;
    const updatedFiles = data.files.map(file => {
      // If thumbnailUrl is null and file is an image, set it to the image URL
      if (file.thumbnailUrl === null && file.type && file.type.startsWith('image/')) {
        console.log(`📝 Fixing image thumbnail for post ${postDoc.id}: ${file.url}`);
        needsUpdate = true;
        return {
          ...file,
          thumbnailUrl: file.url || file.objectPath
        };
      }
      return file;
    });
    
    if (needsUpdate) {
      await updateDoc(doc(db, 'posts', postDoc.id), {
        files: updatedFiles
      });
      fixed++;
      console.log(`✅ Fixed post ${postDoc.id}`);
    } else {
      skipped++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Fixed: ${fixed} posts`);
  console.log(`⏭️  Skipped: ${skipped} posts`);
  console.log(`🎉 Done!`);
  
  process.exit(0);
}

fixThumbnails().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
