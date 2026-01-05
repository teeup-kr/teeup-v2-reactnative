import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clubsApi } from '../../lib/clubsApi';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaUsers, FaCalendarAlt, FaGolfBall, FaMoneyBillWave, FaChartLine, FaTrophy, FaClock } from 'react-icons/fa';

const ClubActivitiesPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 클럽 정보 조회
  const {
    data: club,
    isLoading: clubLoading,
    error: clubError
  } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => clubsApi.getClub(clubId),
    enabled: !!clubId,
  });

  // 클럽 멤버 목록 조회 (권한 확인용)
  const {
    data: membersData
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

  if (clubLoading || summaryLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">활동내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club || !membersData || !clubSummary) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">활동내역을 불러올 수 없습니다.</p>
          <button
            onClick={() => navigate(`/clubs/${clubId}/manage`)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            클럽 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 권한 확인
  const isLeader = membersData.members?.some(member => 
    member.user_id === user?.id && member.role === 'LEADER'
  ) || false;
  
  const isManager = membersData.members?.some(member => 
    member.user_id === user?.id && member.role === 'MANAGER'
  ) || false;

  if (!isLeader && !isManager) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">클럽 활동내역 조회 권한이 없습니다.</p>
          <button
            onClick={() => navigate(`/clubs/${clubId}/manage`)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            클럽 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: '총 회원 수',
      value: clubSummary.total_members,
      unit: '명',
      icon: <FaUsers className="text-blue-600" />,
      color: 'blue'
    },
    {
      title: '이번 달 모임',
      value: clubSummary.monthly_meetings,
      unit: '회',
      icon: <FaCalendarAlt className="text-green-600" />,
      color: 'green'
    },
    {
      title: '총 모임 수',
      value: clubSummary.total_meetings,
      unit: '회',
      icon: <FaGolfBall className="text-purple-600" />,
      color: 'purple'
    },
    {
      title: '이번 달 수익',
      value: clubSummary.monthly_revenue,
      unit: '원',
      icon: <FaMoneyBillWave className="text-yellow-600" />,
      color: 'yellow'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'meeting',
      title: '정기 라운딩 모임',
      description: '15명이 참가한 라운딩 모임이 완료되었습니다.',
      date: '2024-01-15',
      time: '14:30',
      participants: 15,
      revenue: 450000
    },
    {
      id: 2,
      type: 'member',
      title: '새 회원 가입',
      description: '김철수님이 클럽에 가입했습니다.',
      date: '2024-01-14',
      time: '10:20',
      participants: 1,
      revenue: 0
    },
    {
      id: 3,
      type: 'meeting',
      title: '소셜 모임',
      description: '8명이 참가한 소셜 모임이 완료되었습니다.',
      date: '2024-01-12',
      time: '19:00',
      participants: 8,
      revenue: 120000
    },
    {
      id: 4,
      type: 'member',
      title: '회원 탈퇴',
      description: '이영희님이 클럽을 탈퇴했습니다.',
      date: '2024-01-10',
      time: '16:45',
      participants: -1,
      revenue: 0
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <FaGolfBall className="text-green-600" />;
      case 'member':
        return <FaUsers className="text-blue-600" />;
      default:
        return <FaChartLine className="text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'meeting':
        return 'bg-green-50 border-green-200';
      case 'member':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-neutral-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/clubs/${clubId}/manage`)}
                className="mr-4 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <FaArrowLeft className="h-5 w-5 text-neutral-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">
                  클럽 활동내역
                </h1>
                <p className="text-sm text-neutral-600">
                  {club.name}의 활동 통계 및 최근 이벤트
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stat.value.toLocaleString()}
                    <span className="text-sm font-normal text-neutral-500 ml-1">
                      {stat.unit}
                    </span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              최근 활동
            </h2>
            <p className="text-sm text-neutral-600">
              클럽의 최근 활동 내역을 확인하세요
            </p>
          </div>
          
          <div className="divide-y divide-neutral-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className={`p-6 ${getActivityColor(activity.type)}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-neutral-900">
                        {activity.title}
                      </h3>
                      <div className="flex items-center text-xs text-neutral-500">
                        <FaClock className="mr-1" />
                        {activity.date} {activity.time}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center text-xs text-neutral-500">
                        <FaUsers className="mr-1" />
                        참가자 {activity.participants > 0 ? '+' : ''}{activity.participants}명
                      </div>
                      {activity.revenue > 0 && (
                        <div className="flex items-center text-xs text-neutral-500">
                          <FaMoneyBillWave className="mr-1" />
                          수익 {activity.revenue.toLocaleString()}원
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 추가 통계 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월별 모임 통계 */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              월별 모임 통계
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">1월</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">3회</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">12월</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">4회</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">11월</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">2회</span>
                </div>
              </div>
            </div>
          </div>

          {/* 회원 활동도 */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              회원 활동도
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">매우 활발</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">18명</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">활발</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">12명</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">보통</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">8명</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubActivitiesPage;
