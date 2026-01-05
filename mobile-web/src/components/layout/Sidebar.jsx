import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FaTimes, FaHome, FaUsers, FaCalendarAlt, FaChartBar, FaBell, FaUser, FaBullhorn } from 'react-icons/fa';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const menuItems = [
    { path: '/', icon: <FaHome />, label: '홈', public: true },
    { path: '/clubs', icon: <FaUsers />, label: '클럽', public: true },
    { path: '/meetings', icon: <FaCalendarAlt />, label: '모임', public: true },
    { path: '/records', icon: <FaChartBar />, label: '기록', public: true },
    { path: '/notices', icon: <FaBullhorn />, label: '공지', public: true },
    { path: '/mypage#notifications', icon: <FaBell />, label: '알림', public: false },
    { path: '/mypage', icon: <FaUser />, label: '마이페이지', public: false },
  ];

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* 사이드바 */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 shadow-lg md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <img 
              src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FZfurg%2FbtsQ1nRxxJM%2FAAAAAAAAAAAAAAAAAAAAAB9cCyQxLN7YuhBgZe8udAfgwUD9bfmassbfHvkGIxUx%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1761922799%26allow_ip%3D%26allow_referer%3D%26signature%3DSvFGt%252BMEK0mIfwTo40IPPxkG860%253D"
              alt="티업링크" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
            <span className="text-base sm:text-lg font-bold text-gray-900">티업링크</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* 사용자 정보 (로그인 시) */}
        {isAuthenticated && user && (
          <div className="p-3 sm:p-4 bg-emerald-50 border-b border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">안녕하세요,</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900">{user.nickname} 님</p>
          </div>
        )}
        
        {/* 메뉴 항목들 */}
        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            // 비공개 메뉴는 로그인 시에만 표시
            if (!item.public && !isAuthenticated) {
              return null;
            }
            
            return (
              <Link
                key={index}
                to={item.path}
                onClick={onClose}
                className="flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 sm:px-4 sm:py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                <span className="w-4 h-4 sm:w-5 sm:h-5">{item.icon}</span>
                <span className="text-sm sm:text-base font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* 하단 로그인/로그아웃 버튼 */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 sm:px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              로그아웃
            </button>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="block w-full py-2 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
