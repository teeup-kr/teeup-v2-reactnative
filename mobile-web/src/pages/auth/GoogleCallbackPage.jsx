import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleLogin, isLoading, error } = useAuth();
  
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [hasProcessed, setHasProcessed] = useState(false);
  
  // 토스트 메시지 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // success, error
  
  // 토스트 메시지 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);
  
  // 세션 스토리지를 사용한 중복 실행 방지
  const code = searchParams.get('code');
  const processedKey = code ? `google_oauth_processed_${code}` : null;
  
  // 초기 마운트 시 에러 상태 확인
  useEffect(() => {
    if (processedKey) {
      const savedStatus = sessionStorage.getItem(`${processedKey}_status`);
      if (savedStatus === 'error') {
        const savedError = sessionStorage.getItem(`${processedKey}_error`) || 'Google 로그인에 실패했습니다.';
        setStatus('error');
        setToastMessage(savedError);
        setToastType('error');
        setShowToast(true);
        // 자동 이동하지 않음 - 사용자가 버튼을 눌러야 이동
      }
    }
  }, [processedKey]);
  
  useEffect(() => {
    const handleGoogleCallback = async () => {
      // 중복 실행 방지
      if (hasProcessed) {
        return;
      }
      
      // 세션 스토리지를 사용한 중복 실행 방지
      if (sessionStorage.getItem(processedKey)) {
        console.log('이미 처리된 OAuth 요청입니다.');
        // 이미 처리된 경우 상태 확인 후 에러 상태 표시만
        const savedStatus = sessionStorage.getItem(`${processedKey}_status`);
        if (savedStatus === 'error') {
          const savedError = sessionStorage.getItem(`${processedKey}_error`) || 'Google 로그인에 실패했습니다.';
          setStatus('error');
          setToastMessage(savedError);
          setToastType('error');
          setShowToast(true);
          // 자동 이동하지 않음 - 사용자가 버튼을 눌러야 이동
        }
        return;
      }
      
      setHasProcessed(true);
      sessionStorage.setItem(processedKey, 'true');
      
      try {
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        
        if (error) {
          console.error('Google OAuth error:', error);
          const errorMsg = 'Google 로그인이 취소되었습니다.';
          setStatus('error');
          setToastMessage(errorMsg);
          setToastType('error');
          setShowToast(true);
          sessionStorage.setItem(`${processedKey}_status`, 'error');
          sessionStorage.setItem(`${processedKey}_error`, errorMsg);
          // 자동 이동하지 않음 - 사용자가 버튼을 눌러야 이동
          return;
        }
        
        if (!code) {
          console.error('No authorization code received');
          const errorMsg = '인증 코드를 받지 못했습니다.';
          setStatus('error');
          setToastMessage(errorMsg);
          setToastType('error');
          setShowToast(true);
          sessionStorage.setItem(`${processedKey}_status`, 'error');
          sessionStorage.setItem(`${processedKey}_error`, errorMsg);
          // 자동 이동하지 않음 - 사용자가 버튼을 눌러야 이동
          return;
        }
        
        console.log('Google OAuth callback received:', { code, state });
        
        const result = await googleLogin({ provider: 'google', code, state });
        console.log('Google login result:', result);
        
        // 성공 시 세션 스토리지 정리
        sessionStorage.removeItem(processedKey);
        sessionStorage.removeItem(`${processedKey}_status`);
        sessionStorage.removeItem(`${processedKey}_error`);
        
        if (result && result.is_new_user) {
          console.log('새로운 사용자 가입 완료');
          setStatus('success');
          // 즉시 홈으로 이동 (새 사용자 환영 메시지)
          navigate('/', { 
            replace: true,
            state: { 
              message: 'Google 계정으로 가입이 완료되었습니다. 환영합니다!' 
            } 
          });
        } else {
          console.log('기존 사용자 로그인 완료');
          setStatus('success');
          // 즉시 홈으로 이동 (기존 사용자 로그인 메시지)
          navigate('/', { 
            replace: true,
            state: { 
              message: 'Google 계정으로 로그인되었습니다.' 
            } 
          });
        }
        
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        const errorMessage = error?.message || 'Google 로그인에 실패했습니다.';
        setStatus('error');
        setToastMessage(errorMessage);
        setToastType('error');
        setShowToast(true);
        
        // 에러 정보를 세션 스토리지에 저장
        sessionStorage.setItem(`${processedKey}_status`, 'error');
        sessionStorage.setItem(`${processedKey}_error`, errorMessage);
        // 자동 이동하지 않음 - 사용자가 버튼을 눌러야 이동
      }
    };
    
    // processedKey가 없으면 실행하지 않음
    if (!processedKey) {
      return;
    }
    
    handleGoogleCallback();
  }, [code, googleLogin, navigate, hasProcessed, processedKey]);
  
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Google 로그인 처리 중...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              로그인 성공!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              홈페이지로 이동합니다...
            </p>
          </div>
        </div>
        
        {/* 토스트 알림 */}
        {showToast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
            toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toastType === 'success' ? (
              <FaCheckCircle className="w-5 h-5" />
            ) : (
              <FaTimes className="w-5 h-5" />
            )}
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }
  
  if (status === 'error' || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              로그인 실패
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {toastMessage || error || 'Google 로그인 중 오류가 발생했습니다.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                로그인 페이지로 돌아가기
              </button>
            </div>
          </div>
        </div>
        
        {/* 토스트 알림 */}
        {showToast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
            toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toastType === 'success' ? (
              <FaCheckCircle className="w-5 h-5" />
            ) : (
              <FaTimes className="w-5 h-5" />
            )}
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export default GoogleCallbackPage;
