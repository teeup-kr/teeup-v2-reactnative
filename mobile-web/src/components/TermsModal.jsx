import React, { useState, useEffect } from 'react';
import { termsApi } from '../lib/termsApi';

const TermsModal = ({
  isOpen,
  onClose,
  onAccept,
  termsType,
  title
}) => {
  const [termsData, setTermsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedElementBeforeModal, setFocusedElementBeforeModal] = useState(null);

  // 약관 데이터 로드
  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 현재 포커스된 요소 저장
      setFocusedElementBeforeModal(document.activeElement);
      loadTerms();
    }
  }, [isOpen, termsType]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await termsApi.getTerms(termsType);
      setTermsData(data);
    } catch (err) {
      console.error('약관 로드 실패:', err);
      setError('약관을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 포커스 복원 함수
  const restoreFocus = () => {
    if (focusedElementBeforeModal) {
      // Material-UI Dialog가 aria-hidden을 제거할 때까지 더 긴 지연
      setTimeout(() => {
        // root의 aria-hidden이 제거되었는지 확인
        const root = document.getElementById('root');
        if (root && !root.hasAttribute('aria-hidden')) {
          focusedElementBeforeModal.focus();
        }
        setFocusedElementBeforeModal(null);
      }, 300);
    }
  };

  const handleClose = () => {
    onClose();
    restoreFocus();
  };

  const handleAccept = () => {
    onAccept();
    onClose();
    restoreFocus();
  };

  // 모달이 닫힐 때 추가 처리
  useEffect(() => {
    if (!isOpen && focusedElementBeforeModal) {
      // 모달이 닫힌 후 추가로 포커스 복원 시도
      const timer = setTimeout(() => {
        // root의 aria-hidden을 강제로 제거
        const root = document.getElementById('root');
        if (root) {
          root.removeAttribute('aria-hidden');
          // 포커스 복원
          focusedElementBeforeModal.focus();
          setFocusedElementBeforeModal(null);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, focusedElementBeforeModal]);

  const getDefaultTitle = () => {
    const titles = {
      service: '서비스 이용약관',
      privacy: '개인정보처리방침',
      collection: '개인정보 수집 및 이용동의',
      marketing: '마케팅정보 수신동의'
    };
    return titles[termsType];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-3 sm:mx-4 max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {title || getDefaultTitle()}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl font-bold p-1 sm:p-2"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        
        {/* 내용 */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {loading && (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {termsData && !loading && (
            <div 
              className="prose max-w-none text-sm sm:text-base"
              style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: termsData.content }}
            />
          )}
        </div>
        
        {/* 푸터 */}
        <div className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={handleAccept}
            disabled={loading || !!error}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md transition-colors font-medium"
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
