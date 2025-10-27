import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { db } from "../../../firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { 
  Users as UsersIcon, 
  Search, 
  Ban, 
  UserCheck,
  Shield,
  Eye,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  AdminPageContainer, 
  AdminPageHeader, 
  AdminStatsCard, 
  AdminContentCard, 
  AdminTableContainer, 
  AdminEmptyState, 
  AdminLoadingState 
} from './AdminPageContainer';

// カウントアップアニメーションコンポーネント
const AnimatedNumber = ({ value, duration = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / (duration * 1000);
      
      if (progress < 1) {
        setDisplayValue(Math.floor(value * progress));
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
};

export default function Users() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        banned: 0,
        verified: 0
    });
    const { t } = useTranslation();

    const statusOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'Active', label: 'アクティブ' },
        { value: 'Banned', label: 'BAN済み' }
    ];

    // フィルタリング
    useEffect(() => {
        let filtered = [...users];

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(user => user.status === filterStatus);
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, filterStatus]);

    // 統計を更新
    useEffect(() => {
        const newStats = {
            total: users.length,
            active: users.filter(u => u.status === 'Active').length,
            banned: users.filter(u => u.status === 'Banned').length,
            verified: users.filter(u => u.isVerified).length
        };
        setStats(newStats);
    }, [users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setIsRefreshing(true);
            
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc')
            );
            
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = [];
            
            usersSnapshot.forEach((doc) => {
                const userData = doc.data();
                usersData.push({
                    id: doc.id,
                    uid: userData.uid || doc.id,
                    name: userData.displayName || userData.name || 'Unknown User',
                    email: userData.email || 'No email',
                    photoURL: userData.photoURL || null,
                    status: userData.isBanned ? 'Banned' : 'Active',
                    isBanned: userData.isBanned || false,
                    isVerified: userData.isVerified || false,
                    createdAt: userData.createdAt || null,
                    followersCount: userData.followers?.length || 0,
                    followingCount: userData.following?.length || 0,
                    lastLogin: userData.lastLogin || null
                });
            });
            
            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleBanToggle = async (userId, currentBanStatus) => {
        try {
            const userRef = doc(db, 'users', userId);
            const newBanStatus = !currentBanStatus;
            
            await updateDoc(userRef, {
                isBanned: newBanStatus,
                lastModified: new Date().toISOString()
            });
            
            setUsers(users.map(user => 
                user.id === userId 
                    ? { ...user, isBanned: newBanStatus, status: newBanStatus ? 'Banned' : 'Active' }
                    : user
            ));
        } catch (error) {
            console.error('Error updating user ban status:', error);
            alert('Failed to update user status.');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'text-green-600 bg-green-100';
            case 'Banned': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return <AdminLoadingState message="ユーザーデータを読み込み中..." />;
    }

    return (
        <AdminPageContainer>
            {/* ページヘッダー */}
            <AdminPageHeader
                title="ユーザー管理"
                description="ユーザーの管理、BAN/解除を行います"
                icon={UsersIcon}
                actions={
                    <>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchUsers}
                            disabled={isRefreshing}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                            data-testid="button-refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="font-medium">更新</span>
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                            data-testid="button-export"
                        >
                            <Download className="w-4 h-4" />
                            <span className="font-medium">エクスポート</span>
                        </motion.button>
                    </>
                }
            />

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatsCard
                    title="総ユーザー数"
                    value={<AnimatedNumber value={stats.total} />}
                    icon={UsersIcon}
                    color="blue"
                />
                <AdminStatsCard
                    title="アクティブ"
                    value={<AnimatedNumber value={stats.active} />}
                    icon={CheckCircle}
                    color="green"
                />
                <AdminStatsCard
                    title="BAN済み"
                    value={<AnimatedNumber value={stats.banned} />}
                    icon={Ban}
                    color="pink"
                />
                <AdminStatsCard
                    title="認証済み"
                    value={<AnimatedNumber value={stats.verified} />}
                    icon={Shield}
                    color="purple"
                />
            </div>

            {/* フィルターと検索 */}
            <AdminContentCard title="検索・フィルター">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="ユーザーを検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                data-testid="input-search"
                            />
                        </div>
                    </div>

                    <div className="md:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            data-testid="select-status"
                        >
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </AdminContentCard>

            {/* ユーザー一覧テーブル */}
            <AdminTableContainer>
                {filteredUsers.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    プロフィール
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    名前
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ステータス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    フォロワー
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    登録日
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user, index) => (
                                <motion.tr 
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="hover:bg-pink-50 transition-colors"
                                    data-testid={`row-user-${user.id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-100"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/40x40?text=U';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center ring-2 ring-pink-100">
                                                    <span className="text-white font-semibold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {user.name}
                                            </div>
                                            {user.isVerified && (
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">ID: {user.uid.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                            {statusOptions.find(s => s.value === user.status)?.label || user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2 text-xs">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                                {user.followersCount}
                                            </span>
                                            <span className="text-gray-500">/</span>
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                                                {user.followingCount}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleBanToggle(user.id, user.isBanned)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                user.isBanned
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}
                                            data-testid={`button-ban-${user.id}`}
                                        >
                                            {user.isBanned ? 'Unban' : 'BAN'}
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <AdminEmptyState
                        icon={UsersIcon}
                        title="ユーザーが見つかりません"
                        description="検索条件を変更してください"
                    />
                )}
            </AdminTableContainer>
        </AdminPageContainer>
    );
}
