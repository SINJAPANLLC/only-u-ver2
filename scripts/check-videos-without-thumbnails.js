import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function checkVideosWithoutThumbnails() {
  console.log('🔍 Checking for videos without proper thumbnails...\n');
  
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);
  
  let videosWithoutThumbnails = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    if (!data.files || data.files.length === 0) continue;
    
    for (const file of data.files) {
      // Check if it's a video with .mp4/.MP4 thumbnail (wrong!)
      if (file.type?.startsWith('video/') && 
          file.thumbnailUrl?.toLowerCase().endsWith('.mp4')) {
        videosWithoutThumbnails.push({
          postId: doc.id,
          title: data.title || data.explanation || 'Untitled',
          videoUrl: file.url,
          currentThumbnail: file.thumbnailUrl,
          fileSize: file.size
        });
      }
    }
  }
  
  console.log(`📊 Found ${videosWithoutThumbnails.length} videos without proper thumbnails:\n`);
  
  videosWithoutThumbnails.forEach((video, index) => {
    console.log(`${index + 1}. ${video.title}`);
    console.log(`   Post ID: ${video.postId}`);
    console.log(`   Video URL: ${video.videoUrl}`);
    console.log(`   Current Thumbnail: ${video.currentThumbnail}`);
    console.log(`   File Size: ${(video.fileSize / 1024 / 1024).toFixed(2)} MB\n`);
  });
  
  process.exit(0);
}

checkVideosWithoutThumbnails().catch(console.error);
