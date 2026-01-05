import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../lib/auth';
import { clubsApi } from '../../lib';
import { FaExclamationTriangle } from 'react-icons/fa';

const DeleteAccountTab = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [agreed, setAgreed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);
  const [showLeaderErrorModal, setShowLeaderErrorModal] = useState(false);

  // 내 클럽 목록 조회 (리더 체크용)
  const { data: myClubsData } = useQuery({
    queryKey: ['my-clubs'],
    queryFn: () => clubsApi.getMyClubs({ limit: 100 }),
    enabled: !!user,
  });

  // 리더인지 확인
  const isLeader = useMemo(() => {
    if (!myClubsData?.data) return false;
    const clubs = Array.isArray(myClubsData.data) ? myClubsData.data : myClubsData.data?.data || [];
    return clubs.some(club => 
      club.membership_role === 'LEADER' || club.my_role === 'LEADER'
    );
  }, [myClubsData]);

  // 체크박스 체크 여부에 따라 버튼 활성화
  const isButtonEnabled = useMemo(() => {
    return agreed;
  }, [agreed]);

  // 회원 탈퇴 뮤테이션
  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: async () => {
      // 쿼리 캐시 초기화
      queryClient.clear();
      
      // 로그아웃 처리
      await logout();
      
      // 홈으로 리다이렉트
      navigate('/', { 
        replace: true,
        state: { message: '회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.' }
      });
    },
    onError: (error) => {
      setError(error.response?.data?.message || '회원 탈퇴에 실패했습니다.');
      setShowConfirmModal(false);
    }
  });

  const isLoading = deleteAccountMutation.isPending;

  // 유효성 검사
  const validateForm = () => {
    if (!agreed) {
      setError('안내사항에 동의해주세요.');
      return false;
    }
    
    if (confirmText !== '회원탈퇴') {
      setError('정확히 "회원탈퇴"를 입력해주세요.');
      return false;
    }
    
    return true;
  };

  // 회원 탈퇴 확인 모달 열기
  const handleOpenConfirmModal = (e) => {
    e.preventDefault();
    
    setError(null);
    
    // 리더는 회원 탈퇴 불가
    if (isLeader) {
      setShowLeaderErrorModal(true);
      return;
    }
    
    if (!validateForm()) return;
    
    setShowConfirmModal(true);
  };

  // 회원 탈퇴 실행
  const handleDeleteAccount = () => {
    setError(null);
    deleteAccountMutation.mutate();
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setError(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 안내사항 */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start">
          <FaExclamationTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-3 text-base sm:text-lg">회원 탈퇴 안내</h3>
            <ul className="text-red-700 text-xs sm:text-sm space-y-2">
              <li>• 회원 탈퇴 시 개인정보는 관련 법령에 따라 처리됩니다.</li>
              <li>• 가입한 클럽, 모임, 골프 기록 및 통계 데이터는 삭제되며 복구할 수 없습니다.</li>
              <li>• 법령에 따라 일부 정보는 일정 기간 보관될 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 체크박스 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              setError(null);
            }}
            className="mt-1 mr-3 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
          />
          <span className="text-xs sm:text-sm text-gray-700">
            위 내용을 확인하였으며, 동의합니다
          </span>
        </label>
      </div>

      {/* 확인 텍스트 입력 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          확인을 위해 '회원탈퇴'를 입력하세요 *
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => {
            setConfirmText(e.target.value);
            setError(null);
          }}
          placeholder="회원탈퇴"
          className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            error && confirmText !== '회원탈퇴' ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        {error && confirmText !== '회원탈퇴' && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* 회원 탈퇴 버튼 */}
      <button
        onClick={handleOpenConfirmModal}
        disabled={!isButtonEnabled || isLoading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        회원 탈퇴
      </button>

      {/* 리더 에러 모달 */}
      {showLeaderErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full mx-4 max-w-md bg-white rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                탈퇴 불가
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  클럽 리더는 회원 탈퇴할 수 없습니다
                </h3>
                
                <p className="text-gray-600 mb-6">
                  클럽 리더라 탈퇴할 수 없습니다. 리더 권한을 다른 구성원에게 넘긴 후 다시 시도해 주세요.
                </p>
                
                <button
                  onClick={() => setShowLeaderErrorModal(false)}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full mx-4 max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                회원 탈퇴 최종 확인
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  정말로 탈퇴하시겠습니까?
                </h3>
                
                <p className="text-gray-600 mb-6">
                  탈퇴 후에는 모든 데이터가 삭제되며<br />
                  복구가 불가능합니다.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? '처리 중...' : '탈퇴하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAccountTab;
