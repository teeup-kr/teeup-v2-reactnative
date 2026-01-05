import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { authUtils } from '../../lib/auth';
import { notificationsApi } from '../../lib/api';
import { FaArrowLeft, FaBell, FaUser } from 'react-icons/fa';

const Header = ({
  showBackButton = false,
  onBackClick,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // 실제 토큰 유효성 확인
  const isReallyAuthenticated = authUtils.isAuthenticated();

  // 읽지 않은 알림 개수 조회
  const { data: unreadNotifications } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getNotifications({ filter: 'unread', limit: 1000 }), // 충분히 큰 limit
    enabled: isReallyAuthenticated,
    refetchInterval: 30000, // 30초마다 갱신
    select: (data) => {
      // 읽지 않은 알림 개수 계산
      return data?.filter(n => n.status === 'UNREAD' || !n.read_at)?.length || 0;
    },
  });

  const unreadCount = unreadNotifications || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={onBackClick}
                className="mr-3 p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft className="h-6 w-6" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FZfurg%2FbtsQ1nRxxJM%2FAAAAAAAAAAAAAAAAAAAAAB9cCyQxLN7YuhBgZe8udAfgwUD9bfmassbfHvkGIxUx%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1761922799%26allow_ip%3D%26allow_referer%3D%26signature%3DSvFGt%252BMEK0mIfwTo40IPPxkG860%253D"
                alt="티업링크" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  console.error('❌ 로고 이미지 로드 실패:', e.target.src);
                  console.error('❌ 에러 이벤트:', e);
                }}
                onLoad={() => {
                  console.log('✅ 로고 이미지 로드 성공');
                }}
              />
              <span className="text-xl font-bold text-gray-900">티업링크</span>
            </Link>
          </div>

          {/* Center - Navigation Menu (Desktop only) */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/clubs"
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              클럽
            </Link>
            <Link
              to="/meetings"
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              모임
            </Link>
            <Link
              to="/records"
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              기록
            </Link>
            <Link
              to="/notices"
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              공지
            </Link>
          </nav>

          {/* Right side - Auth buttons or User menu (Desktop only) */}
          <div className="hidden md:flex items-center space-x-4">
            {isReallyAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">{user?.nickname}</span> 님
                </span>
                <Link
                  to="/mypage#notifications"
                  className="relative text-gray-700 hover:text-emerald-600 transition-colors"
                  title="알림"
                >
                  <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/mypage"
                  className="text-gray-700 hover:text-emerald-600 transition-colors"
                  title="마이페이지"
                >
                  <FaUser className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-emerald-600 text-xs sm:text-sm font-medium transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
