import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CalendarDays, 
    User, 
    MapPin, 
    CheckCircle, 
    AlertCircle,
    Info,
    ArrowLeft,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const RegisterCreatorPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        furiganaFamily: '',
        furiganaFirst: '',
        address: '',
        dob: '',
        contentKind: '',
        agreed: false,
    });
    
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Check if user is logged in
    useEffect(() => {
        if (!currentUser) {
            console.log('No current user, redirecting to login');
            navigate('/login');
            return;
        }
        
        // Optional: Check creator status (commented out for now)
        /*
        const checkCreatorStatus = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    console.log('User data:', {
                        isCreator: userData.isCreator,
                        creatorStatus: userData.creatorStatus
                    });
                    
                    // If already a creator, redirect to dashboard
                    if (userData.isCreator === true) {
                        console.log('User is already a creator, redirecting to dashboard');
                        alert('既にクリエイターとして登録済みです。');
                        navigate('/creator-dashboard');
                        return;
                    }
                    
                    // If application is pending, show message
                    if (userData.creatorStatus === 'pending') {
                        console.log('Creator application is pending');
                        alert('クリエイター申請は現在審査中です。結果をお待ちください。');
                        navigate('/account');
                        return;
                    }
                    
                    console.log('User can proceed with registration');
                }
            } catch (error) {
                console.error('Error checking creator status:', error);
            }
        };

        checkCreatorStatus();
        */
    }, [currentUser, navigate]);

    // Load saved form data from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('creatorRegistrationForm');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(parsed);
            } catch (error) {
                console.error('Failed to load saved form data:', error);
            }
        }
    }, []);

    // Save form data to localStorage
    useEffect(() => {
        if (formData.name || formData.furiganaFamily || formData.furiganaFirst) {
            localStorage.setItem('creatorRegistrationForm', JSON.stringify(formData));
        }
    }, [formData]);

    // Validation functions
    const validateName = (name) => {
        if (!name || name.trim().length === 0) {
            return '氏名を入力してください';
        }
        if (name.length < 2) {
            return '氏名は2文字以上で入力してください';
        }
        return null;
    };

    const validateFurigana = (furigana, type) => {
        if (!furigana || furigana.trim().length === 0) {
            return `フリガナ（${type}）を入力してください`;
        }
        // Check if hiragana only (allow spaces)
        const hiraganaRegex = /^[ぁ-ん\s]+$/;
        if (!hiraganaRegex.test(furigana)) {
            return 'フリガナはひらがなで入力してください';
        }
        return null;
    };

    const validateAddress = (address) => {
        if (!address || address.trim().length === 0) {
            return '住所を入力してください';
        }
        if (address.length < 5) {
            return '正確な住所を入力してください';
        }
        return null;
    };

    const validateDob = (dob) => {
        if (!dob) {
            return '生年月日を入力してください';
        }
        
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 18) {
            return '18歳以上である必要があります';
        }
        
        if (age > 100) {
            return '正しい生年月日を入力してください';
        }
        
        return null;
    };

    const validateContentKind = (contentKind) => {
        if (!contentKind) {
            return 'コンテンツの種類を選択してください';
        }
        return null;
    };

    const validateForm = () => {
        const newErrors = {
            name: validateName(formData.name),
            furiganaFamily: validateFurigana(formData.furiganaFamily, '姓'),
            furiganaFirst: validateFurigana(formData.furiganaFirst, '名'),
            address: validateAddress(formData.address),
            dob: validateDob(formData.dob),
            contentKind: validateContentKind(formData.contentKind),
            agreed: !formData.agreed ? '同意が必要です' : null
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        
        // Validate field on blur
        let error = null;
        switch (fieldName) {
            case 'name':
                error = validateName(formData.name);
                break;
            case 'furiganaFamily':
                error = validateFurigana(formData.furiganaFamily, '姓');
                break;
            case 'furiganaFirst':
                error = validateFurigana(formData.furiganaFirst, '名');
                break;
            case 'address':
                error = validateAddress(formData.address);
                break;
            case 'dob':
                error = validateDob(formData.dob);
                break;
            case 'contentKind':
                error = validateContentKind(formData.contentKind);
                break;
            default:
                break;
        }
        
        if (error) {
            setErrors(prev => ({ ...prev, [fieldName]: error }));
        }
    };

    const handleNext = () => {
        // Mark all fields as touched
        setTouched({
            name: true,
            furiganaFamily: true,
            furiganaFirst: true,
            address: true,
            dob: true,
            contentKind: true,
            agreed: true
        });

        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = document.querySelector('.error-field');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setShowConfirmation(true);
    };

    const handleConfirmAndProceed = () => {
        setIsLoading(true);
        
        // データをURLパラメータとして渡して次のページに遷移
        const data = encodeURIComponent(JSON.stringify(formData));
        
        // Clear localStorage after successful submission
        setTimeout(() => {
            localStorage.removeItem('creatorRegistrationForm');
            navigate(`/creator-phone-verification?data=${data}`);
        }, 500);
    };

    const handleBack = () => {
        if (showConfirmation) {
            setShowConfirmation(false);
        } else {
            navigate('/account');
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 pb-20"
        >
            <div className="max-w-3xl mx-auto">
                {/* Progress bar */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { step: 1, label: t("register_creator.progress.step1"), active: true },
                            { step: 2, label: t("register_creator.progress.step2"), active: false },
                            { step: 3, label: t("register_creator.progress.step3"), active: false },
                            { step: 4, label: t("register_creator.progress.step4"), active: false }
                        ].map(({ step, label, active }) => (
                            <div key={step} className="flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        backgroundColor: active ? '#ec4899' : '#e5e7eb'
                                    }}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold mb-2 ${
                                        active ? 'shadow-lg' : ''
                                    }`}
                                >
                                    {step}
                                </motion.div>
                                <span className={`text-xs sm:text-sm text-center ${
                                    active ? 'font-semibold text-pink-600' : 'text-gray-500'
                                }`}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!showConfirmation ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm p-6 sm:p-8"
                        >
                            <h2 className="text-2xl font-bold mb-2 text-gray-900">{t("register_creator.title")}</h2>
                            <div className="flex items-start space-x-2 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800">
                                    {t("register_creator.subtitle")}
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <User className="inline w-4 h-4 mr-1" />
                                        {t("register_creator.form.name")}
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="山田 太郎"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('name')}
                                        className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                                            touched.name && errors.name
                                                ? 'border-red-300 focus:ring-red-500 error-field'
                                                : 'border-gray-200 focus:ring-pink-500 focus:border-transparent'
                                        }`}
                                    />
                                    <AnimatePresence>
                                        {touched.name && errors.name && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.name}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Furigana */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t("register_creator.form.furigana_family")}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="furiganaFamily"
                                            placeholder="やまだ"
                                            value={formData.furiganaFamily}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('furiganaFamily')}
                                            className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                                                touched.furiganaFamily && errors.furiganaFamily
                                                    ? 'border-red-300 focus:ring-red-500 error-field'
                                                    : 'border-gray-200 focus:ring-pink-500 focus:border-transparent'
                                            }`}
                                        />
                                        <AnimatePresence>
                                            {touched.furiganaFamily && errors.furiganaFamily && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{errors.furiganaFamily}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t("register_creator.form.furigana_first")}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="furiganaFirst"
                                            placeholder="たろう"
                                            value={formData.furiganaFirst}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('furiganaFirst')}
                                            className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                                                touched.furiganaFirst && errors.furiganaFirst
                                                    ? 'border-red-300 focus:ring-red-500 error-field'
                                                    : 'border-gray-200 focus:ring-pink-500 focus:border-transparent'
                                            }`}
                                        />
                                        <AnimatePresence>
                                            {touched.furiganaFirst && errors.furiganaFirst && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{errors.furiganaFirst}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <MapPin className="inline w-4 h-4 mr-1" />
                                        {t("register_creator.form.address")}
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="東京都渋谷区○○1-2-3"
                                        value={formData.address}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('address')}
                                        className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                                            touched.address && errors.address
                                                ? 'border-red-300 focus:ring-red-500 error-field'
                                                : 'border-gray-200 focus:ring-pink-500 focus:border-transparent'
                                        }`}
                                    />
                                    <AnimatePresence>
                                        {touched.address && errors.address && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.address}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <CalendarDays className="inline w-4 h-4 mr-1" />
                                        {t("register_creator.form.dob")}
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('dob')}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                            className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                                                touched.dob && errors.dob
                                                    ? 'border-red-300 focus:ring-red-500 error-field'
                                                    : 'border-gray-200 focus:ring-pink-500 focus:border-transparent'
                                            }`}
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {touched.dob && errors.dob && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.dob}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Content Kind Section */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        {t("register_creator.content_kind.title")}
                                        <span className="text-red-500 ml-1">*</span>
                                    </h3>
                                    <div className={`border-2 rounded-xl overflow-hidden transition-all ${
                                        touched.contentKind && errors.contentKind
                                            ? 'border-red-300 error-field'
                                            : 'border-gray-200'
                                    }`}>
                                        <label className="flex items-center p-4 cursor-pointer hover:bg-pink-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="contentKind"
                                                value="generalAdult"
                                                checked={formData.contentKind === "generalAdult"}
                                                onChange={handleChange}
                                                onBlur={() => handleBlur('contentKind')}
                                                className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                                            />
                                            <span className="ml-3 text-gray-900 font-medium">
                                                {t("register_creator.content_kind.general_adult")}
                                            </span>
                                        </label>
                                        <div className="border-t-2 border-gray-200"></div>
                                        <label className="flex items-center p-4 cursor-pointer hover:bg-pink-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="contentKind"
                                                value="gayBL"
                                                checked={formData.contentKind === "gayBL"}
                                                onChange={handleChange}
                                                onBlur={() => handleBlur('contentKind')}
                                                className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                                            />
                                            <span className="ml-3 text-gray-900 font-medium">
                                                {t("register_creator.content_kind.gay_bl")}
                                            </span>
                                        </label>
                                    </div>
                                    <AnimatePresence>
                                        {touched.contentKind && errors.contentKind && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.contentKind}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Notice box */}
                                <div className={`p-5 rounded-xl border-2 transition-all ${
                                    touched.agreed && errors.agreed
                                        ? 'bg-red-50 border-red-300 error-field'
                                        : 'bg-pink-50 border-pink-200'
                                }`}>
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="agreed"
                                            checked={formData.agreed}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 mt-0.5 flex-shrink-0"
                                        />
                                        <span className={`text-sm font-medium ${
                                            touched.agreed && errors.agreed ? 'text-red-700' : 'text-pink-800'
                                        }`}>
                                            {t("register_creator.notice")}
                                        </span>
                                    </label>
                                    <AnimatePresence>
                                        {touched.agreed && errors.agreed && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.agreed}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>{t("register_creator.back")}</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 py-4 px-6 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <span>{t("register_creator.next")}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="confirmation"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm p-6 sm:p-8"
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                                    <CheckCircle className="w-8 h-8 text-pink-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">入力内容の確認</h2>
                                <p className="text-gray-600">以下の内容で申請を進めてよろしいですか？</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="text-sm text-gray-600 mb-1">氏名</div>
                                    <div className="font-semibold text-gray-900">{formData.name}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <div className="text-sm text-gray-600 mb-1">フリガナ（姓）</div>
                                        <div className="font-semibold text-gray-900">{formData.furiganaFamily}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <div className="text-sm text-gray-600 mb-1">フリガナ（名）</div>
                                        <div className="font-semibold text-gray-900">{formData.furiganaFirst}</div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="text-sm text-gray-600 mb-1">住所</div>
                                    <div className="font-semibold text-gray-900">{formData.address}</div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="text-sm text-gray-600 mb-1">生年月日</div>
                                    <div className="font-semibold text-gray-900">{formData.dob}</div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="text-sm text-gray-600 mb-1">コンテンツ種類</div>
                                    <div className="font-semibold text-gray-900">
                                        {formData.contentKind === 'generalAdult' 
                                            ? t("register_creator.content_kind.general_adult")
                                            : t("register_creator.content_kind.gay_bl")
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={handleBack}
                                    disabled={isLoading}
                                    className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>修正する</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={handleConfirmAndProceed}
                                    disabled={isLoading}
                                    className="flex-1 py-4 px-6 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>処理中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>次へ進む</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default RegisterCreatorPage;
