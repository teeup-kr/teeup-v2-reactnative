import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clubsApi } from '../../lib';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaChevronRight, FaUsers, FaBell, FaFileAlt, FaMoneyBillWave, FaChartBar } from 'react-icons/fa';

const ClubManagePage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 클럽 상세 정보 조회
  const {
    data: club,
    isLoading: clubLoading,
    error: clubError
  } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => clubsApi.getClub(clubId),
    enabled: !!clubId,
  });

  // 클럽 멤버 목록 조회
  const {
    data: membersData,
    isLoading: membersLoading
  } = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: () => clubsApi.getClubMembers(clubId),
    enabled: !!clubId,
  });

  // 클럽 요약 정보 조회
  const {
    data: clubSummary,
    isLoading: summaryLoading
  } = useQuery({
    queryKey: ['club-summary', clubId],
    queryFn: () => clubsApi.getClubSummary(clubId),
    enabled: !!clubId,
  });

  if (clubLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-neutral-600">클럽 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm sm:text-base text-error-600 mb-3 sm:mb-4">클럽 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => navigate('/clubs')}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
          >
            클럽 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 권한 확인 (ClubDetailPage와 동일한 로직)
  // membersData에서 직접 권한 확인
  const isLeader = membersData?.members?.some(member => 
    member.user_id === user?.id && member.role === 'LEADER'
  ) || false;
  
  const isManager = membersData?.members?.some(member => 
    member.user_id === user?.id && member.role === 'MANAGER'
  ) || false;
  
  // 클럽 API 응답의 membership_role도 체크 (fallback)
  const isLeaderFromClub = club.membership_role === 'LEADER';
  const isManagerFromClub = club.membership_role === 'MANAGER';
  
  // 최종 권한: membersData 우선, 없으면 club.membership_role 사용
  const hasLeaderRole = isLeader || isLeaderFromClub;
  const hasManagerRole = isManager || isManagerFromClub;

  if (!hasLeaderRole && !hasManagerRole) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm sm:text-base text-error-600 mb-3 sm:mb-4">클럽 관리 권한이 없습니다.</p>
          <button
            onClick={() => navigate(`/clubs/${clubId}`)}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
          >
            클럽 상세로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const managementItems = [
    {
      title: '클럽 멤버 목록',
      description: '클럽 멤버 확인 및 관리',
      icon: FaUsers,
      onClick: () => navigate(`/clubs/${club?.display_id || clubId}/members`),
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: '공지사항 관리',
      description: '클럽 공지사항 작성 및 관리',
      icon: FaBell,
      onClick: () => navigate(`/clubs/${club?.display_id || clubId}/notices`),
      color: 'text-green-600 bg-green-100'
    },
    {
      title: '클럽 규정 관리',
      description: '클럽 규정 작성 및 관리',
      icon: FaFileAlt,
      onClick: () => navigate(`/clubs/${club?.display_id || clubId}/regulations`),
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: '회비 관리',
      description: '클럽 회비 항목 관리',
      icon: FaMoneyBillWave,
      onClick: () => navigate(`/clubs/${club?.display_id || clubId}/fees`),
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: '클럽 통계',
      description: '클럽 활동 통계 및 분석',
      icon: FaChartBar,
      onClick: () => navigate(`/clubs/${club?.display_id || clubId}/stats`),
      color: 'text-indigo-600 bg-indigo-100'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate(`/clubs/${club?.display_id || clubId}`)}
                className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">클럽 상세</span>
              </button>
            </div>
          </div>

          {/* 클럽 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt={club.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 line-clamp-1">{club.name}</h1>
                <p className="text-xs sm:text-sm text-neutral-600">클럽 관리</p>
              </div>
            </div>

            {/* 클럽 요약 정보 */}
            {clubSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{clubSummary.total_members || 0}</div>
                  <div className="text-xs sm:text-sm text-blue-800">총 멤버</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{clubSummary.active_meetings || 0}</div>
                  <div className="text-xs sm:text-sm text-green-800">진행 중인 모임</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">{clubSummary.total_notices || 0}</div>
                  <div className="text-xs sm:text-sm text-purple-800">공지사항</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">{clubSummary.total_regulations || 0}</div>
                  <div className="text-xs sm:text-sm text-yellow-800">규정</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 관리 메뉴 */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-3 sm:mb-4">관리 메뉴</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {managementItems.map((item, index) => (
              <div
                key={index}
                onClick={item.onClick}
                className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-0.5 sm:mb-1 line-clamp-1">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 line-clamp-1">{item.description}</p>
                  </div>
                  <FaChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        {clubSummary?.recent_activities && clubSummary.recent_activities.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-3 sm:mb-4">최근 활동</h2>
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {clubSummary.recent_activities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-2 sm:space-x-4 py-2 border-b border-neutral-100 last:border-b-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary-600">{activity.type}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-neutral-900 line-clamp-1">{activity.description}</p>
                      <p className="text-xs text-neutral-500">{new Date(activity.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubManagePage;
