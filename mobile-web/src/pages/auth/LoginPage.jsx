import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config/env';
import { FaGoogle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });


  

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
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // 로그인 핸들러
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 에러 초기화
    setErrors({ email: '', password: '', general: '' });
    
    // 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(formData);
      
      // 성공 시 리다이렉트
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('로그인 에러:', error);
      
      // error.message가 확실히 존재하도록 보장
      const errorMessage = error.message || error.toString() || '로그인에 실패했습니다.';
      
      // 여러 방법으로 토스트 시도
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // 백업 토스트 (1초 후)
      setTimeout(() => {
        toast(errorMessage, {
          position: "top-center",
          autoClose: 3000,
        });
      }, 1000);
    }
  };

  // Google 로그인 핸들러
  const handleGoogleLogin = () => {
    if (!config.GOOGLE_CLIENT_ID) {
      setErrors(prev => ({ ...prev, general: 'Google 로그인이 설정되지 않았습니다.' }));
      return;
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&response_type=code&scope=email profile`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-10 sm:py-12 md:py-16">
          {/* 로고 및 제목 */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <img 
                src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FZfurg%2FbtsQ1nRxxJM%2FAAAAAAAAAAAAAAAAAAAAAB9cCyQxLN7YuhBgZe8udAfgwUD9bfmassbfHvkGIxUx%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1761922799%26allow_ip%3D%26allow_referer%3D%26signature%3DSvFGt%252BMEK0mIfwTo40IPPxkG860%253D"
                alt="티업링크" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">티업링크</h1>
            <p className="text-sm sm:text-base text-neutral-600">골프 모임을 더 쉽고 즐겁게</p>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-4 sm:mb-6 text-center">
            로그인
          </h2>

          {/* 성공 메시지 */}
          {location.state?.message && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-xs sm:text-sm">{location.state.message}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4" noValidate>
            {/* 이메일 입력 */}
            <Input
              label="이메일"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="이메일을 입력하세요"
              error={errors.email}
              required
            />

            {/* 비밀번호 입력 */}
            <Input
              label="비밀번호"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="비밀번호를 입력하세요"
              error={errors.password}
              required
            />

            {/* 일반 에러 메시지 */}
            {errors.general && (
              <div className="text-center">
                <p className="text-red-600 text-xs sm:text-sm">{errors.general}</p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              로그인
            </Button>
          </form>

          {/* 비밀번호 찾기 */}
          <div className="mt-3 sm:mt-4 text-center">
            <span className="text-sm text-neutral-600">비밀번호를 잊으셨나요? </span>
            <button
              type="button"
              onClick={() => navigate('/auth/forgot-password')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              비밀번호 찾기
            </button>
          </div>

          {/* 구분선 */}
          <div className="my-4 sm:my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>
          </div>

          {/* Google 로그인 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <FaGoogle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Google로 로그인
          </Button>

          {/* 회원가입 링크 */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              아직 계정이 없으신가요?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                회원가입
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;