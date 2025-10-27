import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin初期化
const serviceAccountPath = path.join(process.cwd(), 'firebase-admin-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firebase-admin-key.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function cleanupOldPosts() {
  try {
    console.log('🔍 Checking posts collection...');
    
    const postsSnapshot = await db.collection('posts').get();
    console.log(`📊 Found ${postsSnapshot.size} posts`);
    
    let deletedCount = 0;
    const batch = db.batch();
    
    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      const shouldDelete = 
        // タイトルが「サンプル」「sa」「サンプルa」などの古いテストデータ
        (data.title && (
          data.title === 'サンプル' || 
          data.title === 'sa' || 
          data.title === 'サンプルa' ||
          data.title.includes('サンプル')
        )) ||
        // ファイルが空の投稿
        (!data.files || data.files.length === 0);
      
      if (shouldDelete) {
        console.log(`🗑️  Deleting post: ${doc.id} (title: "${data.title || 'no title'}", files: ${data.files?.length || 0})`);
        batch.delete(doc.ref);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ Deleted ${deletedCount} old/empty posts`);
    } else {
      console.log('✅ No posts to delete');
    }
    
    // 削除後の確認
    const remainingSnapshot = await db.collection('posts').get();
    console.log(`📊 Remaining posts: ${remainingSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error cleaning up posts:', error);
    process.exit(1);
  }
}

cleanupOldPosts()
  .then(() => {
    console.log('✅ Cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
