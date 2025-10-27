import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { t } from 'i18next';

const CleanCreatorPage = () => {
    return (
        <div className="mb-12">
            <div className="max-w-6xl mx-auto">
                {/* Recruit Banner */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                >
                    <img
                        src="/RECRUIT.png"
                        alt="Recruit Banner"
                        className="w-full h-auto object-cover"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default CleanCreatorPage;
