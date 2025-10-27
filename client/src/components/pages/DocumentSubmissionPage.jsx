import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, 
    FileText, 
    CheckCircle, 
    AlertCircle, 
    X, 
    ArrowLeft, 
    ArrowRight,
    Loader2,
    Eye,
    Download,
    Trash2,
    Image as ImageIcon,
    Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const DocumentSubmissionPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const [formData, setFormData] = useState(null);
    const [documents, setDocuments] = useState({
        identityDocument: null,
        addressProof: null,
        selfieWithID: null
    });
    const [previews, setPreviews] = useState({
        identityDocument: null,
        addressProof: null,
        selfieWithID: null
    });
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const documentTypes = {
        identityDocument: {
            label: '身分証明書',
            description: '運転免許証、パスポート、マイナンバーカードのいずれか',
            required: true,
            acceptedFormats: '.jpg,.jpeg,.png,.pdf',
            maxSize: 10 * 1024 * 1024 // 10MB
        },
        selfieWithID: {
            label: '身分証を持ったセルフィー',
            description: '身分証明書を手に持った状態で自撮りした写真',
            required: true,
            acceptedFormats: '.jpg,.jpeg,.png',
            maxSize: 10 * 1024 * 1024 // 10MB
        },
        addressProof: {
            label: '住所確認書類',
            description: '公共料金の請求書、住民票など（3ヶ月以内のもの）',
            required: false,
            acceptedFormats: '.jpg,.jpeg,.png,.pdf',
            maxSize: 10 * 1024 * 1024 // 10MB
        }
    };

    useEffect(() => {
        // Get form data from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const data = urlParams.get('data');
        if (data) {
            try {
                setFormData(JSON.parse(decodeURIComponent(data)));
            } catch (error) {
                console.error('Failed to parse form data:', error);
                navigate('/register-creator');
            }
        } else {
            navigate('/register-creator');
        }
    }, [navigate]);

    const validateFile = (file, type) => {
        const config = documentTypes[type];
        
        if (!file) {
            return config.required ? `${config.label}は必須です` : null;
        }

        if (file.size > config.maxSize) {
            return `ファイルサイズは${config.maxSize / (1024 * 1024)}MB以下にしてください`;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!config.acceptedFormats.includes(fileExtension)) {
            return `許可されているファイル形式: ${config.acceptedFormats}`;
        }

        return null;
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const error = validateFile(file, type);
        if (error) {
            setErrors(prev => ({ ...prev, [type]: error }));
            return;
        }

        setErrors(prev => ({ ...prev, [type]: null }));
        setDocuments(prev => ({ ...prev, [type]: file }));

        // Create preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        } else {
            setPreviews(prev => ({ ...prev, [type]: null }));
        }
    };

    const removeFile = (type) => {
        setDocuments(prev => ({ ...prev, [type]: null }));
        setPreviews(prev => ({ ...prev, [type]: null }));
        setErrors(prev => ({ ...prev, [type]: null }));
    };

    // Camera functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
            
            setShowCamera(true);
        } catch (error) {
            console.error('Camera access error:', error);
            setErrors(prev => ({ 
                ...prev, 
                selfieWithID: 'カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。' 
            }));
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'selfie-with-id.jpg', { type: 'image/jpeg' });
                setDocuments(prev => ({ ...prev, selfieWithID: file }));
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => ({ ...prev, selfieWithID: reader.result }));
                };
                reader.readAsDataURL(file);
                
                stopCamera();
            }
        }, 'image/jpeg', 0.9);
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const uploadToObjectStorage = async (file, folder = '.private') => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`/api/upload?folder=${folder}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('アップロードに失敗しました');
        }

        const data = await response.json();
        return data.url;
    };

    const handleSubmit = async () => {
        // Validate required documents
        const identityError = validateFile(documents.identityDocument, 'identityDocument');
        const selfieError = validateFile(documents.selfieWithID, 'selfieWithID');
        
        if (identityError || selfieError) {
            setErrors(prev => ({ 
                ...prev, 
                identityDocument: identityError,
                selfieWithID: selfieError
            }));
            return;
        }

        if (!currentUser || !formData) {
            alert('セッションが切れました。最初からやり直してください。');
            navigate('/register-creator');
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload documents to object storage
            const uploadedDocs = {};
            
            if (documents.identityDocument) {
                uploadedDocs.identityDocument = await uploadToObjectStorage(
                    documents.identityDocument, 
                    '.private'
                );
            }

            if (documents.selfieWithID) {
                uploadedDocs.selfieWithID = await uploadToObjectStorage(
                    documents.selfieWithID, 
                    '.private'
                );
            }

            if (documents.addressProof) {
                uploadedDocs.addressProof = await uploadToObjectStorage(
                    documents.addressProof, 
                    '.private'
                );
            }

            // Create application in Firestore
            const applicationData = {
                userId: currentUser.uid,
                userName: formData.name || '',
                email: currentUser.email || '',
                furiganaFamily: formData.furiganaFamily || '',
                furiganaFirst: formData.furiganaFirst || '',
                address: formData.address || '',
                dob: formData.dob || '',
                contentKind: formData.contentKind || '',
                phoneNumber: formData.phoneNumber || '',
                documents: uploadedDocs,
                status: 'pending',
                submittedAt: serverTimestamp(),
                reviewedAt: null,
                reviewedBy: null,
                rejectionReason: null
            };
            
            await addDoc(collection(db, 'creatorApplications'), applicationData);
            
            // Update user status
            await updateDoc(doc(db, 'users', currentUser.uid), {
                creatorStatus: 'pending',
                creatorApplicationSubmittedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Clear local storage
            localStorage.removeItem('creatorRegistrationForm');

            // Navigate to completion page
            navigate('/creator-registration-complete');
            
        } catch (error) {
            console.error('Submission error:', error);
            alert('申請の送信に失敗しました。もう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!formData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 pb-20">
            <div className="max-w-3xl mx-auto">
                {/* Progress bar */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { step: 1, label: '情報を入力', active: false, completed: true },
                            { step: 2, label: '電話番号認証', active: false, completed: true },
                            { step: 3, label: '書類を提出', active: true, completed: false },
                            { step: 4, label: '書類審査', active: false, completed: false }
                        ].map(({ step, label, active, completed }) => (
                            <div key={step} className="flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        backgroundColor: completed ? '#10b981' : active ? '#ec4899' : '#e5e7eb'
                                    }}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold mb-2 ${
                                        active || completed ? 'shadow-lg' : ''
                                    }`}
                                >
                                    {completed ? <CheckCircle className="w-5 h-5" /> : step}
                                </motion.div>
                                <span className={`text-xs sm:text-sm text-center ${
                                    active ? 'font-semibold text-pink-600' : completed ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-6 sm:p-8"
                >
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">本人確認書類の提出</h2>
                    <div className="flex items-start space-x-2 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">重要な注意事項：</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>書類は鮮明に撮影してください</li>
                                <li>個人情報がはっきり読み取れることを確認してください</li>
                                <li>有効期限内の書類をアップロードしてください</li>
                                <li>ファイルサイズは10MB以下にしてください</li>
                            </ul>
                        </div>
                    </div>

                    {/* Identity Document Upload */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-pink-600" />
                                {documentTypes.identityDocument.label}
                                <span className="text-red-500 ml-1">*</span>
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {documentTypes.identityDocument.description}
                        </p>

                        {!documents.identityDocument ? (
                            <label className="block">
                                <input
                                    type="file"
                                    accept={documentTypes.identityDocument.acceptedFormats}
                                    onChange={(e) => handleFileChange(e, 'identityDocument')}
                                    className="hidden"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-700 font-medium mb-1">
                                        クリックしてファイルを選択
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        JPG, PNG, PDF (最大10MB)
                                    </p>
                                </div>
                            </label>
                        ) : (
                            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        {previews.identityDocument ? (
                                            <img 
                                                src={previews.identityDocument} 
                                                alt="Preview" 
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-gray-500" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 break-all">
                                                {documents.identityDocument.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {(documents.identityDocument.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile('identityDocument')}
                                        className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {errors.identityDocument && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.identityDocument}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Selfie with ID */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <Camera className="w-5 h-5 mr-2 text-pink-600" />
                                {documentTypes.selfieWithID.label}
                                <span className="text-red-500 ml-1">*</span>
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {documentTypes.selfieWithID.description}
                        </p>

                        {!documents.selfieWithID ? (
                            <>
                                {!showCamera ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={startCamera}
                                            className="border-2 border-dashed border-pink-300 rounded-xl p-6 text-center hover:border-pink-500 hover:bg-pink-50 transition-all"
                                        >
                                            <Camera className="w-12 h-12 mx-auto mb-3 text-pink-500" />
                                            <p className="text-gray-700 font-medium mb-1">
                                                カメラで撮影
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                身分証を持って自撮り
                                            </p>
                                        </button>
                                        <label className="block cursor-pointer">
                                            <input
                                                type="file"
                                                accept={documentTypes.selfieWithID.acceptedFormats}
                                                onChange={(e) => handleFileChange(e, 'selfieWithID')}
                                                className="hidden"
                                            />
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-500 hover:bg-pink-50 transition-all h-full flex flex-col justify-center">
                                                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                <p className="text-gray-700 font-medium mb-1">
                                                    ファイルから選択
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    JPG, PNG (最大10MB)
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="border-2 border-pink-300 rounded-xl p-4 bg-gray-900">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full rounded-lg"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={capturePhoto}
                                                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg"
                                            >
                                                <Camera className="w-5 h-5 inline mr-2" />
                                                撮影する
                                            </button>
                                            <button
                                                onClick={stopCamera}
                                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                                            >
                                                キャンセル
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        {previews.selfieWithID && (
                                            <img 
                                                src={previews.selfieWithID} 
                                                alt="Selfie Preview" 
                                                className="w-32 h-32 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 break-all">
                                                {documents.selfieWithID.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {(documents.selfieWithID.size / 1024).toFixed(1)} KB
                                            </p>
                                            <div className="mt-2 flex items-center space-x-1 text-green-600 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>撮影完了</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile('selfieWithID')}
                                        className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {errors.selfieWithID && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.selfieWithID}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Address Proof Upload */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-pink-600" />
                                {documentTypes.addressProof.label}
                                <span className="text-gray-400 ml-2 text-sm">(任意)</span>
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {documentTypes.addressProof.description}
                        </p>

                        {!documents.addressProof ? (
                            <label className="block">
                                <input
                                    type="file"
                                    accept={documentTypes.addressProof.acceptedFormats}
                                    onChange={(e) => handleFileChange(e, 'addressProof')}
                                    className="hidden"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-700 font-medium mb-1">
                                        クリックしてファイルを選択
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        JPG, PNG, PDF (最大10MB)
                                    </p>
                                </div>
                            </label>
                        ) : (
                            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        {previews.addressProof ? (
                                            <img 
                                                src={previews.addressProof} 
                                                alt="Preview" 
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-gray-500" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 break-all">
                                                {documents.addressProof.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {(documents.addressProof.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile('addressProof')}
                                        className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {errors.addressProof && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-1 mt-2 text-red-600 text-sm"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.addressProof}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => navigate(-1)}
                            disabled={isSubmitting}
                            className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>戻る</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !documents.identityDocument || !documents.selfieWithID}
                            className="flex-1 py-4 px-6 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>送信中...</span>
                                </>
                            ) : (
                                <>
                                    <span>申請を提出する</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DocumentSubmissionPage;
