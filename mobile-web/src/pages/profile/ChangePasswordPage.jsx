import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../lib/auth';
import { FaCheck, FaArrowLeft } from 'react-icons/fa';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [validationErrors, setValidationErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
    
    if (!formData.currentPassword) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }
    
    if (!formData.newPassword) {
      errors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (formData.newPassword.length < 6 || formData.newPassword.length > 32) {
      errors.newPassword = '비밀번호는 6자 이상 32자 이하여야 합니다.';
    } else {
      // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
      const hasUpper = /[A-Z]/.test(formData.newPassword);
      const hasLower = /[a-z]/.test(formData.newPassword);
      const hasDigit = /[0-9]/.test(formData.newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);
      
      const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
      
      if (strength < 2) {
        errors.newPassword = '영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상을 포함해야 합니다.';
      } else if (formData.newPassword === formData.currentPassword) {
        errors.newPassword = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
      }
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 비밀번호 변경 핸들러
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await authApi.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });
      
      setSuccess(true);
      
      // 3초 후 로그아웃 처리
      setTimeout(async () => {
        await logout();
        navigate('/login', { 
          state: { message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' }
        });
      }, 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaCheck className="w-6 h-6 sm:w-8 sm:h-8 text-success-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-3 sm:mb-4">
              비밀번호 변경 완료!
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
              비밀번호가 성공적으로 변경되었습니다.<br />
              보안을 위해 다시 로그인해주세요.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

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
                  비밀번호 변경
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  보안을 위해 정기적으로 비밀번호를 변경해주세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 비밀번호 변경 폼 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
            <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호 *
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword')(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    validationErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.currentPassword}</p>
                )}
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 *
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword')(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요 (6-32자)"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    validationErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인 *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword')(e.target.value)}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-error-700 text-sm">{error}</p>
                </div>
              )}

              {/* 비밀번호 변경 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2 px-3 sm:py-3 sm:px-4 rounded-lg transition-colors"
              >
                {isLoading ? '처리 중...' : '비밀번호 변경'}
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
    </div>
  );
};

export default ChangePasswordPage;
