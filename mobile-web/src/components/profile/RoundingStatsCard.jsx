import React from 'react';
import PropTypes from 'prop-types';
import { FaTrophy, FaChartLine, FaHistory, FaMedal } from 'react-icons/fa';

const RoundingStatsCard = ({ stats, isLoading, error }) => {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 animate-pulse"
          >
            <div className="h-3 sm:h-4 bg-neutral-200 rounded w-16 sm:w-20 mb-2 sm:mb-3"></div>
            <div className="h-6 sm:h-8 bg-neutral-200 rounded w-12 sm:w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4 mb-6">
        <p className="text-xs sm:text-sm text-red-600">통계 정보를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!stats || stats.total_games === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6 mb-6 text-center">
        <p className="text-sm sm:text-base text-neutral-600">아직 기록된 라운딩이 없습니다.</p>
      </div>
    );
  }

  // 통계 카드 데이터
  const statCards = [
    {
      id: 'total',
      label: '총 경기 수',
      value: stats.total_games,
      unit: '경기',
      icon: FaHistory,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'average',
      label: '평균 스코어',
      value: stats.average_score ? stats.average_score.toFixed(1) : '-',
      unit: '',
      icon: FaChartLine,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'recent5',
      label: '최근 5경기 평균',
      value: stats.recent_5_avg ? stats.recent_5_avg.toFixed(1) : '-',
      unit: '',
      icon: FaTrophy,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'best-worst',
      label: '최고/최저',
      value: stats.best_score && stats.worst_score 
        ? `${stats.best_score} / ${stats.worst_score}`
        : '-',
      unit: '',
      icon: FaMedal,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`rounded-xl border ${card.borderColor} ${card.bgColor} p-3 sm:p-4 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color}`} />
              <span className="text-[10px] sm:text-xs font-medium text-neutral-600">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                {card.value}
              </span>
              {card.unit && (
                <span className="text-xs sm:text-sm text-neutral-500">{card.unit}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

RoundingStatsCard.propTypes = {
  stats: PropTypes.shape({
    total_games: PropTypes.number.isRequired,
    average_score: PropTypes.number,
    recent_5_avg: PropTypes.number,
    best_score: PropTypes.number,
    worst_score: PropTypes.number,
    current_handicap: PropTypes.number,
    initial_handicap: PropTypes.number,
  }),
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

export default RoundingStatsCard;

