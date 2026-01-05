import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaGolfBall, FaExclamationCircle, FaCheckCircle, FaEdit, FaTimes } from 'react-icons/fa';
import { usersApi, roundsApi } from '../../lib/api';
import SimpleScoreInputModal from '../../components/meetings/SimpleScoreInputModal';
import RoundingStatsCard from '../../components/profile/RoundingStatsCard';
import { useAuth } from '../../hooks/useAuth';

const RecordsTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [scoreStatus, setScoreStatus] = useState('all'); // all, missing, completed
  const [page, setPage] = useState(1);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);

  const limit = 10;

  // 라운딩 통계 조회
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['user-rounding-stats'],
    queryFn: () => usersApi.getRoundingStats(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 라운딩 종료된 모임 목록 조회
  const {
    data: meetingsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-rounding-meetings', scoreStatus, page],
    queryFn: () => usersApi.getMyRoundingMeetings({
      score_status: scoreStatus,
      page,
      limit
    }),
    retry: false
  });

  // 사용자 프로필 조회 (핸디캡 정보용)
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getMyProfile,
    enabled: !!user?.id
  });

  // 핸디캡 정보 조회
  const userId = userProfile?.id || (userProfile?.data && userProfile.data.id) || user?.id;
  const { data: handicapResponse } = useQuery({
    queryKey: ['user-handicap', userId],
    queryFn: () => usersApi.getUserHandicap(userId),
    enabled: !!userId,
    retry: false
  });

  const handicapInfo = handicapResponse?.data || handicapResponse || {
    calculated_handicap: null,
    initial_handicap: null
  };

  const currentHandicap = handicapInfo?.calculated_handicap ?? handicapInfo?.initial_handicap ?? null;

  const meetings = meetingsData?.data || [];
  const total = meetingsData?.total || 0;
  const totalPages = meetingsData?.total_pages || 0;

  // 미입력 모임과 입력 완료 모임 분리
  const missingMeetings = meetings.filter(m => !m.has_score);
  const completedMeetings = meetings.filter(m => m.has_score);

  // 점수 입력 모달 열기
  const handleOpenScoreModal = async (meeting) => {
    // 참가자 ID 조회 필요 (현재는 meeting_id만 있으므로 API 호출 필요)
    try {
      const participants = await roundsApi.getRoundParticipants(meeting.meeting_id);
      const participantList = Array.isArray(participants) ? participants : (participants?.data || []);
      const myParticipant = participantList.find(p => p.user_id === user?.id);
      
      if (myParticipant) {
        setSelectedParticipantId(myParticipant.id);
        setSelectedMeeting(meeting);
        setShowScoreModal(true);
      } else {
        alert('참가자 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('참가자 조회 실패:', err);
      alert('참가자 정보를 불러오는데 실패했습니다.');
    }
  };

  // 점수 입력 성공 후 처리
  const handleScoreInputSuccess = () => {
    setShowScoreModal(false);
    setSelectedMeeting(null);
    setSelectedParticipantId(null);
    // 쿼리 캐시 무효화 및 재조회
    queryClient.invalidateQueries(['user-rounding-meetings']);
    refetch();
  };

  // 상세 입력/수정 준비중 모달 표시
  const handleGoToDetailInput = () => {
    setShowComingSoonModal(true);
  };

  // 모임 카드 렌더링
  const renderMeetingCard = (meeting, isCompleted = false) => {
    return (
      <div
        key={meeting.meeting_id}
        className={`rounded-xl border p-3 sm:p-4 ${
          isCompleted
            ? 'border-neutral-200 bg-white'
            : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 
              className="text-base sm:text-lg font-semibold text-neutral-900 mb-1 cursor-pointer hover:text-primary-600 transition-colors"
              onClick={() => navigate(`/meetings/rounding/${meeting.meeting_id}`)}
            >
              {meeting.meeting_name}
            </h3>
            <p className="text-sm text-neutral-600 mb-2">{meeting.club_name}</p>
            <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
              <span>
                경기일: {format(new Date(meeting.meeting_time), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
              <span>•</span>
              <span>
                종료일: {format(new Date(meeting.rounding_completed_at), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>
            {isCompleted && (
              <div className="mt-3 flex items-center gap-4">
                <div>
                  <span className="text-xs text-neutral-500">라운딩 스코어</span>
                  <p className="text-lg font-bold text-neutral-900">{meeting.gross_score}</p>
                </div>
                {currentHandicap !== null && (
                  <div>
                    <span className="text-xs text-neutral-500">업데이트된 핸디캡</span>
                    <p className="text-lg font-bold text-emerald-600">{parseFloat(currentHandicap).toFixed(1)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {!isCompleted ? (
            <>
              <button
                onClick={() => handleOpenScoreModal(meeting)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <FaGolfBall className="h-4 w-4" />
                점수 입력
              </button>
              <button
                onClick={() => handleGoToDetailInput(meeting.meeting_id)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                상세 입력
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleOpenScoreModal(meeting)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <FaEdit className="h-4 w-4" />
                수정
              </button>
              <button
                onClick={() => handleGoToDetailInput(meeting.meeting_id)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-primary-300 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
              >
                상세 수정
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center text-red-600">
          <FaTimes className="mx-auto h-12 w-12 mb-4" />
          <p>기록 정보를 불러오는데 실패했습니다.</p>
          <p className="text-sm mt-2">{error?.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 통계 카드 섹션 */}
      <RoundingStatsCard
        stats={statsData?.data || statsData}
        isLoading={statsLoading}
        error={statsError}
      />

      {/* 필터 버튼 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => {
            setScoreStatus('all');
            setPage(1);
          }}
          className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            scoreStatus === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => {
            setScoreStatus('missing');
            setPage(1);
          }}
          className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            scoreStatus === 'missing'
              ? 'bg-red-600 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
          }`}
        >
          미입력 ({missingMeetings.length})
        </button>
        <button
          onClick={() => {
            setScoreStatus('completed');
            setPage(1);
          }}
          className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            scoreStatus === 'completed'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
          }`}
        >
          입력완료 ({completedMeetings.length})
        </button>
      </div>

      {/* 미입력 모임 섹션 (scoreStatus가 'all' 또는 'missing'일 때) */}
      {(scoreStatus === 'all' || scoreStatus === 'missing') && missingMeetings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FaExclamationCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">점수 입력 대기</h2>
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
              {missingMeetings.length}
            </span>
          </div>
          <div className="space-y-3">
            {missingMeetings.map((meeting) => renderMeetingCard(meeting, false))}
          </div>
        </div>
      )}

      {/* 입력 완료 기록 섹션 (scoreStatus가 'all' 또는 'completed'일 때) */}
      {(scoreStatus === 'all' || scoreStatus === 'completed') && completedMeetings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FaCheckCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">기록 내역</h2>
          </div>
          <div className="space-y-3">
            {completedMeetings.map((meeting) => renderMeetingCard(meeting, true))}
          </div>
        </div>
      )}

      {/* 데이터 없음 */}
      {meetings.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
          <FaGolfBall className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-neutral-600">
            {scoreStatus === 'missing'
              ? '점수 입력이 필요한 모임이 없습니다.'
              : scoreStatus === 'completed'
              ? '입력 완료된 기록이 없습니다.'
              : '라운딩 종료된 모임이 없습니다.'}
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
          >
            이전
          </button>
          <span className="px-4 py-2 text-neutral-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
          >
            다음
          </button>
        </div>
      )}

      {/* 간단 점수 입력 모달 */}
      {selectedMeeting && selectedParticipantId && (
        <SimpleScoreInputModal
          isOpen={showScoreModal}
          onClose={() => {
            setShowScoreModal(false);
            setSelectedMeeting(null);
            setSelectedParticipantId(null);
          }}
          meetingId={selectedMeeting.meeting_id}
          participantId={selectedParticipantId}
          currentHandicap={currentHandicap}
          onSuccess={handleScoreInputSuccess}
        />
      )}

      {/* 준비중 모달 */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-neutral-900">준비중</h2>
              <button
                type="button"
                onClick={() => setShowComingSoonModal(false)}
                className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="px-6 py-6 text-center">
              <div className="mb-4">
                <FaGolfBall className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
              </div>
              <p className="text-lg font-semibold text-neutral-800 mb-2">
                이 기능은 현재 준비중입니다
              </p>
              <p className="text-neutral-600 mb-6">
                상세 점수 입력 기능은 곧 제공될 예정입니다.
              </p>

              {/* 닫기 버튼 */}
              <button
                type="button"
                onClick={() => setShowComingSoonModal(false)}
                className="w-full rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsTab;
