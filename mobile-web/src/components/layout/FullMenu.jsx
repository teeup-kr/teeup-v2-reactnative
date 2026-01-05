import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FaTimes, FaHome, FaUsers, FaUserFriends, FaCalendarAlt, FaCalendarPlus, FaCalendarCheck, FaClipboardList, FaList, FaUser, FaFileAlt, FaSignOutAlt, FaGolfBall, FaQuestionCircle } from 'react-icons/fa';

const FullMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  // ESC 키로 닫기 및 body 스크롤 방지
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 메뉴 항목 클릭 핸들러
  const handleMenuItemClick = (path) => {
    navigate(path);
    onClose();
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  if (!isOpen) return null;

  // 메뉴 카테고리 정의
  const menuCategories = [
    {
      title: '주요 기능',
      items: [
        { label: '홈', path: '/', icon: <FaHome /> },
        { label: '클럽 찾기', path: '/clubs', icon: <FaUsers /> },
        { label: '모임 목록', path: '/meetings', icon: <FaList /> },
        ...(isAuthenticated ? [
          { label: '내 모임', path: '/meetings/my', icon: <FaCalendarCheck />, requireAuth: true },
          { label: '기록 관리', path: '/mypage#records', icon: <FaClipboardList />, requireAuth: true },
          { label: '마이페이지', path: '/mypage', icon: <FaUser />, requireAuth: true },
        ] : []),
      ],
    },
    ...(isAuthenticated ? [{
      title: '클럽',
      items: [
        { label: '내 클럽 보기', path: '/clubs', icon: <FaUsers />, requireAuth: true },
        { label: '클럽 만들기', path: '/clubs/register', icon: <FaUserFriends />, requireAuth: true },
      ],
    }] : []),
    {
      title: '모임',
      items: [
        ...(isAuthenticated ? [
          { label: '라운딩 모임 만들기', path: '/meetings/rounding/create', icon: <FaGolfBall />, requireAuth: true },
          { label: '소셜 모임 만들기', path: '/meetings/social/create', icon: <FaCalendarPlus />, requireAuth: true },
        ] : []),
      ],
    },
    {
      title: '정보 및 설정',
      items: [
        { label: '공지사항', path: '/notices', icon: <FaFileAlt /> },
        { label: 'FAQ', path: '/faq', icon: <FaQuestionCircle /> },
        { label: '이용약관', path: '/terms', icon: <FaFileAlt /> },
        ...(isAuthenticated
          ? [{ label: '로그아웃', action: handleLogout, icon: <FaSignOutAlt />, isAction: true }]
          : []),
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">전체메뉴</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl font-bold p-2 -mr-2"
            aria-label="닫기"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* 메뉴 컨텐츠 - 스크롤 가능 영역 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {menuCategories.map((category, categoryIndex) => {
          // 로그인이 필요한 항목 필터링
          const visibleItems = category.items.filter(
            (item) => !item.requireAuth || isAuthenticated
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={categoryIndex} className="mb-6 last:mb-0">
              {/* 카테고리 제목 (선택사항 - 필요시 주석 해제) */}
              {/* <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 px-1">
                {category.title}
              </h3> */}
              
              {/* 메뉴 항목 리스트 */}
              <div className="space-y-0">
                {visibleItems.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <button
                      onClick={() => {
                        if (item.isAction) {
                          item.action();
                        } else {
                          handleMenuItemClick(item.path);
                        }
                      }}
                      className="w-full flex items-center px-1 py-3 sm:py-4 text-left text-sm sm:text-base text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <span className="mr-3 text-gray-600 flex-shrink-0">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                          {item.icon}
                        </span>
                      </span>
                      <span className="flex-1">{item.label}</span>
                    </button>
                    {/* 구분선 */}
                    {itemIndex < visibleItems.length - 1 && (
                      <div className="border-t border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 푸터 - 최하단 고정 */}
      <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 py-2.5 sm:py-3">
        <div className="text-center text-xs text-gray-500 px-4">
          <p>&copy; 2025 티업링크. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default FullMenu;
