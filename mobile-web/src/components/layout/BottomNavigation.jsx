import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FaBars, FaHome, FaUsers, FaCalendarAlt, FaUser } from 'react-icons/fa';

const BottomNavigation = ({ onMenuClick }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    {
      type: 'button',
      onClick: onMenuClick,
      icon: <FaBars className="w-6 h-6 md:w-5 md:h-5" />,
      label: '전체',
      isActive: false
    },
    {
      type: 'link',
      path: '/',
      icon: <FaHome className="w-6 h-6 md:w-5 md:h-5" />,
      label: '홈',
      isActive: location.pathname === '/'
    },
    {
      type: 'link',
      path: '/clubs',
      icon: <FaUsers className="w-6 h-6 md:w-5 md:h-5" />,
      label: '클럽',
      isActive: location.pathname.startsWith('/clubs')
    },
    {
      type: 'link',
      path: '/meetings',
      icon: <FaCalendarAlt className="w-6 h-6 md:w-5 md:h-5" />,
      label: '모임',
      isActive: location.pathname.startsWith('/meetings')
    },
    {
      type: 'link',
      path: isAuthenticated ? '/mypage' : '/login',
      icon: <FaUser className="w-6 h-6 md:w-5 md:h-5" />,
      label: '마이',
      isActive: location.pathname.startsWith('/mypage') || location.pathname.startsWith('/login')
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-center md:justify-center py-1.5 sm:py-2 md:py-1">
        <div className="flex items-center justify-around w-full md:w-auto md:gap-8">
        {navItems.map((item, index) => (
          item.type === 'button' ? (
            <button
              key={index}
              onClick={item.onClick}
              className="flex flex-col items-center py-1.5 sm:py-2 px-1 min-w-0 flex-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <div className="text-gray-500">{item.icon}</div>
              {item.label && (
                <span className="text-[10px] sm:text-xs md:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                  {item.label}
                </span>
              )}
            </button>
          ) : (
            <Link
              key={index}
              to={item.path}
              className={`flex flex-col items-center py-1.5 sm:py-2 px-1 min-w-0 flex-1 ${
                item.isActive
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              <div className={`${item.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                {item.icon}
              </div>
              {item.label && (
                <span className="text-[10px] sm:text-xs md:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                  {item.label}
                </span>
              )}
            </Link>
          )
        ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
