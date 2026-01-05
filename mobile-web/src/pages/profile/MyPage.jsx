import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoginRequired from '../../components/LoginRequired';
import OverviewTab from './OverviewTab';
import MyMeetingsTab from './MyMeetingsTab';
import RecordsTab from './RecordsTab';
import NotificationsTab from './NotificationsTab';
import UserProfileEditTab from './UserProfileEditTab';
import DeleteAccountTab from './DeleteAccountTab';

const MyPage = () => {
  const { isAuthenticated } = useAuth();

  // URL 해시에서 초기 탭 설정
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['overview', 'meetings', 'records', 'notifications', 'edit', 'withdraw'];
    return validTabs.includes(hash) ? hash : 'overview'; // 기본값: 'overview'
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // 해시 변경 감지 (브라우저 뒤로가기/앞으로가기)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['overview', 'meetings', 'records', 'notifications', 'edit', 'withdraw'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      } else {
        // 유효하지 않은 해시인 경우 기본값으로 설정
        setActiveTab('overview');
        window.location.hash = 'overview';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 초기 로드 시 해시가 없으면 기본값 설정
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = 'overview';
      setActiveTab('overview');
    }
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <LoginRequired
        message="로그인 후 이용 가능합니다"
        description="마이페이지를 사용하려면 로그인이 필요합니다."
      />
    );
  }

  // 탭 메뉴 정의
  const tabs = [
    { id: 'overview', label: '개요' },
    { id: 'meetings', label: '내 참여내역' },
    { id: 'records', label: '기록' },
    { id: 'notifications', label: '알림' },
    { id: 'edit', label: '회원정보 수정' },
    { id: 'withdraw', label: '회원탈퇴' },
  ];

  // 탭별 컴포넌트 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'meetings':
        return <MyMeetingsTab />;
      case 'records':
        return <RecordsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'edit':
        return <UserProfileEditTab />;
      case 'withdraw':
        return <DeleteAccountTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="container-main py-6 px-4 sm:px-6 md:px-8">
        {/* 탭 메뉴 - 모바일 퍼스트 */}
        <div className="mb-6">
          {/* 모바일: 상단 탭 (가로 스크롤 가능) */}
          <div className="flex overflow-x-auto space-x-2 pb-2 md:hidden -mx-4 px-4 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 min-w-[90px] py-3 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 태블릿/데스크톱: 상단 탭 */}
          <div className="hidden md:flex md:space-x-2 lg:space-x-4 md:border-b md:border-neutral-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-neutral-700 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MyPage;

