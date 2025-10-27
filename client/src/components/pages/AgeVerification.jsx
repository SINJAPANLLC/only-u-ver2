import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AgeVerification = ({ onVerify }) => {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleYes = () => {
        if (onVerify) {
            onVerify(true); // User is 18 or older
        }
        // Navigate to login page for new users
        navigate('/login');
    };

    const handleCancel = () => {
        setShowModal(true); // Show the underage modal
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="max-w-xs w-full text-center"
            >
                <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.webp" alt="Logo" className="w-100 h-16" />
                    </div>

                    <p className="text-sm text-pink-600" dangerouslySetInnerHTML={{ __html: t('ageVerification.warning') }}>
                    </p>
                    <p className="font-semibold mt-2">{t('ageVerification.question')}</p>

                    <button
                        onClick={handleYes}
                        className="mt-4 bg-pink-600 text-white font-bold py-2 rounded-full w-full"
                    >
                        {t('ageVerification.yes')}
                    </button>

                    <button
                        onClick={handleCancel}
                        className="mt-2 text-pink-600 underline text-sm"
                    >
                        {t('ageVerification.cancel')}
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="absolute top-1/2 transform -translate-x-1/2 bg-white rounded-3xl max-w-xs w-full p-6 shadow-lg"
                    >
                        <p className="text-gray-900 font-semibold mb-6">
                            {t('ageVerification.underageMessage')}
                        </p>
                        <button
                            onClick={handleCloseModal}
                            className="bg-pink-600 text-white py-2 rounded-full w-full font-semibold"
                        >
                            {t('ageVerification.close')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AgeVerification;
