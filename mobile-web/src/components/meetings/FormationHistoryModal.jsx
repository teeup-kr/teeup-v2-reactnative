import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaHistory, FaUndo, FaExclamationTriangle } from 'react-icons/fa';

const FormationHistoryModal = ({
  isOpen,
  onClose,
  meetingId,
  onRestore,
  onViewDetail,
  processing
}) => {
  const [history, setHistory] = useState([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, type: null, index: null });

  useEffect(() => {
    if (isOpen && meetingId) {
      loadHistory();
    }
  }, [isOpen, meetingId]);

  const loadHistory = () => {
    try {
      const key = `team_formation_history_${meetingId}`;
      const stored = localStorage.getItem(key);
      const historyData = stored ? JSON.parse(stored) : [];
      setHistory(historyData);
    } catch (err) {
      console.error('히스토리 로드 실패:', err);
      setHistory([]);
    }
  };

  const handleDeleteHistory = (index) => {
    setDeleteConfirmModal({ isOpen: true, type: 'single', index });
  };

  const handleConfirmDeleteHistory = () => {
    const { type, index } = deleteConfirmModal;
    
    try {
      const key = `team_formation_history_${meetingId}`;
      if (type === 'single') {
        const newHistory = history.filter((_, i) => i !== index);
        localStorage.setItem(key, JSON.stringify(newHistory));
        setHistory(newHistory);
      } else {
        localStorage.removeItem(key);
        setHistory([]);
      }
    } catch (err) {
      console.error('히스토리 삭제 실패:', err);
    }
    
    setDeleteConfirmModal({ isOpen: false, type: null, index: null });
  };

  const handleClearAll = () => {
    setDeleteConfirmModal({ isOpen: true, type: 'all', index: null });
  };

  const handleRestore = (historyItem) => {
    if (onRestore) {
      onRestore(historyItem);
      onClose();
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-4xl w-full mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <FaHistory className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
                편성 히스토리
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">
                이전에 저장한 팀 편성 결과를 확인하고 복원할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 sm:p-2 flex-shrink-0"
            disabled={processing}
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 히스토리 목록 */}
        {history.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FaHistory className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-neutral-500">저장된 편성 히스토리가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
            {history.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <h3 className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-1">
                        {item.formationModeLabel || item.formation_mode}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-neutral-500 bg-neutral-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                        팀 크기: {item.team_size}명
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600">
                      <span>{item.totalMembers || 0}명 참가</span>
                      <span>{item.teams?.length || 0}팀 생성</span>
                      <span className="text-neutral-400">
                        {formatDate(item.savedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    {onViewDetail && (
                      <button
                        onClick={() => onViewDetail(item)}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-1 sm:flex-none"
                        disabled={processing}
                      >
                        <span className="hidden sm:inline">상세 보기</span>
                        <span className="sm:hidden">상세</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleRestore(item)}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-1 sm:flex-none"
                      disabled={processing}
                    >
                      <FaUndo className="w-3 h-3 flex-shrink-0" />
                      <span className="hidden sm:inline">복원</span>
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(index)}
                      className="p-1.5 sm:p-1.5 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                      disabled={processing}
                      title="삭제"
                    >
                      <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-neutral-200">
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={processing}
            >
              전체 삭제
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={processing}
          >
            닫기
          </button>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-8 max-w-md mx-3 sm:mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-3 sm:mb-4">
                <FaExclamationTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                삭제 확인
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                {deleteConfirmModal.type === 'all'
                  ? '모든 히스토리를 삭제하시겠습니까?'
                  : '이 히스토리 항목을 삭제하시겠습니까?'}
              </p>
              <div className="flex gap-2 sm:space-x-3">
                <button
                  onClick={() => setDeleteConfirmModal({ isOpen: false, type: null, index: null })}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDeleteHistory}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationHistoryModal;

