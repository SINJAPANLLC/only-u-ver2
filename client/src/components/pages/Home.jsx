import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { signOut } from 'firebase/auth';
// import { auth } from '../../firebase';
// import { useAuth } from '../../context/AuthContext';
import Header from '../../Header/Header';
// import Notifications from '../../Header/Notifications';
import UserNotifications from '../UserNotifications';
import FeaturedCreators from '../FeaturedCreators';
import PostLibrary from '../PostLibrary';
import RecommendedGenres from '../RecommendedGenres';
import Ranking from '../RomanticRanking';
import CreatorPage from '../CreatorPage';
import FeaturedAdminPage from '../FeaturedAdmin';
import CleanCreatorPage from '../FollowCreatorPage';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';

const Home = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [likedItems, setLikedItems] = useState(new Set());
    const [, setIsMobile] = useState(false);
    // const { currentUser } = useAuth();

    // Logout function
    // const handleLogout = async () => {
    //     try {
    //         await signOut(auth);
    //         // Clear age verification from localStorage on logout
    //         localStorage.removeItem('ageVerified');
    //         console.log("User logged out successfully");
    //     } catch (error) {
    //         console.error("Logout error:", error.message);
    //     }
    // };

    const handleNavigation = (path) => {
        console.log('Navigation clicked:', path);
        if (path === 'home') {
            setActiveTab('home');
        } else if (path === 'favorites') {
            // navigate('/feed');
        } else if (path === 'ranking') {
            setActiveTab('ranking');
            console.log('Ranking navigation not implemented yet');
        } else if (path === 'messages') {
            console.log('Navigating to messages...');
            // navigate('/msg');
        } else if (path === 'account') {
            setActiveTab('account');
            console.log('Account navigation not implemented yet');
        } else {
            setActiveTab(path);
            console.log(`Navigate to: ${path}`);
        }
    };

    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };

    useEffect(() => {
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleLike = (id) => {
        const newLiked = new Set(likedItems);
        if (newLiked.has(id)) {
            newLiked.delete(id);
        } else {
            newLiked.add(id);
        }
        setLikedItems(newLiked);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
            {/* Make header fixed */}
            <div className="fixed top-0 left-0 w-full z-50 bg-white shadow">
                <Header />
            </div>

            {/* Add padding-top to prevent content hiding behind header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-4 pt-18 lg:mt-10">

                {/* User Welcome Section */}
                {/* {currentUser && (
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Welcome back, {currentUser.displayName || currentUser.email}!
                                </h2>
                                <p className="text-sm text-gray-600">
                                    You're successfully logged in
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )} */}

                {/* プッシュ通知表示 */}
                <UserNotifications />

                <FeaturedCreators />
                <PostLibrary likedItems={likedItems} />
                <RecommendedGenres likedItems={likedItems} toggleLike={toggleLike} />
                <Ranking />
                <CreatorPage />
                <FeaturedAdminPage />
                <CleanCreatorPage />
            </div>

            <BottomNavigationWithCreator active="home" />

            {/* Padding for fixed nav */}
            <div className="h-20"></div>
        </div>
    );
};

export default Home;
