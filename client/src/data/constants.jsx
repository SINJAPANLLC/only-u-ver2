import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const featuredCreators = [
    {
        id: 1,
        name: 'Mika',
        image: '/api/placeholder/300/400',
        label: 'Currently attracting the most attention',
        badge: 'TOP 5',
        ranking: 'Updated on 8/16'
    },
    {
        id: 2,
        name: 'Yuki',
        image: '/api/placeholder/300/400',
        label: 'Super popular!',
        badge: 'TOP 5',
        ranking: 'Updated on 8/16'
    },
    {
        id: 3,
        name: 'Saki',
        image: '/api/placeholder/300/400',
        label: 'NEW',
        badge: 'Play',
        ranking: 'Updated on 8/16'
    }
];

export const notifications = [
    {
        id: 1,
        title: 'paymentRedirect',
        type: 'info'
    },
    {
        id: 2,
        title: 'termsUpdate',
        type: 'update'
    }
];

export const genreData = [
    { id: 1, nameKey: "amateur", count: 0, color: "from-pink-500 to-purple-600" },
    { id: 2, nameKey: "personalFilming", count: 0, color: "from-purple-500 to-indigo-600" },
    { id: 3, nameKey: "marriedWoman", count: 0, color: "from-red-500 to-pink-600" },
    { id: 4, nameKey: "largeBreasts", count: 0, color: "from-orange-500 to-red-600" },
    { id: 5, nameKey: "pervert", count: 0, color: "from-green-500 to-teal-600" },
    { id: 6, nameKey: "homeVideo", count: 0, color: "from-blue-500 to-purple-600" },
    { id: 7, nameKey: "beautifulWoman", count: 0, color: "from-pink-500 to-red-600" },
    { id: 8, nameKey: "beautifulBreasts", count: 0, color: "from-purple-500 to-pink-600" }
];

// ジャンル名のマッピング（nameKey → Firestoreのgenres配列に保存されている値）
const genreNameMapping = {
    "amateur": "Amateur",
    "personalFilming": "Gonzo",
    "marriedWoman": "Married Woman",
    "largeBreasts": "Big Tits",
    "pervert": "Pervert",
    "homeVideo": "Home Video",
    "beautifulWoman": "Beautiful Woman",
    "beautifulBreasts": "Beautiful Breasts"
};

// ジャンル別動画数を取得する関数（Firestoreから実際の投稿数を取得）
export const getGenreVideoCount = async (genreNameKey) => {
    try {
        // 最初の呼び出し時に全投稿のジャンルをログ出力（デバッグ用）
        if (!getGenreVideoCount._debugged) {
            getGenreVideoCount._debugged = true;
            const postsRef = collection(db, 'posts');
            const allPostsSnapshot = await getDocs(postsRef);
            const allGenres = new Set();
            allPostsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.genres && Array.isArray(data.genres)) {
                    data.genres.forEach(g => allGenres.add(g));
                }
            });
            console.log('🔍 All genres found in Firestore:', Array.from(allGenres));
        }

        // nameKeyをFirestoreのジャンル値に変換
        const genreName = genreNameMapping[genreNameKey];
        if (!genreName) {
            console.warn(`Unknown genre nameKey: ${genreNameKey}`);
            return 0;
        }

        // Firestoreからそのジャンルを含む投稿数をカウント
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('genres', 'array-contains', genreName));
        const querySnapshot = await getDocs(q);
        
        const count = querySnapshot.size;
        console.log(`📊 Genre "${genreName}" (${genreNameKey}): ${count} posts`);
        
        return count;
    } catch (error) {
        console.error(`Error getting genre video count for ${genreNameKey}:`, error);
        
        // エラーの場合はデフォルト値を返す
        const genre = genreData.find(g => g.nameKey === genreNameKey);
        return genre ? genre.count : 0;
    }
};

// ジャンル別動画数を更新する関数
export const updateGenreVideoCount = (genreNameKey, count) => {
    try {
        const storedCounts = localStorage.getItem('genreVideoCounts') || '{}';
        const counts = JSON.parse(storedCounts);
        counts[genreNameKey] = count;
        localStorage.setItem('genreVideoCounts', JSON.stringify(counts));
    } catch (error) {
        console.error('Error updating genre video count:', error);
    }
};


export const navItems = [
    { icon: 'Home', label: 'Home', id: 'home' },
    { icon: 'Star', label: 'Favorites', id: 'favorites' },
    { icon: 'Crown', label: 'Ranking', id: 'ranking' },
    { icon: 'MessageCircle', label: 'Messages', id: 'messages' },
    { icon: 'User', label: 'Account', id: 'account' }
];