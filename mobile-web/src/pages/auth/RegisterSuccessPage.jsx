import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheck, FaHome, FaSignInAlt } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const RegisterSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, message } = location.state || {};

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <Card className="p-6 sm:p-8">
          <div className="text-center">
            {/* 성공 아이콘 */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FaCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            
            {/* 제목 */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              회원가입 완료!
            </h1>
            
            {/* 메시지 */}
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              {message || '회원가입이 성공적으로 완료되었습니다.'}
            </p>
            
            {user && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">닉네임:</span> {user.nickname}
                </p>
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">이메일:</span> {user.email}
                </p>
              </div>
            )}
            
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              이제 티업링크의 모든 기능을 이용하실 수 있습니다.
            </p>
            
            {/* 버튼들 */}
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={handleGoHome}
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center"
              >
                <FaHome className="mr-1.5 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                홈으로 이동
              </Button>
              
              <Button
                onClick={handleGoLogin}
                variant="secondary"
                size="lg"
                className="w-full flex items-center justify-center"
              >
                <FaSignInAlt className="mr-1.5 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                로그인하기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterSuccessPage;
