import React, { useState } from 'react';
import { Bell, Search, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import GenderSelectionModal from './GenderModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { t, i18n } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGender, setSelectedGender] = useState('General Adult');
    const [notificationCount, setNotificationCount] = useState(0);
    const navigate = useNavigate();

    const handleGenderSelect = (gender) => setSelectedGender(gender.label);
    const handleConfirm = (gender) => console.log('Selected gender preference:', gender);

    // Languages you want to allow quick switching
    const languageOptions = [
        { code: 'en', label: 'EN' },
        { code: 'ja', label: '日本語' },
    ];

    return (
        <>
            <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <motion.div 
                        className="flex items-center cursor-pointer"
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.div
                            className="relative"
                            animate={{ 
                                y: [0, -3, 0],
                                rotate: [0, 2, 0, -2, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            {/* グロウエフェクト */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full blur-xl opacity-0"
                                animate={{
                                    opacity: [0, 0.3, 0],
                                    scale: [0.8, 1.2, 0.8]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <motion.img
                                src="/logo.webp"
                                alt="Fans Hub Logo"
                                className="h-8 w-auto object-contain sm:h-16 relative z-10"
                                whileHover={{ 
                                    rotate: [0, -5, 5, -5, 0],
                                    scale: 1.1
                                }}
                                transition={{
                                    rotate: { duration: 0.5 },
                                    scale: { duration: 0.2 }
                                }}
                            />
                        </motion.div>
                    </motion.div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 15 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 rounded-full transition-all relative group"
                            onClick={() => navigate('/settings/notifications')}
                            data-testid="button-notifications"
                        >
                            <Bell className="w-5 h-5 text-gray-600 group-hover:text-pink-500 transition-colors" strokeWidth={2.5} />
                            {notificationCount > 0 && (
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-md"
                                ></motion.div>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 rounded-full transition-all group"
                            onClick={() => navigate('/search')}
                            data-testid="button-search"
                        >
                            <Search className="w-5 h-5 text-gray-600 group-hover:text-pink-500 transition-colors" strokeWidth={2.5} />
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Gender Selection Modal */}
            <GenderSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedGender={selectedGender}
                onGenderSelect={handleGenderSelect}
                onConfirm={handleConfirm}
            />
        </>
    );
};

export default Header;
