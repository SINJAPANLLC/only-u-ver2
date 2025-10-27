import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from "react-router-dom"; 
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // ✅ Updated path to firebase.js

export default function MyFansSignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      // ✅ Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Update display name
      await updateProfile(userCredential.user, { displayName: name });

      // ✅ Save user profile to Firestore for messaging system
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: name,
        email: email,
        photoURL: userCredential.user.photoURL || null,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true
      });

      console.log("User created successfully:", userCredential.user);

      setIsVerifying(false);

      // ✅ Redirect to Home page
      // Navigation will be handled automatically by the AuthContext
      navigate("/home");

    } catch (err) {
      console.error("Signup error:", err.message);
      
      // エラーメッセージを日本語で表示
      let errorMessage = "登録に失敗しました";
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "このメールアドレスは既に使用されています";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "メールアドレスの形式が正しくありません";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "パスワードは6文字以上で設定してください";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "ネットワークエラーが発生しました。接続を確認してください";
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = "メール/パスワードでの登録が無効になっています";
      }
      
      setError(errorMessage);
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative"
      >
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </motion.button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-8">新規登録</h1>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center mb-12"
        >
          <div className="flex items-center gap-2">
            <img src="/logo.webp" alt="Logo" className="w-100 h-16" />
          </div>
        </motion.div>

{/* Form */}
<form onSubmit={handleSubmit} className="space-y-4">
  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
    <input
      type="email"
      placeholder="メールアドレスを入力"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
      required
    />
  </motion.div>

  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
    <input
      type="password"
      placeholder="パスワードを入力"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
      required
    />
  </motion.div>

  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
    <input
      type="text"
      placeholder="名前を入力"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
      required
    />
  </motion.div>

  {/* Agreement text */}
  <motion.div 
    initial={{ opacity: 0, x: -20 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ delay: 0.6, duration: 0.5 }}
    className="text-xs text-gray-600 text-center mb-4"
  >
    <p>利用規約、プライバシーポリシー、特商法に同意の上ご登録ください</p>
      <p>新規登録を行うことでご自身が<br/>18歳以上であることにも同意したものとみなされます</p>
  </motion.div>

  {/* Error message */}
  {error && <p className="text-red-500 text-sm">{error}</p>}

  {/* Sign Up Button */}
  <div className="flex flex-col gap-4">
    <motion.button
      type="submit"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={isVerifying}
      className={`w-full py-4 rounded-lg font-medium transition-all ${
        isVerifying
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-pink-500 text-white hover:bg-pink-600"
      }`}
    >
      {isVerifying ? "登録中..." : "新規登録"}
    </motion.button>
  </div>
</form>



        {/* Already have account */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="mt-8 text-center">
          <div className="text-sm text-gray-600 mb-4">既にアカウントをお持ちの方</div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/login")} 
            className="w-full border-2 border-pink-500 text-pink-500 py-4 rounded-lg font-medium hover:bg-pink-50 transition-all"
          >
            ログイン
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
