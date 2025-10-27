import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { notifications } from '../data/constants';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 mt-10 sm:mb-8 space-y-3"
        >
            {notifications.map((notification, index) => (
                <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 flex items-center justify-between hover:bg-blue-50/50 transition-all cursor-pointer group"
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-blue-700 text-xs sm:text-sm font-medium group-hover:text-blue-800 line-clamp-2">
                            {t(`notifications.${notification.title}`)}
                        </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </motion.div>
            ))}
        </motion.div>
    );
};

export default Notifications;