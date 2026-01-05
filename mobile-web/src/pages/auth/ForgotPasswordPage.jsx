import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { authApi } from '../../lib/auth';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
  });
  
  const [errors, setErrors] = useState({
    nickname: '',
    email: '',
    general: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 입력값 변경 핸들러
  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 에러 초기화
    setErrors({ nickname: '', email: '', general: '' });
    
    // 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await authApi.requestPasswordReset({
        nickname: formData.nickname.trim(),
        email: formData.email.trim()
      });
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('비밀번호 찾기 에러:', error);
      // 보안을 위해 항상 성공 메시지 표시 (사용자 존재 여부 노출 방지)
      setShowSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };


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
            가입하신 이메일로<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
            {/* 닉네임 입력 */}
            <Input
              label="닉네임"
              type="text"
              value={formData.nickname}
              onChange={handleInputChange('nickname')}
              placeholder="가입에 사용한 닉네임을 입력하세요"
              error={errors.nickname}
              required
            />

            {/* 이메일 입력 */}
            <Input
              label="이메일 주소"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="가입에 사용한 이메일을 입력하세요"
              error={errors.email}
              required
            />

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
              재설정 메일 보내기
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
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setFormData({ nickname: '', email: '' });
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
              이메일이 발송되었습니다
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8">
              가입하신 이메일 주소로 비밀번호 재설정 링크를 보내드렸습니다.<br />
              받은편지함을 확인해주세요.
            </p>
            <div className="space-y-3 sm:space-y-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/login');
                }}
              >
                로그인 하러 가기
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  setShowSuccessModal(false);
                  setFormData({ nickname: '', email: '' });
                }}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ForgotPasswordPage;

