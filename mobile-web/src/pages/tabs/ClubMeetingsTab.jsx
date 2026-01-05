import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clubsApi } from '../../lib';
import { FaCalendarAlt, FaUsers, FaMapMarkerAlt, FaClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ClubMeetingsTab = ({ club, canManage = false }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  // 모임 목록 조회 (페이지네이션 적용)
  const {
    data: meetingsData,
    isLoading: meetingsLoading,
    error: meetingsError
  } = useQuery({
    queryKey: ['club-meetings', club.id, currentPage],
    queryFn: () => clubsApi.getClubMeetings(club.id, { page: currentPage, limit }),
    enabled: !!club.id,
  });

  const allMeetings = meetingsData?.data || [];
  const totalPages = meetingsData?.total_pages || 1;

  // 예정된 모임만 필터링
  const filterScheduledMeetings = (meetings) => {
    const now = new Date();
    return meetings.filter(meeting => {
      // 상태 체크: SCHEDULED인 것만
      if (meeting.status !== 'SCHEDULED') {
        return false;
      }
      
      // 예정일 체크: 아직 지나지 않은 모임만
      if (!meeting.meeting_time || new Date(meeting.meeting_time) <= now) {
        return false;
      }
      
      return true;
    });
  };

  const meetings = filterScheduledMeetings(allMeetings);

  const handleViewAllMeetings = () => {
    navigate('/meetings#rounding');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getMeetingStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { text: '예정', className: 'bg-blue-100 text-blue-800' },
      PLANNING: { text: '계획 중', className: 'bg-blue-100 text-blue-800' },
      RECRUITING: { text: '모집 중', className: 'bg-green-100 text-green-800' },
      CONFIRMED: { text: '확정', className: 'bg-purple-100 text-purple-800' },
      IN_PROGRESS: { text: '진행 중', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { text: '완료', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { text: '취소', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.SCHEDULED;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getMeetingTypeBadge = (type) => {
    const typeConfig = {
      ROUNDING: { text: '라운딩', className: 'bg-blue-100 text-blue-800' },
      SOCIAL: { text: '소셜', className: 'bg-green-100 text-green-800' },
      EVENT: { text: '이벤트', className: 'bg-purple-100 text-purple-800' }
    };

    const config = typeConfig[type] || typeConfig.ROUNDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (meetingsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (meetingsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-error-600 mb-4">
            <FaCalendarAlt className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">모임을 불러올 수 없습니다</h3>
          <p className="text-neutral-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">모임</h3>
        <button
          onClick={handleViewAllMeetings}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <span>모임 전체보기</span>
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <FaCalendarAlt className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">현재 예정된 모임이 없습니다</h3>
          <p className="text-neutral-600 mb-4">예정된 모임이 없습니다. 전체 목록을 확인해 보세요.</p>
          <button
            onClick={handleViewAllMeetings}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            모임 전체보기
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-2">{meeting.name}</h4>
                    <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{meeting.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {getMeetingTypeBadge(meeting.meeting_type)}
                    {getMeetingStatusBadge(meeting.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <FaCalendarAlt className="h-4 w-4" />
                    <span>{meeting.meeting_time ? new Date(meeting.meeting_time).toLocaleDateString('ko-KR') : '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <FaClock className="h-4 w-4" />
                    <span>{meeting.meeting_time ? new Date(meeting.meeting_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <FaMapMarkerAlt className="h-4 w-4" />
                    <span>{meeting.location || meeting.course_name || '-'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
                    <div className="flex items-center space-x-1">
                      <FaUsers className="h-4 w-4" />
                      <span>{meeting.participant_count || 0}/{meeting.max_participants || 0}명</span>
                    </div>
                    {meeting.course_name && (
                      <span>{meeting.course_name}</span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {meeting.created_at ? new Date(meeting.created_at).toLocaleDateString('ko-KR') : '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg border ${
                  currentPage === 1
                    ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <FaChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {(() => {
                // 표시할 페이지 번호 계산 (5개씩 정렬)
                const pageNumbers = [];
                
                if (totalPages <= 5) {
                  // 5개 이하면 모두 표시
                  for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                  }
                } else {
                  // 6개 이상: 항상 5개씩 표시 (5의 배수 단위로 그룹화)
                  // 현재 페이지가 속한 5의 배수 그룹 계산
                  // 예: 4페이지면 1-5 그룹, 6페이지면 6-10 그룹
                  const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                  const groupEnd = Math.min(groupStart + 4, totalPages);
                  
                  for (let i = groupStart; i <= groupEnd; i++) {
                    pageNumbers.push(i);
                  }
                }
                  
                  return pageNumbers.map((pageNum) => {
                    const isValidPage = pageNum >= 1 && pageNum <= totalPages;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          // 존재하지 않는 페이지 클릭 방지
                          if (!isValidPage) return;
                          handlePageChange(pageNum);
                        }}
                        disabled={!isValidPage}
                        className={`px-3 py-2 rounded-lg border ${
                          !isValidPage
                            ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                            : currentPage === pageNum
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg border ${
                  currentPage === totalPages
                    ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <FaChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default ClubMeetingsTab;
