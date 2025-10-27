import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 認証状態をバックエンドAPIで検証 (HttpOnly cookie使用)
    const checkAuth = async () => {
      try {
        console.log('Checking admin authentication...');
        // バックエンドでcookieを検証
        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include',
        });

        console.log('Auth verification response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Authentication successful:', data);
          setIsAuthenticated(true);
        } else {
          console.log('Authentication failed, redirecting to login');
          setIsAuthenticated(false);
          navigate('/admin/login', { replace: true });
        }
      } catch (error) {
        console.error('Authentication verification error:', error);
        setIsAuthenticated(false);
        navigate('/admin/login', { replace: true });
      }
      
      setIsLoading(false);
    };

    checkAuth();
    
    // 定期的な認証チェック（5分ごと）
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.log('Session expired, redirecting to login');
          setIsAuthenticated(false);
          navigate('/admin/login', { replace: true });
        }
      } catch (error) {
        console.error('Periodic auth check error:', error);
      }
    }, 5 * 60 * 1000); // 5分ごと

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウント時のみ実行

  // ログアウト機能
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    // ログアウト後、確実にログイン画面にリダイレクト
    setIsAuthenticated(false);
    navigate('/admin/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">認証中...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-pink-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        
        {/* Main content with consistent padding and scrolling */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
