import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaUsers, FaDollarSign, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaGolfBall, FaSync } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { roundsApi, socialsApi } from '../../lib/api';

const MyMeetingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // 모임 목록 조회
  const fetchMyMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 라운딩와 소셜 모임을 병렬로 조회
      const [roundsResponse, socialsResponse] = await Promise.all([
        roundsApi.getMyRounds(),
        socialsApi.getMySocials()
      ]);

      // 라운딩 데이터 변환
      const rounds = (roundsResponse.data || []).map(round => ({
        ...round,
        meeting_type: 'ROUND',
        meeting_time: round.meeting_time,
        participant_count: round.participant_count || 0
      }));

      // 소셜 데이터 변환
      const socials = (socialsResponse.data || []).map(social => ({
        ...social,
        meeting_type: 'SOCIAL',
        meeting_time: social.meeting_time,
        participant_count: social.participant_count || 0
      }));

      // 모든 모임을 합치고 시간순으로 정렬
      const allMeetings = [...rounds, ...socials].sort((a, b) => 
        new Date(a.meeting_time) - new Date(b.meeting_time)
      );

      setMeetings(allMeetings);
    } catch (err) {
      console.error('내 모임 조회 실패:', err);
      setError('모임 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyMeetings();
  }, []);

  const handleMeetingClick = (meeting) => {
    if (meeting.meeting_type === 'ROUND') {
      navigate(`/meetings/rounding/${meeting.id}`);
    } else {
      navigate(`/meetings/social/${meeting.id}`);
    }
  };

  const handleRefresh = () => {
    fetchMyMeetings();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { text: '예정', className: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { text: '진행중', className: 'bg-green-100 text-green-800' },
      COMPLETED: { text: '완료', className: 'bg-gray-100 text-gray-800' },
      CANCELED: { text: '취소', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.SCHEDULED;
    
    return (
      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getParticipationStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { text: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { text: '확정', className: 'bg-green-100 text-green-800' },
      CANCELED: { text: '취소', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      ORGANIZER: { text: '개설자', className: 'bg-purple-100 text-purple-800' },
      PARTICIPANT: { text: '참가자', className: 'bg-green-100 text-green-800' },
    };

    const config = roleConfig[role] || roleConfig.PARTICIPANT;
    
    return (
      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getMeetingTypeBadge = (type) => {
    const typeConfig = {
      ROUND: { text: '라운딩', className: 'bg-blue-100 text-blue-800' },
      SOCIAL: { text: '소셜', className: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || typeConfig.ROUND;
    
    return (
      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const formatMeetingTime = (meetingTime) => {
    try {
      if (!meetingTime) return meetingTime;
      // 백엔드에서 한국 시간으로 저장되어 있으므로 그대로 사용
      const date = new Date(meetingTime);
      if (Number.isNaN(date.getTime())) {
        console.warn('formatMeetingTime: Invalid date', meetingTime);
        return meetingTime;
      }
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (err) {
      console.error('formatMeetingTime error:', err, meetingTime);
      return meetingTime;
    }
  };

  const formatCost = (cost) => {
    if (!cost) return '미정';
    return `${cost.toLocaleString()}원`;
  };

  // 탭별 모임 필터링
  const getFilteredMeetings = () => {
    const now = new Date();
    
    switch (tabValue) {
      case 0: // 전체
        return meetings;
      case 1: // 예정된 모임
        return meetings.filter(meeting => 
          new Date(meeting.meeting_time) > now && 
          meeting.status === 'SCHEDULED'
        );
      case 2: // 진행 중인 모임
        return meetings.filter(meeting => 
          meeting.status === 'IN_PROGRESS'
        );
      case 3: // 완료된 모임
        return meetings.filter(meeting => 
          meeting.status === 'COMPLETED'
        );
      default:
        return meetings;
    }
  };

  const filteredMeetings = getFilteredMeetings();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-1.5 sm:mb-2">오류가 발생했습니다</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">내 모임</h1>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <FaSync className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">새로고침</span>
            </button>
          </div>

          {/* 탭 메뉴 */}
          <div className="border-b border-neutral-200 mb-4 sm:mb-6">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[
                { id: 0, label: '전체', count: meetings.length },
                { id: 1, label: '예정된 모임', count: meetings.filter(m => new Date(m.meeting_time) > new Date() && m.status === 'SCHEDULED').length },
                { id: 2, label: '진행 중', count: meetings.filter(m => m.status === 'IN_PROGRESS').length },
                { id: 3, label: '완료된 모임', count: meetings.filter(m => m.status === 'COMPLETED').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabValue(tab.id)}
                  className={`py-1.5 sm:py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    tabValue === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 모임 목록 */}
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-neutral-400 mb-3 sm:mb-4">
              <FaCalendarAlt className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-1.5 sm:mb-2">
              {tabValue === 0 ? '참여한 모임이 없습니다' :
               tabValue === 1 ? '예정된 모임이 없습니다' :
               tabValue === 2 ? '진행 중인 모임이 없습니다' :
               '완료된 모임이 없습니다'}
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
              {tabValue === 0 ? '아직 참여한 모임이 없습니다.' :
               tabValue === 1 ? '예정된 모임이 없습니다.' :
               tabValue === 2 ? '진행 중인 모임이 없습니다.' :
               '완료된 모임이 없습니다.'}
            </p>
            <button
              onClick={() => navigate('/meetings')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm rounded-lg transition-colors"
            >
              모임 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredMeetings.map((meeting) => (
              <div 
                key={meeting.id} 
                className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleMeetingClick(meeting)}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1 mb-1">
                        {meeting.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-500 line-clamp-1">{meeting.club_name}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 ml-2 sm:ml-4 flex-shrink-0">
                      {getMeetingTypeBadge(meeting.meeting_type)}
                      {getStatusBadge(meeting.status)}
                    </div>
                  </div>

                  {meeting.description && (
                    <p className="text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                      <FaCalendarAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">{formatMeetingTime(meeting.meeting_time)}</span>
                    </div>
                    
                    {meeting.location && (
                      <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                        <FaMapMarkerAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{meeting.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                      <FaUsers className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span>{meeting.participant_count}/{meeting.max_participants}명</span>
                    </div>
                  </div>

                  {meeting.meeting_type === 'ROUND' && (
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {meeting.course_name && (
                        <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                          <FaGolfBall className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span className="line-clamp-1">{meeting.course_name}</span>
                        </div>
                      )}
                      
                      {meeting.total_cost && (
                        <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                          <FaDollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span>총 비용: {formatCost(meeting.total_cost)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {meeting.meeting_type === 'SOCIAL' && (
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {meeting.social_cost && (
                        <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                          <FaDollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span>소셜 비용: {formatCost(meeting.social_cost)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 참여 정보 */}
                  {meeting.my_participation && (
                    <div className="flex items-center justify-between mb-3 sm:mb-4 p-2.5 sm:p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-neutral-700">내 참여:</span>
                        {getParticipationStatusBadge(meeting.my_participation.status)}
                        {getRoleBadge(meeting.my_participation.role)}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-neutral-400">
                      {new Date(meeting.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="text-primary-600 font-medium text-xs sm:text-sm">
                      자세히 보기 →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMeetingsPage;
