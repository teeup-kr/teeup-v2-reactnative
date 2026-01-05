import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Header, Footer, BottomNavigation, FullMenu } from './components/layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 페이지 컴포넌트들
import Index from './pages/Index';

// 인증 관련
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RegisterSuccessPage from './pages/auth/RegisterSuccessPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
import DriveTokenCallbackPage from './pages/auth/DriveTokenCallbackPage';
import TermsPage from './pages/auth/TermsPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// 클럽 관련
import ClubListPage from './pages/clubs/ClubListPage';
import ClubRegisterPage from './pages/clubs/ClubRegisterPage';
import ClubDetailPage from './pages/clubs/ClubDetailPage';
import ClubManagePage from './pages/clubs/ClubManagePage';
import ClubMemberManagePage from './pages/clubs/ClubMemberManagePage';
import ClubNoticesPage from './pages/clubs/ClubNoticesPage';
import ClubRegulationsPage from './pages/clubs/ClubRegulationsPage';
import ClubFeesPage from './pages/clubs/ClubFeesPage';
import ClubStatsPage from './pages/clubs/ClubStatsPage';
import ClubRegulationCreatePage from './pages/clubs/ClubRegulationCreatePage';
import ClubRegulationDetailPage from './pages/clubs/ClubRegulationDetailPage';
import ClubActivitiesPage from './pages/clubs/ClubActivitiesPage';
import ClubApplicationDetailPage from './pages/clubs/ClubApplicationDetailPage';

// 모임 관련
import MeetingListPage from './pages/meetings/MeetingListPage';
import MyMeetingsPage from './pages/meetings/MyMeetingsPage';
import MeetingDetailPage from './pages/meetings/MeetingDetailPage';
import RoundingCreatePage from './pages/meetings/RoundingCreatePage';
import RoundingEditPage from './pages/meetings/RoundingEditPage';
import SocialCreatePage from './pages/meetings/SocialCreatePage';
import SocialEditPage from './pages/meetings/SocialEditPage';
import ExpensePage from './pages/meetings/ExpensePage';
import MeetingStatsPage from './pages/meetings/MeetingStatsPage';
import ScoreInputPage from './pages/meetings/ScoreInputPage';

// 사용자 프로필
import UserProfileCompletePage from './pages/profile/UserProfileCompletePage';
import ChangePasswordPage from './pages/profile/ChangePasswordPage';
import DeleteAccountPage from './pages/profile/DeleteAccountPage';
import MyPage from './pages/profile/MyPage';

// 알림 (마이페이지로 통합됨)

// 기록
import RecordsPage from './pages/records/RecordsPage';

// 공지사항
import NoticeListPage from './pages/notices/NoticeListPage';
import NoticeDetailPage from './pages/notices/NoticeDetailPage';

// FAQ
import FAQPage from './pages/faq/FAQPage';

// QueryClient 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function MeetingDetailLegacyRedirect() {
  const { meetingId } = useParams();
  return <Navigate to={`/meetings/rounding/${meetingId}`} replace />;
}

function AppContent() {
  const { isLoading } = useAuth();
  const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);

  const handleMenuOpen = () => {
    setIsFullMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsFullMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 pb-16">
              <Routes>
                {/* 독립적인 전체 화면 페이지 (헤더만 있음) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register-success" element={<RegisterSuccessPage />} />
                <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                <Route path="/auth/google/drive-callback" element={<DriveTokenCallbackPage />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                <Route path="/terms" element={<TermsPage />} />
                
                {/* 일반 페이지들 */}
                <Route path="/" element={<Index />} />
                
                {/* 클럽 관련 */}
                <Route path="/clubs" element={<ClubListPage />} />
                <Route path="/clubs/register" element={<ClubRegisterPage />} />
                <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
                <Route path="/clubs/:clubId/manage" element={<ClubManagePage />} />
                <Route path="/clubs/:clubId/members" element={<ClubMemberManagePage />} />
                <Route path="/clubs/:clubId/notices" element={<ClubNoticesPage />} />
                <Route path="/clubs/:clubId/regulations" element={<ClubRegulationsPage />} />
                <Route path="/clubs/:clubId/fees" element={<ClubFeesPage />} />
                <Route path="/clubs/:clubId/stats" element={<ClubStatsPage />} />
                <Route path="/clubs/:clubId/regulations/create" element={<ClubRegulationCreatePage />} />
                <Route path="/clubs/:clubId/regulations/:regulationId" element={<ClubRegulationDetailPage />} />
                <Route path="/clubs/:clubId/regulations/:regulationId/edit" element={<ClubRegulationCreatePage />} />
                <Route path="/clubs/:clubId/activities" element={<ClubActivitiesPage />} />
                <Route path="/clubs/applications/:applicationId" element={<ClubApplicationDetailPage />} />
                
                {/* 모임 관련 */}
                <Route path="/meetings" element={<MeetingListPage />} />
                <Route path="/meetings/my" element={<MyMeetingsPage />} />
                <Route path="/meetings/:meetingType/:meetingId" element={<MeetingDetailPage />} />
                <Route path="/meetings/:meetingId" element={<MeetingDetailLegacyRedirect />} />
                <Route path="/meetings/rounding/create" element={<RoundingCreatePage />} />
                <Route path="/meetings/rounding/:meetingId/edit" element={<RoundingEditPage />} />
                <Route path="/meetings/social/create" element={<SocialCreatePage />} />
                <Route path="/meetings/social/:meetingId/edit" element={<SocialEditPage />} />
                <Route path="/meetings/:meetingId/expense" element={<ExpensePage />} />
                <Route path="/meetings/:meetingId/stats" element={<MeetingStatsPage />} />
                <Route path="/meetings/:meetingId/score" element={<ScoreInputPage />} />
                
                {/* 마이페이지 */}
                <Route path="/mypage" element={<MyPage />} />
                
                {/* 사용자 프로필 (리다이렉트) */}
                <Route path="/profile/complete" element={<UserProfileCompletePage />} />
                <Route path="/profile" element={<Navigate to="/mypage#edit" replace />} />
                <Route path="/profile/change-password" element={<ChangePasswordPage />} />
                <Route path="/profile/delete-account" element={<Navigate to="/mypage#withdraw" replace />} />
                
                {/* 알림 (마이페이지로 통합) */}
                <Route path="/notifications" element={<Navigate to="/mypage#notifications" replace />} />
                
                {/* 기록 (리다이렉트) */}
                <Route path="/records" element={<Navigate to="/mypage#records" replace />} />
                
                {/* 공지사항 */}
                <Route path="/notices" element={<NoticeListPage />} />
                <Route path="/notices/:id" element={<NoticeDetailPage />} />
                
                {/* FAQ */}
                <Route path="/faq" element={<FAQPage />} />
                
                {/* 기본 리다이렉트 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Footer />
            </main>
            <BottomNavigation onMenuClick={handleMenuOpen} />
            <FullMenu isOpen={isFullMenuOpen} onClose={handleMenuClose} />
          </div>
        </Router>
      </QueryClientProvider>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="!top-3 sm:!top-5"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 24px)',
          maxWidth: '500px'
        }}
        toastStyle={{ 
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          minWidth: '280px',
          maxWidth: 'calc(100vw - 24px)',
          textAlign: 'center'
        }}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


