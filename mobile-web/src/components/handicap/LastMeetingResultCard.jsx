import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaTrophy, FaCalendarAlt, FaGolfBall, FaChartLine, FaMedal, FaInfoCircle } from 'react-icons/fa';
import { usersApi } from '../../lib/api';

const LastMeetingResultCard = ({ userId }) => {
  const { data: lastResult, isLoading, error } = useQuery({
    queryKey: ['last-meeting-result', userId],
    queryFn: () => usersApi.getLastMeetingResult(userId),
    enabled: !!userId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="flex items-center justify-center h-24 sm:h-32">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="text-center text-neutral-500 text-xs sm:text-sm">
          직전 대회 성적을 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  if (!lastResult || !lastResult.data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
            <FaTrophy className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            직전 대회 성적
          </h3>
        </div>
        <div className="text-center py-6 sm:py-8 text-neutral-500">
          <FaInfoCircle className="mx-auto mb-2 h-10 w-10 sm:text-4xl text-neutral-300" />
          <p className="text-xs sm:text-sm">직전 대회 기록이 없습니다.</p>
          <p className="text-[10px] sm:text-xs mt-1 text-neutral-400">경기를 완료하면 성적이 표시됩니다.</p>
        </div>
      </div>
    );
  }

  const resultData = lastResult.data || lastResult;
  const completedDate = resultData.completed_at 
    ? format(new Date(resultData.completed_at), 'yyyy년 MM월 dd일', { locale: ko })
    : '';

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
          <FaTrophy className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          직전 대회 성적
        </h3>
        {resultData.rank && (
          <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border text-xs sm:text-sm font-semibold flex items-center ${getRankBadgeColor(resultData.rank)}`}>
            <FaMedal className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {resultData.rank}위
          </div>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* 모임 정보 */}
        <div>
          <div className="text-xs sm:text-sm font-medium text-neutral-700 mb-0.5 sm:mb-1">모임명</div>
          <div className="text-sm sm:text-base font-semibold text-neutral-900">
            {resultData.meeting_name || '모임명 없음'}
          </div>
        </div>

        {/* 경기 날짜 */}
        {completedDate && (
          <div className="flex items-center text-xs sm:text-sm text-neutral-600">
            <FaCalendarAlt className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {completedDate}
          </div>
        )}

        {/* 스코어 정보 */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-neutral-200">
          <div className="bg-neutral-50 rounded-lg p-2.5 sm:p-3">
            <div className="flex items-center text-[10px] sm:text-xs text-neutral-500 mb-1">
              <FaGolfBall className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              실제 타수
            </div>
            <div className="text-lg sm:text-xl font-bold text-neutral-900">
              {resultData.gross_score}타
            </div>
          </div>
          <div className="bg-primary-50 rounded-lg p-2.5 sm:p-3">
            <div className="flex items-center text-[10px] sm:text-xs text-primary-600 mb-1">
              <FaChartLine className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              넷 스코어
            </div>
            <div className="text-lg sm:text-xl font-bold text-primary-900">
              {resultData.net_score ? resultData.net_score.toFixed(1) : '-'}타
            </div>
          </div>
        </div>

        {/* 핸디캡 정보 */}
        <div className="text-[10px] sm:text-xs text-neutral-500 pt-1.5 sm:pt-2 border-t border-neutral-100">
          사용된 핸디캡: <span className="font-semibold text-neutral-700">{resultData.handicap_used}</span>
        </div>
      </div>
    </div>
  );
};

export default LastMeetingResultCard;

