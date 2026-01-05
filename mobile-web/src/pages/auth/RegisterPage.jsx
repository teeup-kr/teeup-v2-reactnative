import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { authUtils } from '../../lib/auth';
import TermsModal from '../../components/TermsModal';
import { api } from '../../lib/api';
// 레이아웃 컴포넌트들은 App.jsx에서 전역으로 관리됨
import { FaCheck } from 'react-icons/fa';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    average_score: undefined,
    terms_agreement: false,
    privacy_policy: false,
    privacy_collection: false,
    marketing_consent: false,
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    average_score: '',
    terms_agreement: '',
    privacy_policy: '',
    privacy_collection: '',
  });
  
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    complexity: false
  });
  
  
  // 약관 관련 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModalTerms, setCurrentModalTerms] = useState({
    type: 'service',
    title: ''
  });

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  // 약관 모달 열기
  const openTermsModal = (type) => {
    const titles = {
      service: '서비스 이용약관',
      privacy: '개인정보처리방침',
      collection: '개인정보 수집 및 이용동의',
      marketing: '마케팅정보 수신동의'
    };
    
    setCurrentModalTerms({
      type,
      title: titles[type]
    });
    setModalOpen(true);
  };

  // 에러 초기화
  useEffect(() => {
    clearError();
  }, [clearError]);

  // 개별 필드 유효성 검사
  const validateField = (field, value) => {
    const errors = {};

    switch (field) {
      case 'email':
        // 이메일은 실시간 검사하지 않음 (중복확인 버튼으로 처리)
        break;
      case 'password':
        if (!value) {
          errors.password = '비밀번호를 입력해주세요.';
        } else if (value.length < 6 || value.length > 32) {
          errors.password = '비밀번호는 6자 이상 32자 이하여야 합니다.';
        } else {
          // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasDigit = /[0-9]/.test(value);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          
          const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
          
          if (strength < 2) {
            errors.password = '영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상을 포함해야 합니다.';
          }
        }
        break;
      case 'nickname':
        if (!value) {
          errors.nickname = '닉네임을 입력해주세요.';
        } else if (value.length < 2 || value.length > 20) {
          errors.nickname = '닉네임은 2-20자여야 합니다.';
        } else if (!/^[a-zA-Z가-힣0-9]+$/.test(value)) {
          errors.nickname = '닉네임은 영문, 한글, 숫자만 사용 가능합니다.';
        }
        break;
      case 'average_score':
        if (value !== undefined && value !== 0) {
          if (value < 55 || value > 144) {
            errors.average_score = '평균 타수는 55타 이상 144타 이하여야 합니다.';
          }
        }
        break;
    }

    setValidationErrors(prev => ({ ...prev, ...errors }));
  };

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

  // 닉네임 중복확인
  const checkNicknameDuplicate = async () => {
    if (!formData.nickname) {
      setValidationErrors(prev => ({ ...prev, nickname: '닉네임을 입력해주세요.' }));
      return;
    }

    // 닉네임 형식 검사 (영문 대소문자, 한글, 숫자만, 2-20자)
    if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      setValidationErrors(prev => ({ ...prev, nickname: '닉네임은 2-20자여야 합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    if (!/^[a-zA-Z가-힣0-9]+$/.test(formData.nickname)) {
      setValidationErrors(prev => ({ ...prev, nickname: '닉네임은 영문 대소문자, 한글, 숫자만 사용 가능합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    try {
      const data = await api.get('/auth/check-nickname', {
        params: { nickname: formData.nickname }
      });

      if (data.is_available && data.is_valid) {
        setValidationErrors(prev => ({ ...prev, nickname: undefined }));
        setNicknameChecked(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
      } else {
        setValidationErrors(prev => ({ ...prev, nickname: data.message }));
        setNicknameChecked(false);
        setNicknameMessage('');
      }
    } catch (error) {
      console.error('Nickname check error:', error);
      setValidationErrors(prev => ({ ...prev, nickname: '닉네임 확인 중 오류가 발생했습니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
    }
  };

  // 비밀번호 재확인 유효성 검사
  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
      return;
    }
    
    if (confirmPassword !== formData.password) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
    } else {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  // 이메일 중복확인
  const checkEmailDuplicate = async () => {
    if (!formData.email) {
      setValidationErrors(prev => ({ ...prev, email: '이메일을 입력해주세요.' }));
      return;
    }

    // 이메일 형식 검사
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      setValidationErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }));
      setEmailChecked(false);
      return;
    }

    try {
      const data = await api.get('/auth/check-email', {
        params: { email: formData.email }
      });
      
      if (data.is_available && data.is_valid) {
        setValidationErrors(prev => ({ ...prev, email: undefined }));
        setEmailChecked(true);
        setEmailMessage('사용 가능한 이메일입니다.');
      } else {
        setValidationErrors(prev => ({ ...prev, email: data.message }));
        setEmailChecked(false);
        setEmailMessage('');
      }
    } catch (error) {
      console.error('Email check error:', error);
      setValidationErrors(prev => ({ ...prev, email: '이메일 확인 중 오류가 발생했습니다.' }));
      setEmailChecked(false);
      setEmailMessage('');
    }
  };

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 이메일이 변경되면 중복확인 상태 초기화
    if (field === 'email') {
      setEmailChecked(false);
      setValidationErrors(prev => ({ ...prev, email: undefined }));
      setEmailMessage('');
    } else if (field === 'nickname') {
      setNicknameChecked(false);
      setValidationErrors(prev => ({ ...prev, nickname: undefined }));
      setNicknameMessage('');
    } else if (field === 'password') {
      // 비밀번호 조건 체크
      checkPasswordConditions(value);
      // 실시간 유효성 검사 실행
      validateField(field, value);
    } else if (field === 'average_score') {
      // 평균타수 에러 초기화
      setValidationErrors(prev => ({ ...prev, average_score: undefined }));
      // 실시간 유효성 검사 실행
      validateField(field, value);
    } else {
      // 실시간 유효성 검사 실행
      validateField(field, value);
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    // 이메일 검사
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!emailChecked) {
      errors.email = '이메일 중복확인을 해주세요.';
    }
    
    // 비밀번호 검사
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6 || formData.password.length > 32) {
      errors.password = '비밀번호는 6자 이상 32자 이하여야 합니다.';
    } else {
      // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasLower = /[a-z]/.test(formData.password);
      const hasDigit = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      
      const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
      
      if (strength < 2) {
        errors.password = '영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상을 포함해야 합니다.';
      }
    }

    // 비밀번호 재확인 검사
    if (!confirmPassword) {
      errors.confirmPassword = '비밀번호 재확인을 입력해주세요.';
    } else if (confirmPassword !== formData.password) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    // 닉네임 검사
    if (!formData.nickname) {
      errors.nickname = '닉네임을 입력해주세요.';
    } else if (!nicknameChecked) {
      errors.nickname = '닉네임 중복확인을 해주세요.';
    }

    // 평균 타수 검사
    if (formData.average_score !== undefined) {
      if (formData.average_score < 55 || formData.average_score > 144) {
        errors.average_score = '평균 타수는 55타 이상 144타 이하여야 합니다.';
      }
    }

    // 약관 동의 검사
    if (!formData.terms_agreement) {
      errors.terms_agreement = '서비스 이용약관에 동의해주세요.';
    }
    if (!formData.privacy_policy) {
      errors.privacy_policy = '개인정보처리방침에 동의해주세요.';
    }
    if (!formData.privacy_collection) {
      errors.privacy_collection = '개인정보 수집 및 이용동의에 동의해주세요.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 회원가입 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const result = await register(formData);
      console.log('회원가입 결과:', result); // 디버깅용
      
      if (result && result.success) {
        // 회원가입 성공 시 완료 페이지로 이동
        console.log('회원가입 성공, 완료 페이지로 이동'); // 디버깅용
        navigate('/register-success', { 
          state: { 
            user: result.data.user,
            message: '회원가입이 완료되었습니다!' 
          } 
        });
      } else {
        console.error('회원가입 실패:', result);
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
    }
  };
  

  // 전체 동의 처리
  const handleSelectAll = (checked) => {
    setFormData(prev => ({
      ...prev,
      terms_agreement: checked,
      privacy_policy: checked,
      privacy_collection: checked,
      marketing_consent: checked,
    }));
  };

  const isAllTermsAgreed = formData.terms_agreement && formData.privacy_policy && formData.privacy_collection;

  // 회원가입 버튼 활성화 조건
  const isFormValid = 
    formData.email && 
    emailChecked && 
    formData.password && 
    passwordChecks.length && 
    passwordChecks.complexity &&
    formData.nickname && 
    nicknameChecked && 
    formData.terms_agreement && 
    formData.privacy_policy && 
    formData.privacy_collection;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <Card className="w-full max-w-lg p-6 sm:p-8 md:p-10 sm:py-12 md:py-16">
          {/* 로고 및 제목 */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <img 
                src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FZfurg%2FbtsQ1nRxxJM%2FAAAAAAAAAAAAAAAAAAAAAB9cCyQxLN7YuhBgZe8udAfgwUD9bfmassbfHvkGIxUx%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1761922799%26allow_ip%3D%26allow_referer%3D%26signature%3DSvFGt%252BMEK0mIfwTo40IPPxkG860%253D"
                alt="티업링크" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
        </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">회원가입</h1>
            <p className="text-sm sm:text-base text-neutral-600">골프 모임 플랫폼에 오신 것을 환영합니다</p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* 이메일 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
              이메일 <span className="text-error-500">*</span>
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email')(e.target.value)}
                placeholder="이메일을 입력하세요"
                className={`flex-1 px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  validationErrors.email ? 'border-error-300' : 'border-neutral-300'
                }`}
              />
              <button
                type="button"
                onClick={checkEmailDuplicate}
                disabled={!formData.email || emailChecked}
                className="px-2.5 py-2 sm:px-3 sm:py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                {emailChecked ? '확인완료' : '중복확인'}
              </button>
              </div>
            {validationErrors.email && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{validationErrors.email}</p>
            )}
            {emailMessage && !validationErrors.email && (
              <p className="mt-1 text-xs sm:text-sm text-success-600">{emailMessage}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
              비밀번호 <span className="text-error-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password')(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className={`w-full px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.password ? 'border-error-300' : 'border-neutral-300'
              }`}
            />
            
            {/* 비밀번호 조건 체크리스트 */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-xs sm:text-sm">
                  <span className={`mr-1.5 sm:mr-2 ${passwordChecks.length ? 'text-success-600' : 'text-neutral-400'}`}>
                    {passwordChecks.length ? '✓' : '○'}
                  </span>
                  <span className={passwordChecks.length ? 'text-success-600' : 'text-neutral-600'}>
                    6자 이상 32자 이하
                  </span>
                </div>
                <div className="flex items-center text-xs sm:text-sm">
                  <span className={`mr-1.5 sm:mr-2 ${passwordChecks.complexity ? 'text-success-600' : 'text-neutral-400'}`}>
                    {passwordChecks.complexity ? '✓' : '○'}
                  </span>
                  <span className={passwordChecks.complexity ? 'text-success-600' : 'text-neutral-600'}>
                    영문 대소문자, 특수문자, 숫자 중 2개 이상 포함
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 비밀번호 재확인 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
              비밀번호 재확인 <span className="text-error-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword) {
                  setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              onBlur={validateConfirmPassword}
              placeholder="비밀번호를 다시 입력하세요"
              className={`w-full px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.confirmPassword ? 'border-error-300' : 'border-neutral-300'
              }`}
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{validationErrors.confirmPassword}</p>
            )}
            {confirmPassword && !validationErrors.confirmPassword && confirmPassword === formData.password && (
              <p className="mt-1 text-xs sm:text-sm text-success-600">✓ 비밀번호가 일치합니다.</p>
            )}
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
              닉네임 <span className="text-error-500">*</span>
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              <input
              type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname')(e.target.value)}
              placeholder="닉네임을 입력하세요"
                className={`flex-1 px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  validationErrors.nickname ? 'border-error-300' : 'border-neutral-300'
                }`}
              />
              <button
                type="button"
                onClick={checkNicknameDuplicate}
                disabled={!formData.nickname || nicknameChecked}
                className="px-2.5 py-2 sm:px-3 sm:py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                {nicknameChecked ? '확인완료' : '중복확인'}
              </button>
            </div>
            {validationErrors.nickname && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{validationErrors.nickname}</p>
            )}
            {nicknameMessage && !validationErrors.nickname && (
              <p className="mt-1 text-xs sm:text-sm text-success-600">{nicknameMessage}</p>
            )}
          </div>

          {/* 평균 타수 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
              평균 타수
            </label>
            <input
              type="number"
              value={formData.average_score?.toString() || ''}
              onChange={(e) => handleInputChange('average_score')(e.target.value ? parseInt(e.target.value) : 0)}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (value < 55 || value > 144) {
                  handleInputChange('average_score')(100);
                }
              }}
              placeholder="예: 90 (55-144타)"
              className={`w-full px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.average_score ? 'border-error-300' : 'border-neutral-300'
              }`}
            />
            {validationErrors.average_score && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{validationErrors.average_score}</p>
            )}
          </div>

          {/* 약관 동의 */}
          <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-neutral-200">
            <h3 className="text-xs sm:text-sm font-medium text-neutral-700">약관 동의</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="select-all"
                checked={isAllTermsAgreed}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="select-all" className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-neutral-700">
                전체 동의
              </label>
            </div>

            <div className="space-y-1.5 sm:space-y-2 pl-4 sm:pl-6">
              <div className="flex items-center flex-wrap gap-1">
                  <input
                    type="checkbox"
                  id="terms-agreement"
                    checked={formData.terms_agreement}
                  onChange={(e) => handleInputChange('terms_agreement')(e.target.checked)}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded flex-shrink-0"
                />
                <label htmlFor="terms-agreement" className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-neutral-700 tracking-tight">
                  서비스 이용약관에 동의합니다 <span className="text-error-500">(필수)</span>
                  </label>
                <button
                  type="button"
                  onClick={() => openTermsModal('service')}
                  className="ml-1 text-primary-600 hover:text-primary-700 text-xs sm:text-sm underline"
                  aria-label="서비스 이용약관 보기"
                >
                  [보기]
                </button>
              </div>
              
              <div className="flex items-center flex-wrap gap-1">
                  <input
                    type="checkbox"
                  id="privacy-policy"
                    checked={formData.privacy_policy}
                  onChange={(e) => handleInputChange('privacy_policy')(e.target.checked)}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded flex-shrink-0"
                />
                <label htmlFor="privacy-policy" className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-neutral-700 tracking-tight">
                  개인정보처리방침에 동의합니다 <span className="text-error-500">(필수)</span>
                  </label>
                <button
                  type="button"
                  onClick={() => openTermsModal('privacy')}
                  className="ml-1 text-primary-600 hover:text-primary-700 text-xs sm:text-sm underline"
                  aria-label="개인정보처리방침 보기"
                >
                  [보기]
                </button>
              </div>
              
              <div className="flex items-center flex-wrap gap-1">
                  <input
                    type="checkbox"
                  id="privacy-collection"
                    checked={formData.privacy_collection}
                  onChange={(e) => handleInputChange('privacy_collection')(e.target.checked)}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded flex-shrink-0"
                />
                <label htmlFor="privacy-collection" className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-neutral-700 tracking-tight">
                  개인정보 수집 및 이용에 동의합니다 <span className="text-error-500">(필수)</span>
                  </label>
                <button
                  type="button"
                  onClick={() => openTermsModal('collection')}
                  className="ml-1 text-primary-600 hover:text-primary-700 text-xs sm:text-sm underline"
                  aria-label="개인정보 수집 및 이용동의 보기"
                >
                  [보기]
                </button>
              </div>
              
              <div className="flex items-center flex-wrap gap-1">
                  <input
                    type="checkbox"
                  id="marketing-consent"
                  checked={formData.marketing_consent || false}
                  onChange={(e) => handleInputChange('marketing_consent')(e.target.checked)}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded flex-shrink-0"
                />
                <label htmlFor="marketing-consent" className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-neutral-700 tracking-tight">
                  마케팅정보 수신동의 <span className="text-neutral-500">(선택)</span>
                  </label>
                <button
                  type="button"
                  onClick={() => openTermsModal('marketing')}
                  className="ml-1 text-primary-600 hover:text-primary-700 text-xs sm:text-sm underline"
                  aria-label="마케팅정보 수신동의 보기"
                >
                  [보기]
                </button>
              </div>
            </div>
            
            {/* 약관 동의 에러 메시지 */}
            {(validationErrors.terms_agreement || validationErrors.privacy_policy || validationErrors.privacy_collection) && (
              <div className="text-error-600 text-xs sm:text-sm">
                {validationErrors.terms_agreement || validationErrors.privacy_policy || validationErrors.privacy_collection}
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-2.5 sm:p-3">
              <p className="text-error-700 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* 회원가입 버튼 */}
            <Button
              type="submit"
            variant="primary"
            size="lg"
              className="w-full"
            disabled={isLoading || !isFormValid}
            >
            {isLoading ? '회원가입 중...' : '회원가입'}
            </Button>
          </form>

        {/* 로그인 링크 */}
        <div className="text-center mt-6">
          <p className="text-neutral-600 text-sm">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-medium underline"
            >
              로그인
            </button>
          </p>
        </div>
        </Card>


      {/* 약관 모달 */}
      <TermsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAccept={() => {
          // 약관 동의 시 해당 체크박스 자동 체크
          const termType = currentModalTerms.type;
          setFormData(prev => ({
            ...prev,
            [termType === 'service' ? 'terms_agreement' : 
             termType === 'privacy' ? 'privacy_policy' :
             termType === 'collection' ? 'privacy_collection' :
             'marketing_consent']: true
          }));
        }}
        termsType={currentModalTerms.type}
        title={currentModalTerms.title}
      />
    </div>
  );
};

export default RegisterPage;