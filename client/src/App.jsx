import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SocialFeedScreen from './components/pages/feed';
import MessagesUI from './components/pages/msg';
import RankingPage from './components/pages/RankingPage';
import AccountPage from './components/pages/AccountPage'; // Add this import
import LoggedInAccountPage from './components/pages/LoggedInAccount';
import Home from './components/pages/Home';
import AgeVerification from './components/pages/AgeVerification';
import GenreNavigationSystem from './components/pages/Ranking/GenreCategoryList';
import CreatePostPage from './components/pages/CreatePostPage';
import MyFansLogin from './Auth/login_page';
import MyFansSignUp from './Auth/sign_up';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UnreadMessagesProvider } from './context/UnreadMessagesContext';
import { UserStatsProvider } from './context/UserStatsContext';
import { CreatorProvider } from './context/CreatorContext';
import { NotificationProvider } from './context/NotificationContext';
import SearchPage from './components/pages/SearchPage';
import TermsOfUse from './components/pages/TermsOfUse'; // Import TermsOfUse component
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import LegalNotice from './components/pages/LegalNotice';
import ContentGuidelines from './components/pages/ContentGuidelines';
import LanguageSettings from './components/pages/LanguagePage';
import RegisterCreatorPage from './components/pages/RegisterCreatorPage';
import ProfilePage from './components/pages/ProfilePage';
import NotificationPage from './components/pages/NotificationPage';
import LikePurchasePage from './components/pages/LikePurchedViewPage';
import GenreDataPage from './components/pages/GenreDataPage';
import VideoPage from './components/pages/VideoPage';
import ProfilePageNew from './components/pages/ProfilePage';
import CreatorDashboard from './components/pages/CreatorDashboard';
import HighQualityPlanPage from './components/pages/HighQualityPlanPage';
import CurrentPlanPage from './components/pages/CurrentPlanPage';
import PaymentMethodsPage from './components/pages/PaymentMethodsPage';
import PurchaseHistoryPage from './components/pages/PurchaseHistoryPage';
import CouponListPage from './components/pages/CouponListPage';
import CreatorRankingPage from './components/pages/CreatorRankingPage';
import ActivePlansPage from './components/pages/ActivePlansPage';
import MyPostsPage from './components/pages/MyPostsPage';
import PostCommentsPage from './components/pages/PostCommentsPage';
import SalesManagementPage from './components/pages/SalesManagementPage';
import BankAccountRegistrationPage from './components/pages/BankAccountRegistrationPage';
import TransferRequestPage from './components/pages/TransferRequestPage';
import CouponManagementPage from './components/pages/CouponManagementPage';
import SettingsPage from './components/pages/SettingsPage';
import EmailNotificationSettingsPage from './components/pages/EmailNotificationSettingsPage';
import FollowListPage from './components/pages/FollowListPage';
import BlockedUsersPage from './components/pages/BlockedUsersPage';
import PersonalInfoPage from './components/pages/PersonalInfoPage';
import PhoneVerificationPage from './components/pages/PhoneVerificationPage';
import EmailVerificationPage from './components/pages/EmailVerificationPage';
import HelpPage from './components/pages/HelpPage';
import SwitchAccountPage from './components/pages/SwitchAccountPage';
import CreatorPhoneVerificationPage from './components/pages/CreatorPhoneVerificationPage';
import CreatorRegistrationCompletePage from './components/pages/CreatorRegistrationCompletePage';
import DocumentSubmissionPage from './components/pages/DocumentSubmissionPage';
import EditProfilePage from './components/pages/EditProfilePage';
import ImagePage from './components/pages/ImagePage';
import LandingPage from './components/pages/LandingPage';
import AdminLoginPage from './components/pages/AdminLoginPage';

