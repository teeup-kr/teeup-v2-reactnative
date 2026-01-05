import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { authApi } from '../../lib/auth';
import { toast } from 'react-toastify';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
    general: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    complexity: false
  });

  // 토큰 유효성 검사
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      toast.error('유효하지 않은 링크입니다.', {
        position: "top-center",
        autoClose: 3000,
      });
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setTokenValid(true);
    }
  }, [token, navigate]);

  // 비밀번호 조건 체크
  const checkPasswordConditions = (password) => {
    const lengthCheck = password.length >= 6 && password.length <= 32;
    
    // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const complexityCheck = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length >= 2;
    
    setPasswordChecks({
      length: lengthCheck,
      complexity: complexityCheck
    });
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 비밀번호 필드인 경우 실시간 검사
    if (field === 'newPassword') {
      checkPasswordConditions(value);
    }
    
    // 비밀번호 확인 필드인 경우 실시간 일치 여부 확인
    if (field === 'confirmPassword') {
      if (value && value !== formData.newPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
      } else if (value && value === formData.newPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
    
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (formData.newPassword.length < 6 || formData.newPassword.length > 32) {
      newErrors.newPassword = '비밀번호는 6자 이상 32자 이하여야 합니다.';
    } else {
      // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
      const hasUpper = /[A-Z]/.test(formData.newPassword);
      const hasLower = /[a-z]/.test(formData.newPassword);
      const hasDigit = /[0-9]/.test(formData.newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);
      
      const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
      
      if (strength < 2) {
        newErrors.newPassword = '영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상을 포함해야 합니다.';
      }
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('유효하지 않은 링크입니다.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    
    // 에러 초기화
    setErrors({ newPassword: '', confirmPassword: '', general: '' });
    
    // 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await authApi.resetPassword(token, formData.newPassword);
      
      setShowSuccess(true);
    } catch (error) {
      console.error('비밀번호 재설정 에러:', error);
      const errorMessage = error.response?.data?.detail || error.message || '비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해주세요.';
      
      setErrors(prev => ({ ...prev, general: errorMessage }));
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md">
          <Card className="p-6 sm:p-10 sm:py-12 md:py-16">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-red-100 rounded-full">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-3 sm:mb-4">
                유효하지 않은 링크입니다
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8">
                링크가 만료되었거나 유효하지 않습니다.<br />
                비밀번호 찾기를 다시 시도해주세요.
              </p>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/auth/forgot-password')}
              >
                비밀번호 찾기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }


  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md">
          <Card className="p-6 sm:p-10 sm:py-12 md:py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-600">로딩 중...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-10 sm:py-12 md:py-16">
          {/* 로고 */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <img 
                src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FZfurg%2FbtsQ1nRxxJM%2FAAAAAAAAAAAAAAAAAAAAAB9cCyQxLN7YuhBgZe8udAfgwUD9bfmassbfHvkGIxUx%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1761922799%26allow_ip%3D%26allow_referer%3D%26signature%3DSvFGt%252BMEK0mIfwTo40IPPxkG860%253D"
                alt="티업링크" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-2 sm:mb-3 text-center">
            비밀번호 재설정
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 text-center">
            새롭게 설정할 비밀번호를 입력해 주세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
            {/* 새 비밀번호 입력 */}
            <div>
              <Input
                label="새 비밀번호"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange('newPassword')}
                placeholder="새 비밀번호를 입력하세요"
                error={errors.newPassword}
                required
              />
              
              {/* 비밀번호 조건 체크리스트 */}
              {formData.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-xs sm:text-sm">
                    <span className={`mr-1.5 sm:mr-2 ${passwordChecks.length ? 'text-green-600' : 'text-neutral-400'}`}>
                      {passwordChecks.length ? '✓' : '○'}
                    </span>
                    <span className={passwordChecks.length ? 'text-green-600' : 'text-neutral-600'}>
                      6자 이상 32자 이하
                    </span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <span className={`mr-1.5 sm:mr-2 ${passwordChecks.complexity ? 'text-green-600' : 'text-neutral-400'}`}>
                      {passwordChecks.complexity ? '✓' : '○'}
                    </span>
                    <span className={passwordChecks.complexity ? 'text-green-600' : 'text-neutral-600'}>
                      영문 대소문자, 특수문자, 숫자 중 2개 이상 포함
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 비밀번호 확인 입력 */}
            <div>
              <Input
                label="비밀번호 확인"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                placeholder="비밀번호를 다시 입력하세요"
                error={errors.confirmPassword}
                required
              />
              {formData.confirmPassword && !errors.confirmPassword && formData.confirmPassword === formData.newPassword && (
                <p className="mt-1 text-xs sm:text-sm text-green-600">✓ 비밀번호가 일치합니다.</p>
              )}
            </div>

            {/* 일반 에러 메시지 */}
            {errors.general && (
              <div className="text-center">
                <p className="text-red-600 text-xs sm:text-sm">{errors.general}</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              비밀번호 재설정
            </Button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              비밀번호를 알고 계시다면?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                로그인하기
              </button>
            </p>
          </div>
        </Card>
      </div>

      {/* 성공 모달 */}
      <Modal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigate('/login', { 
            state: { message: '비밀번호가 재설정되었습니다. 로그인해주세요.' } 
          });
        }}
      >
        <div className="p-6 sm:p-8">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-green-100 rounded-full">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-3 sm:mb-4">
              비밀번호 재설정 완료
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8">
              비밀번호가 성공적으로 재설정되었습니다.<br />
              로그인해주세요.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                setShowSuccess(false);
                navigate('/login', { 
                  state: { message: '비밀번호가 재설정되었습니다. 로그인해주세요.' } 
                });
              }}
            >
              로그인 하러 가기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResetPasswordPage;

