import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaGolfBall } from 'react-icons/fa';
import { usersApi } from '../../lib/api';

const MyMeetingsTab = () => {
  const navigate = useNavigate();
  
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'ROUND', 'SOCIAL'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  // API 파라미터 구성
  const queryParams = {
    page,
    limit,
    ...(typeFilter !== 'all' && { meeting_type_filter: typeFilter }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
  };

  // 모임 목록 조회
  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['my-meetings', typeFilter, startDate, endDate, page],
    queryFn: async () => {
      const response = await usersApi.getMyMeetings(queryParams);
      console.log('🔍 MyMeetingsTab API 응답:', response);
      const result = response || { data: [], total: 0, page: 1, limit: 5, total_pages: 1 };
      console.log('🔍 MyMeetingsTab 파싱된 결과:', result);
      return result;
    },
  });

  const meetings = meetingsResponse?.data || [];
  const totalPages = meetingsResponse?.total_pages || 1;
  
  console.log('🔍 MyMeetingsTab meetings:', meetings);
  console.log('🔍 MyMeetingsTab totalPages:', totalPages);

  // 날짜 포맷팅
  const formatMeetingTime = (meetingTime) => {
    try {
      if (!meetingTime) return meetingTime;
      const date = new Date(meetingTime);
      if (Number.isNaN(date.getTime())) {
        return meetingTime;
      }
      return format(date, 'MM월 dd일 HH:mm', { locale: ko });
    } catch (err) {
      console.error('formatMeetingTime error:', err, meetingTime);
      return meetingTime;
    }
  };

  // 과거 날짜인지 확인
  const isPastDateTime = (value) => {
    if (!value) return false;
    try {
      return new Date(value).getTime() <= Date.now();
    } catch {
      return false;
    }
  };

  // 상태 배지 (MeetingListPage의 getStatusBadge 함수 재사용)
  const getStatusBadge = (meeting) => {
    const status = meeting?.status;
    const participantCount = meeting?.participant_count || 0;
    const applicationDeadline = meeting?.application_deadline;
    const applicationClosedEarly = meeting?.application_closed_early || false;
    const meetingType = meeting?.meeting_type;
    const isRoundingMeeting = meetingType === 'ROUND';
    const meetingTime = meeting?.meeting_time;
    
    // 최소 인원 미달 체크
    const isMinParticipantsNotMet = isRoundingMeeting
      ? participantCount >= 1 && participantCount <= 3
      : participantCount === 1;
    
    // 마감 기한 지났는지 체크
    const isDeadlinePassed = applicationDeadline ? isPastDateTime(applicationDeadline) : false;
    const isApplicationClosed = isDeadlinePassed || applicationClosedEarly;

    // 모임 완료 여부 체크
    const isMeetingTimePassed = meetingTime ? isPastDateTime(meetingTime) : false;
    const isMeetingCompleted = 
      meeting?.is_completed === true || 
      meeting?.status === 'COMPLETED' || 
      isMeetingTimePassed;

    // 취소 상태 판단
    const isCanceled = 
      status === 'CANCELED' ||
      (status === 'SCHEDULED' && isApplicationClosed && isMinParticipantsNotMet);

    // 취소 상태는 취소 배지만 표시
    if (isCanceled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          취소
        </span>
      );
    }

    // 종료 상태는 단일 배지만 표시
    if (meeting?.settlement_confirmed === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          종료
        </span>
      );
    }

    // 라운딩 모임에서 meeting_time이 지났는데 rounding_completed_at이 없는 경우 "미진행" 배지 표시
    if (isRoundingMeeting && isMeetingTimePassed && !meeting?.rounding_completed_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          미진행
        </span>
      );
    }

    // 진행중 상태
    if (status === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          진행중
        </span>
      );
    }

    if (meeting?.settlement_confirmed === false && meeting?.teams?.length > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          완료
        </span>
      );
    }

    // 모집마감 상태 판단
    const isApplicationClosedStatus = status === 'SCHEDULED' && isApplicationClosed && !isMinParticipantsNotMet;

    // 모집마감 또는 예정 상태에서 모집마감/모임완료 배지 표시
    return (
      <>
        {isApplicationClosedStatus && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            모집마감
          </span>
        )}
        {isMeetingCompleted && !isCanceled && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            모임완료
          </span>
        )}
        {!isApplicationClosedStatus && !isMeetingCompleted && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            예정
          </span>
        )}
      </>
    );
  };

  // 모임 타입 배지
  const getMeetingTypeBadge = (type) => {
    const typeConfig = {
      ROUND: { text: '라운딩', className: 'bg-blue-100 text-blue-800' },
      SOCIAL: { text: '소셜', className: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || typeConfig.ROUND;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // 역할 배지
  const getRoleBadge = (role) => {
    const roleConfig = {
      ORGANIZER: { text: '주최자', className: 'bg-purple-100 text-purple-800' },
      PARTICIPANT: { text: '참가자', className: 'bg-green-100 text-green-800' },
    };

    const config = roleConfig[role] || roleConfig.PARTICIPANT;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // 모임 클릭 핸들러
  const handleMeetingClick = (meeting) => {
    if (meeting.meeting_type === 'ROUND') {
      navigate(`/meetings/rounding/${meeting.id}`);
    } else {
      navigate(`/meetings/social/${meeting.id}`);
    }
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // 필터가 적용되었는지 확인
  const hasActiveFilters = () => {
    return typeFilter !== 'all' || startDate || endDate;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">모임 목록을 불러오는데 실패했습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-3 sm:p-4">
        {/* 타입 필터 탭 */}
        <div className="mb-3 sm:mb-4">
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            <button
              onClick={() => { setTypeFilter('all'); setPage(1); }}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => { setTypeFilter('ROUND'); setPage(1); }}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                typeFilter === 'ROUND'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              라운딩
            </button>
            <button
              onClick={() => { setTypeFilter('SOCIAL'); setPage(1); }}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                typeFilter === 'SOCIAL'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              소셜
            </button>
          </div>
        </div>

        {/* 날짜 필터 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
              종료일
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* 필터 초기화 버튼 */}
        {hasActiveFilters() && (
          <button
            onClick={handleResetFilters}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 모임 목록 */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 sm:p-12 text-center">
          <FaGolfBall className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-neutral-600 text-sm sm:text-base mb-2">참가한 모임이 없습니다.</p>
          <p className="text-neutral-500 text-xs sm:text-sm">모임에 참가하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleMeetingClick(meeting)}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1 mb-1">
                        {meeting.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-500">{meeting.club_name}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 sm:ml-4 flex-shrink-0">
                      {getMeetingTypeBadge(meeting.meeting_type)}
                      {getStatusBadge(meeting)}
                    </div>
                  </div>

                  {meeting.description && (
                    <p className="text-neutral-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-3 sm:mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                      <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                      <span>{formatMeetingTime(meeting.meeting_time)}</span>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                        <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{meeting.location}</span>
                      </div>
                    )}
                    {meeting.my_role && (
                      <div className="flex items-center">
                        {getRoleBadge(meeting.my_role)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <span className="px-3 py-2 text-xs sm:text-sm text-neutral-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyMeetingsTab;