// import AdminLayout from "./components/admin/AdminLayout";
import AdminLayout from './components/pages/admin/AdminLayout';
import Dashboard from "./components/pages/admin/Dashboard";
import Users from "./components/pages/admin/Users";
import Creators from './components/pages/admin/Creators';
import Reports from "./components/pages/admin/Reports";
import Posts from "./components/pages/admin/Posts";
import Sales from "./components/pages/admin/Sales";
import Verification from "./components/pages/admin/Verification";
import NotificationManagement from "./components/pages/admin/NotificationManagement";
import UserManagement from "./components/pages/admin/UserManagement";
import AnalyticsDashboard from "./components/pages/admin/AnalyticsDashboard";
import PostManagement from "./components/pages/admin/PostManagement";
import RevenueManagement from "./components/pages/admin/RevenueManagement";
import KYCManagement from "./components/pages/admin/KYCManagement";
import PDCAManagement from "./components/pages/admin/PDCAManagement";
import CustomerFeedback from "./components/pages/admin/CustomerFeedback";
import ABTesting from "./components/pages/admin/ABTesting";
import KPIDashboard from "./components/pages/admin/KPIDashboard";
import ReportManagement from "./components/pages/admin/ReportManagement";
import EmailNotificationManagement from "./components/pages/admin/EmailNotificationManagement";
import PushNotificationManagement from "./components/pages/admin/PushNotificationManagement";
import FeaturedPickupManagement from "./components/pages/admin/FeaturedPickupManagement";
import HomeSliderManagement from "./components/pages/admin/HomeSliderManagement";
import TransferRequestManagement from "./components/pages/admin/TransferRequestManagement";
import AdminLogin from "./components/pages/admin/AdminLogin";

