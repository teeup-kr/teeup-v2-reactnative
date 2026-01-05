import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../lib/auth';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmText: '',
    reason: '',
  });
  
  const [validationErrors, setValidationErrors] = useState({
    password: '',
    confirmText: '',
    reason: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 인증되지 않은 사용자는 리다이렉트
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 유효성 검사 에러 초기화
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // 에러 메시지 초기화
    if (error) {
      setError(null);
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.';
    }
    
    if (formData.confirmText !== '회원탈퇴') {
      errors.confirmText = '정확히 "회원탈퇴"를 입력해주세요.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 회원 탈퇴 확인 모달 열기
  const handleOpenConfirmModal = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setShowConfirmModal(true);
  };

  // 회원 탈퇴 실행
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authApi.deleteAccount(formData.password);
      
      // 성공 시 로그아웃 및 리다이렉트
      await logout();
      navigate('/login', { 
        state: { message: '회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.' }
      });
      
    } catch (error) {
      setError(error.response?.data?.message || '회원 탈퇴에 실패했습니다.');
      setShowConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  회원 탈퇴
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  정말로 탈퇴하시겠습니까?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 경고 메시지 */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-start">
              <FaExclamationTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-warning-800 font-semibold mb-2 text-sm sm:text-base">탈퇴 시 주의사항</h3>
                <ul className="text-warning-700 text-xs sm:text-sm space-y-1">
                  <li>• 모든 개인정보가 즉시 삭제됩니다</li>
                  <li>• 가입한 클럽 및 모임 정보가 삭제됩니다</li>
                  <li>• 골프 기록 및 통계가 모두 삭제됩니다</li>
                  <li>• 탈퇴 후 복구가 불가능합니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 회원 탈퇴 폼 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
            <form onSubmit={handleOpenConfirmModal} className="space-y-3 sm:space-y-4">
              {/* 비밀번호 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호 *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password')(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>

              {/* 탈퇴 사유 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  탈퇴 사유 (선택사항)
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason')(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="">선택해주세요</option>
                  <option value="service_quality">서비스 품질 불만</option>
                  <option value="privacy_concern">개인정보 보호 우려</option>
                  <option value="usage_frequency">사용 빈도 감소</option>
                  <option value="alternative_service">다른 서비스 이용</option>
                  <option value="technical_issues">기술적 문제</option>
                  <option value="other">기타</option>
                </select>
              </div>

              {/* 확인 텍스트 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  확인을 위해 '회원탈퇴'를 입력하세요 *
                </label>
                <input
                  type="text"
                  value={formData.confirmText}
                  onChange={(e) => handleInputChange('confirmText')(e.target.value)}
                  placeholder="회원탈퇴"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    validationErrors.confirmText ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.confirmText && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.confirmText}</p>
                )}
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-error-700 text-sm">{error}</p>
                </div>
              )}

              {/* 회원 탈퇴 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-error-600 hover:bg-error-700 disabled:opacity-50 text-white font-medium py-2 px-3 sm:py-3 sm:px-4 rounded-lg transition-colors"
              >
                회원 탈퇴
              </button>
            </form>

            {/* 하단 링크 */}
            <div className="mt-4 sm:mt-6 text-center">
              <button
                onClick={() => navigate(-1)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                회원 탈퇴 최종 확인
              </h3>
            </div>
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FaExclamationTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-error-600" />
                </div>
                
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  정말로 탈퇴하시겠습니까?
                </h3>
                
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  탈퇴 후에는 모든 데이터가 삭제되며<br />
                  복구가 불가능합니다.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-white bg-error-600 border border-transparent rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
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

export default DeleteAccountPage;
