import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaHistory, FaGolfBall, FaChartLine, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { usersApi } from '../../lib/api';

const ScoreHistoryCard = ({ userId, initialLimit = 10 }) => {
  const [displayLimit, setDisplayLimit] = useState(5); // 처음에는 5개만 표시
  const [fetchLimit, setFetchLimit] = useState(initialLimit); // API 호출용 limit

  const { data: scoreHistory, isLoading, error } = useQuery({
    queryKey: ['score-history', userId, fetchLimit],
    queryFn: () => usersApi.getUserScoreHistory(userId, fetchLimit),
    enabled: !!userId,
    retry: false,
  });

  const handleShowMore = () => {
    if (displayLimit < fetchLimit) {
      // 이미 가져온 데이터 내에서 더 표시
      setDisplayLimit(prev => Math.min(prev + 5, fetchLimit));
    } else {
      // 더 많은 데이터 가져오기
      setFetchLimit(prev => prev + 10);
      setDisplayLimit(prev => prev + 5);
    }
  };

  const handleShowLess = () => {
    setDisplayLimit(5);
  };

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
          스코어 히스토리를 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  const historyData = scoreHistory?.data || scoreHistory || [];

  if (!historyData || historyData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
            <FaHistory className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
            최근 경기 스코어
          </h3>
        </div>
        <div className="text-center py-6 sm:py-8 text-neutral-500">
          <FaGolfBall className="mx-auto mb-2 h-10 w-10 sm:text-4xl text-neutral-300" />
          <p className="text-xs sm:text-sm">경기 기록이 없습니다.</p>
          <p className="text-[10px] sm:text-xs mt-1 text-neutral-400">경기를 완료하면 스코어가 표시됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
          <FaHistory className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
          최근 경기 스코어
        </h3>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {historyData.slice(0, displayLimit).map((score, index) => {
          const playedDate = score.played_at 
            ? format(new Date(score.played_at), 'yyyy.MM.dd', { locale: ko })
            : '';

          return (
            <div
              key={score.id || index}
              className="border border-neutral-200 rounded-lg p-3 sm:p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-semibold text-neutral-900 mb-0.5 sm:mb-1 line-clamp-1">
                    {score.meeting_name || '모임명 없음'}
                  </div>
                  <div className="flex items-center text-[10px] sm:text-xs text-neutral-500">
                    <FaCalendarAlt className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {playedDate}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neutral-100">
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1 flex items-center justify-center">
                    <FaGolfBall className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    실제 타수
                  </div>
                  <div className="text-base sm:text-lg font-bold text-neutral-900">
                    {score.gross_score}타
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs text-primary-600 mb-0.5 sm:mb-1 flex items-center justify-center">
                    <FaChartLine className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    넷 스코어
                  </div>
                  <div className="text-base sm:text-lg font-bold text-primary-900">
                    {score.net_score ? score.net_score.toFixed(1) : '-'}타
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">
                    핸디캡
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-neutral-700">
                    {score.handicap_used}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayLimit < historyData.length && (
        <div className="mt-3 sm:mt-4 text-center">
          <button
            onClick={handleShowMore}
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center mx-auto"
          >
            <FaChevronDown className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {historyData.length - displayLimit}개 더보기
          </button>
        </div>
      )}

      {displayLimit > 5 && (
        <div className="mt-1.5 sm:mt-2 text-center">
          <button
            onClick={handleShowLess}
            className="text-xs sm:text-sm text-neutral-600 hover:text-neutral-700 font-medium flex items-center justify-center mx-auto"
          >
            <FaChevronUp className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            접기
          </button>
        </div>
      )}
    </div>
  );
};

export default ScoreHistoryCard;