const AccountWrapper = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <LoggedInAccountPage /> : <AccountPage />;
};
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isVerified, setIsVerified] = useState(
    localStorage.getItem('ageVerified') === 'true'
  );

  const handleVerification = (verified) => {
    if (verified) {
      setIsVerified(true);
      localStorage.setItem('ageVerified', 'true');
    }
  };

  // If not age verified, show age verification
  if (!isVerified) {
    return <AgeVerification onVerify={handleVerification} />;
  }

  // If age verified but not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If both age verified and authenticated, show the protected content
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const [isVerified, setIsVerified] = useState(
    localStorage.getItem('ageVerified') === 'true'
  );

  const handleVerification = (verified) => {
    if (verified) {
      setIsVerified(true);
      localStorage.setItem('ageVerified', 'true');
    }
  };

  return (
    <Routes>
      {/* Age verification route */}
      <Route
        path="/age-verification"
        element={<AgeVerification onVerify={handleVerification} />}
      />

      {/* Authentication routes - only accessible if age verified */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> :
            !isVerified ? <Navigate to="/age-verification" replace /> :
              <MyFansLogin />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> :
            !isVerified ? <Navigate to="/age-verification" replace /> :
              <MyFansSignUp />
        }
      />

      {/* Protected routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><SocialFeedScreen /></ProtectedRoute>} />
      <Route path="/rankingpage" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
      <Route path="/GenreNavigationSystem" element={<ProtectedRoute><GenreNavigationSystem /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesUI /></ProtectedRoute>} />
      {/* <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} /> */}
      <Route path="/account" element={<ProtectedRoute><AccountWrapper /></ProtectedRoute>} />
      <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
      <Route path="/search" element={<SearchPage />} />

      <Route path="/genre/:genreName" element={<ProtectedRoute><GenreDataPage /></ProtectedRoute>} />
      <Route path="/video/:id" element={<ProtectedRoute><VideoPage /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><ProfilePageNew /></ProtectedRoute>} />

      <Route path="/added-content/:contentType?" element={<ProtectedRoute><LikePurchasePage /></ProtectedRoute>} />

      <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
      <Route path="/terms" element={<TermsOfUse />} /> {/* Add this route */}

      {/* Other legal pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal" element={<LegalNotice />} />
      <Route path="/guidelines" element={<ContentGuidelines />} />
      {/* <Route path="/help" element={<HelpPage />} /> */}
      <Route path="/settings/languages" element={<LanguageSettings />} />
      {/* Default route */}
      <Route path="/subscription" element={<ProtectedRoute><div>Subscription Page</div></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute><div>Plans Page</div></ProtectedRoute>} />
      <Route path="/high-quality-plan" element={<ProtectedRoute><HighQualityPlanPage /></ProtectedRoute>} />
      <Route path="/current-plan" element={<ProtectedRoute><CurrentPlanPage /></ProtectedRoute>} />
      <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
      <Route path="/purchase-history" element={<ProtectedRoute><PurchaseHistoryPage /></ProtectedRoute>} />
      <Route path="/coupons" element={<ProtectedRoute><CouponListPage /></ProtectedRoute>} />
      <Route path="/creator-ranking" element={<ProtectedRoute><CreatorRankingPage /></ProtectedRoute>} />
      <Route path="/active-plans" element={<ProtectedRoute><ActivePlansPage /></ProtectedRoute>} />
      <Route path="/my-posts" element={<ProtectedRoute><MyPostsPage /></ProtectedRoute>} />
      <Route path="/post-comments" element={<ProtectedRoute><PostCommentsPage /></ProtectedRoute>} />
      <Route path="/sales-management" element={<ProtectedRoute><SalesManagementPage /></ProtectedRoute>} />
      <Route path="/bank-account-registration" element={<ProtectedRoute><BankAccountRegistrationPage /></ProtectedRoute>} />
      <Route path="/transfer-request" element={<ProtectedRoute><TransferRequestPage /></ProtectedRoute>} />
      <Route path="/coupon-management" element={<ProtectedRoute><CouponManagementPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/settings/email-notifications" element={<ProtectedRoute><EmailNotificationSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/follow-list" element={<ProtectedRoute><FollowListPage /></ProtectedRoute>} />
      <Route path="/settings/blocked-users" element={<ProtectedRoute><BlockedUsersPage /></ProtectedRoute>} />
      <Route path="/settings/personal-info" element={<ProtectedRoute><PersonalInfoPage /></ProtectedRoute>} />
      <Route path="/settings/phone-verification" element={<ProtectedRoute><PhoneVerificationPage /></ProtectedRoute>} />
      <Route path="/settings/email-verification" element={<ProtectedRoute><EmailVerificationPage /></ProtectedRoute>} />
      <Route path="/settings/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route path="/settings/language" element={<ProtectedRoute><LanguageSettings /></ProtectedRoute>} />
      <Route path="/settings/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
      <Route path="/amount-available" element={<ProtectedRoute><div>Amount Available Page</div></ProtectedRoute>} />
      {/* <Route path="/register-creator" element={<ProtectedRoute><RegisterCreatorPage /></ProtectedRoute>} /> */}
      <Route path="/register-creator" element={<ProtectedRoute><RegisterCreatorPage /></ProtectedRoute>} />
      <Route path="/referral-program" element={<ProtectedRoute><div>Referral Program Page</div></ProtectedRoute>} />
      <Route path="/switch-account" element={<ProtectedRoute><SwitchAccountPage /></ProtectedRoute>} />
      <Route path="/creator-phone-verification" element={<ProtectedRoute><CreatorPhoneVerificationPage /></ProtectedRoute>} />
      <Route path="/document-submission" element={<ProtectedRoute><DocumentSubmissionPage /></ProtectedRoute>} />
      <Route path="/creator-registration-complete" element={<ProtectedRoute><CreatorRegistrationCompletePage /></ProtectedRoute>} />
      <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
      <Route path="/image/:id" element={<ProtectedRoute><ImagePage /></ProtectedRoute>} />
      <Route path="/lp" element={<LandingPage />} />
      <Route path="/logout" element={<ProtectedRoute><div>Logout Handler</div></ProtectedRoute>} />

      {/* Admin login route */}
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Admin management routes - protected by AdminLayout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="creators" element={<Creators />} />
                <Route path="reports" element={<ReportManagement />} />
                <Route path="email-notifications" element={<EmailNotificationManagement />} />
                <Route path="push-notifications" element={<PushNotificationManagement />} />
        <Route path="featured-pickup" element={<FeaturedPickupManagement />} />
        <Route path="home-slider" element={<HomeSliderManagement />} />
        <Route path="transfer-requests" element={<TransferRequestManagement />} />
        <Route path="posts" element={<PostManagement />} />
        <Route path="sales" element={<RevenueManagement />} />
        <Route path="verification" element={<KYCManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="pdca" element={<PDCAManagement />} />
        <Route path="feedback" element={<CustomerFeedback />} />
        <Route path="ab-testing" element={<ABTesting />} />
        <Route path="kpi" element={<KPIDashboard />} />
      </Route>

      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> :
            <LandingPage />
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <UnreadMessagesProvider>
        <UserStatsProvider>
          <CreatorProvider>
            <NotificationProvider>
              <Router>
                <div className="App">
                  <AppRoutes />
                </div>
              </Router>
            </NotificationProvider>
          </CreatorProvider>
        </UserStatsProvider>
      </UnreadMessagesProvider>
    </AuthProvider>
  );
}

export default App;
