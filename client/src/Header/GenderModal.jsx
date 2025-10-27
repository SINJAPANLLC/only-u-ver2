import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GenderSelectionModal = ({ isOpen, onClose, selectedGender, onGenderSelect, onConfirm }) => {
    const { t } = useTranslation();
    const genderOptions = [
        {
            id: 'general',
            label: t('gender.general.label'),
            icon: '👥',
            description: t('gender.general.description'),
            bgColor: 'bg-pink-100',
            textColor: 'text-pink-600',
            borderColor: 'border-pink-300'
        },
        {
            id: 'gay',
            label: t('gender.gay.label'),
            icon: '🏳️‍🌈',
            description: t('gender.gay.description'),
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-600',
            borderColor: 'border-gray-300'
        }
    ];

    const handleShowClick = () => {
        onConfirm(selectedGender);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 transform transition-all animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <h2 className="text-base font-bold text-gray-900 text-center mb-2">
                        {t('gender.title')}
                    </h2>
                </div>

                {/* Modal Content */}
                <div className="px-6 pb-6">
                    <div className="space-y-3">
                        {genderOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onGenderSelect(option)}
                                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md ${selectedGender === option.label
                                    ? `${option.bgColor} ${option.borderColor} shadow-lg scale-105`
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${selectedGender === option.label ? option.bgColor : 'bg-white'
                                        }`}>
                                        {option.icon}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className={`font-bold text-lg ${selectedGender === option.label ? option.textColor : 'text-gray-700'
                                            }`}>
                                            {option.label}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {option.description}
                                        </div>
                                    </div>
                                    {selectedGender === option.label && (
                                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleShowClick}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
                        >
                            {t('gender.show')}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full text-pink-500 py-3 font-medium hover:bg-pink-50 rounded-xl transition-colors"
                        >
                            {t('gender.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenderSelectionModal;