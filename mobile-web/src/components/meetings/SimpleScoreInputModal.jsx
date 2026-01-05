import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { roundsApi } from '../../lib/api';

const SimpleScoreInputModal = ({
  isOpen,
  onClose,
  meetingId,
  participantId,
  currentHandicap,
  onSuccess,
  shouldCompleteRounding = false,
}) => {
  const [grossScore, setGrossScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // 새로운 핸디캡 계산 (라운딩 스코어 - 72)
  const newHandicap = React.useMemo(() => {
    if (!grossScore) return null;
    const gross = parseInt(grossScore, 10);
    if (isNaN(gross)) return null;
    const handicap = gross - 72;
    // 0~72 범위로 클램프
    const clampedHandicap = Math.max(0, Math.min(72, handicap));
    return clampedHandicap.toFixed(1);
  }, [grossScore]);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setGrossScore('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // 라운딩 스코어 검증 (55-144 범위)
    if (!grossScore || grossScore.trim() === '') {
      newErrors.grossScore = '라운딩 스코어를 입력해주세요.';
    } else {
      const score = parseInt(grossScore, 10);
      if (isNaN(score)) {
        newErrors.grossScore = '숫자만 입력 가능합니다.';
      } else if (score < 55 || score > 144) {
        newErrors.grossScore = '스코어는 55~144 사이의 값이어야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 라운딩 종료가 필요한 경우 먼저 라운딩 종료
      if (shouldCompleteRounding) {
        await roundsApi.completeRounding(meetingId);
      }
      
      // 점수 저장 (라운딩 종료 후 가능)
      await roundsApi.submitSimpleScore(meetingId, participantId, {
        gross_score: parseInt(grossScore, 10),
      });
      
      if (onSuccess) {
        onSuccess(shouldCompleteRounding);
      }
      onClose();
    } catch (err) {
      console.error('점수 입력 실패:', err);
      const message = err?.response?.data?.detail || '점수 입력에 실패했습니다.';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">점수 입력</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            disabled={isSubmitting}
          >
            <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 sm:py-6">
          {/* 현재 핸디캡 표시 */}
          <div className="mb-4 sm:mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-neutral-600">현재 핸디캡</span>
              <span className="text-base sm:text-lg font-bold text-neutral-900">
                {currentHandicap !== null && currentHandicap !== undefined && currentHandicap !== ''
                  ? parseFloat(currentHandicap).toFixed(1)
                  : '-'}
              </span>
            </div>
          </div>

          {/* 라운딩 스코어 입력 */}
          <div className="mb-3 sm:mb-4">
            <label
              htmlFor="grossScore"
              className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2"
            >
              라운딩 스코어 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="grossScore"
              value={grossScore}
              onChange={(e) => {
                let value = e.target.value;
                
                // 빈 값 허용
                if (value === '') {
                  setGrossScore('');
                  return;
                }
                
                // 숫자만 허용
                if (!/^\d+$/.test(value)) {
                  return;
                }
                
                // 앞에 0이 오면 제거 (예: 055 -> 55)
                if (value.length > 1 && value[0] === '0') {
                  value = value.replace(/^0+/, '') || '0';
                  // 0만 남으면 빈 문자열로 처리
                  if (value === '0') {
                    setGrossScore('');
                    return;
                  }
                }
                
                // 숫자만 허용 (입력 중에는 범위 체크하지 않음)
                setGrossScore(value);
              }}
              placeholder="55~144 사이의 숫자 입력"
              min="55"
              max="144"
              className={`w-full rounded-lg border px-2.5 py-1.5 sm:px-4 sm:py-3 text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 ${
                errors.grossScore
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                  : 'border-neutral-300 bg-white focus:border-primary-500 focus:ring-primary-200'
              }`}
              disabled={isSubmitting}
            />
            {errors.grossScore && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.grossScore}</p>
            )}
          </div>

          {/* 새로운 핸디캡 미리보기 */}
          {newHandicap !== null && (
            <div className="mb-4 sm:mb-6 rounded-xl border border-primary-200 bg-primary-50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-primary-700">새로운 핸디캡 (예상)</span>
                <span className="text-base sm:text-lg font-bold text-primary-900">{newHandicap}</span>
              </div>
              <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-primary-600">
                라운딩 스코어 - 72 = 새로운 핸디캡
                <br />
                (최근 5경기 평균으로 재계산됩니다)
              </p>
            </div>
          )}

          {/* 제출 에러 메시지 */}
          {errors.submit && (
            <div className="mb-3 sm:mb-4 rounded-lg border border-red-300 bg-red-50 p-2.5 sm:p-3">
              <p className="text-xs sm:text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !grossScore}
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-primary-600 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span className="text-xs sm:text-sm">저장 중...</span>
                </>
              ) : (
                <>

                  {shouldCompleteRounding ? '라운딩 종료 후 저장' : '저장'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleScoreInputModal;

