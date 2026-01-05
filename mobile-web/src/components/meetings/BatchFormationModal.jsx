import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaSpinner, FaTimesCircle } from 'react-icons/fa';

const BatchFormationModal = ({
  isOpen,
  onClose,
  meeting,
  onFormTeams,
  onViewDetail,
  processing
}) => {
  const [selectedModes, setSelectedModes] = useState([]);
  const [teamSize, setTeamSize] = useState(meeting?.team_size || 4);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState({ show: false, message: '' });

  const formationModeOptions = [
    { value: 'GENDER_SEPARATED_HANDICAP', label: '성별 분리 + 핸디캡 기준' },
    { value: 'GENDER_SEPARATED_PREVIOUS_RECORD', label: '성별 분리 + 직전대회 성적 기준' },
    { value: 'GENDER_SEPARATED_RANDOM', label: '성별 분리 + 랜덤' },
    { value: 'GENDER_MIXED_HANDICAP', label: '성별 혼합 + 핸디캡 기준' },
    { value: 'GENDER_MIXED_PREVIOUS_RECORD', label: '성별 혼합 + 직전대회 성적 기준' },
    { value: 'GENDER_MIXED_RANDOM', label: '성별 혼합 + 랜덤' }
  ];

  // 에러 배너 자동 닫기
  useEffect(() => {
    if (!errorBanner.show) return undefined;
    const timeout = setTimeout(() => {
      setErrorBanner({ show: false, message: '' });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [errorBanner.show]);

  if (!isOpen) return null;

  const handleToggleMode = (modeValue) => {
    setSelectedModes(prev =>
      prev.includes(modeValue)
        ? prev.filter(m => m !== modeValue)
        : [...prev, modeValue]
    );
  };

  // 에러 메시지 변환 유틸리티 함수
  const formatApiError = (detail) => {
    if (!detail) return '알 수 없는 오류가 발생했습니다.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(item => item.msg || JSON.stringify(item)).join(', ');
    }
    if (typeof detail === 'object') {
      return detail.msg || detail.message || JSON.stringify(detail);
    }
    return String(detail);
  };

  const handleRunBatch = async () => {
    if (selectedModes.length === 0) {
      setErrorBanner({ show: true, message: '최소 하나의 편성 모드를 선택해주세요.' });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const promises = selectedModes.map(mode =>
        onFormTeams({
          formation_mode: mode,
          team_size: teamSize,
          preview: true,
          batchMode: true
        }).then(response => ({
          mode,
          modeLabel: formationModeOptions.find(o => o.value === mode)?.label || mode,
          teams: response?.data?.teams || response?.teams || [],
          teamSize: teamSize,
          success: true
        })).catch(err => ({
          mode,
          modeLabel: formationModeOptions.find(o => o.value === mode)?.label || mode,
          error: formatApiError(err?.response?.data?.detail) || '편성 실패',
          success: false
        }))
      );

      const batchResults = await Promise.all(promises);
      setResults(batchResults);
    } catch (err) {
      console.error('일괄 편성 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result) => {
    if (!result.success || !result.teams || result.teams.length === 0) return;
    
    // 선택한 결과를 부모로 전달
    onFormTeams({
      formation_mode: result.mode,
      team_size: teamSize,
      preview: true,
      selectedResult: result
    });
    
    onClose();
  };

  // 핸디캡 분산 계산
  const calculateHandicapVariance = (teams) => {
    if (!teams || teams.length === 0) return null;
    
    const teamHandicaps = teams.map(team => {
      // team.total_handicap을 우선 사용
      if (team.total_handicap !== null && team.total_handicap !== undefined) {
        return typeof team.total_handicap === 'number' 
          ? team.total_handicap 
          : parseFloat(team.total_handicap) || 0;
      }
      
      // total_handicap이 없으면 members의 핸디캡 합계 계산
      const members = team.members || team.team_members || [];
      return members.reduce((sum, member) => {
        const handicap = member.handicap_index || member.handicap || 0;
        return sum + (typeof handicap === 'number' ? handicap : parseFloat(handicap) || 0);
      }, 0);
    });

    if (teamHandicaps.length === 0 || teamHandicaps.every(h => h === 0)) {
      return null;
    }

    const mean = teamHandicaps.reduce((a, b) => a + b, 0) / teamHandicaps.length;
    const variance = teamHandicaps.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / teamHandicaps.length;
    
    return {
      mean: mean.toFixed(1),
      variance: variance.toFixed(1),
      stdDev: Math.sqrt(variance).toFixed(1),
      min: Math.min(...teamHandicaps).toFixed(1),
      max: Math.max(...teamHandicaps).toFixed(1)
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-6xl w-full mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              일괄 편성 및 비교
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">
              여러 편성 조건으로 동시에 편성하여 결과를 비교할 수 있습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 sm:p-2 flex-shrink-0"
            disabled={processing || loading}
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 에러 배너 */}
        {errorBanner.show && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <FaTimesCircle className="text-red-600 w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-800 font-medium">{errorBanner.message}</p>
            </div>
            <button
              onClick={() => setErrorBanner({ show: false, message: '' })}
              className="text-red-600 hover:text-red-800 p-1 sm:p-1.5 flex-shrink-0"
            >
              <FaTimes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* 편성 조건 선택 */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">
              편성 모드 선택 (복수 선택 가능)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {formationModeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedModes.includes(option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModes.includes(option.value)}
                    onChange={() => handleToggleMode(option.value)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-neutral-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">
              팀 크기
            </label>
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg"
            >
              <option value={2}>2명</option>
              <option value={3}>3명</option>
              <option value={4}>4명</option>
            </select>
          </div>

          <button
            onClick={handleRunBatch}
            disabled={selectedModes.length === 0 || loading || processing}
            className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium"
          >
            {loading ? (
              <>
                <FaSpinner className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span>편성 중...</span>
              </>
            ) : (
              '일괄 편성 실행'
            )}
          </button>
        </div>

        {/* 결과 비교 */}
        {results.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900">편성 결과 비교</h3>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => {
                const stats = result.success && result.teams ? calculateHandicapVariance(result.teams) : null;
                
                return (
                  <div
                    key={index}
                    className={`rounded-xl border p-3 sm:p-4 ${
                      result.success
                        ? 'border-neutral-200 bg-neutral-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="mb-2 sm:mb-3">
                      <h4 className="text-sm sm:text-base font-semibold text-neutral-900 mb-1">
                        {result.modeLabel}
                      </h4>
                      {result.success ? (
                        <>
                          <p className="text-xs sm:text-sm text-neutral-600">
                            {result.teams.length}팀 생성
                          </p>
                          {stats && (
                            <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-neutral-500 space-y-0.5 sm:space-y-1">
                              <p>평균 핸디: {stats.mean}</p>
                              <p>표준편차: {stats.stdDev}</p>
                              <p>범위: {stats.min} ~ {stats.max}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs sm:text-sm text-red-600">{result.error}</p>
                      )}
                    </div>
                    {result.success && (
                      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                        <button
                          onClick={() => {
                            if (onViewDetail) {
                              onViewDetail(result);
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 font-medium"
                          disabled={processing}
                        >
                          상세 보기
                        </button>
                        <button
                          onClick={() => handleSelectResult(result)}
                          className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 font-medium"
                          disabled={processing}
                        >
                          이 결과 선택
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-1.5 sm:gap-2 pt-3 sm:pt-4 mt-4 sm:mt-6 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 font-medium"
            disabled={processing || loading}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchFormationModal;
