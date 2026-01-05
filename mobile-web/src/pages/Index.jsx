import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authUtils } from '../lib/auth';
import { FaCheckCircle } from 'react-icons/fa';

const HomePage = () => {
  const location = useLocation();
  
  // 토스트 메시지 상태
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 성공 메시지 표시
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setShowSuccessToast(true);
      // 메시지 표시 후 state 초기화
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 토스트 메시지 자동 숨김
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleCreateMeeting = () => {
    if (authUtils.isAuthenticated()) {
      // 로그인된 사용자: 클럽 목록으로 이동
      window.location.href = '/clubs';
    } else {
      // 비로그인 사용자: 로그인 페이지로 이동
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="lg:grid lg:grid-cols-2 lg:min-h-screen md:min-h-screen">
        {/* 히어로/브랜딩 영역 */}
        <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8">
            <div className="py-8 md:py-12 lg:py-16 text-center lg:text-left">
              {/* 로고 */}
              <div className="mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-3 md:mb-4">
                  <img 
                    src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FZfurg%2FbtsQ1nRxxJM%2FAAAAAAAAAAAAAAAAAAAAAB9cCyQxLN7YuhBgZe8udAfgwUD9bfmassbfHvkGIxUx%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1761922799%26allow_ip%3D%26allow_referer%3D%26signature%3DSvFGt%252BMEK0mIfwTo40IPPxkG860%253D"
                    alt="티업링크" 
                    className="w-8 h-8 md:w-12 md:h-12 object-contain"
                  />
                </div>
                <h1 className="text-xl md:text-2xl font-bold mb-2">티업링크</h1>
              </div>
              
              {/* 감정 어필 */}
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 leading-tight">
                골프 모임 관리의<br />
                새로운 경험을 시작하세요
              </h2>
              
              {/* 논리적 혜택 */}
              <p className="text-sm md:text-base lg:text-lg text-emerald-100 leading-relaxed mb-4 md:mb-6">
                자동 조편성부터 정산까지<br />
                모든 것을 한 곳에서 관리하세요
              </p>
              
              {/* 리스크 제거 */}
              <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-emerald-100">
                <p>✓ 5분 만에 모임 만들기</p>
                <p>✓ 편리한 구성원 관리</p>
                <p>✓ 간편한 클럽 관리</p>
              </div>
            </div>
          </div>
        </section>

        {/* 메인 콘텐츠 영역 */}
        <section className="bg-white">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-md md:max-w-xl lg:max-w-none mx-auto py-6 md:py-12 lg:py-16">
              {/* 페이지 타이틀 */}
              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  티업링크에 오신 것을 환영합니다
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  골프 모임 관리의 모든 것을<br />
                  간편하게 해결해드립니다
                </p>
              </div>

              {/* 주요 기능 소개 */}
              <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                <div className="bg-emerald-50 rounded-lg p-4 md:p-6">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg md:text-xl">🎯</span>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">자동 조편성</h4>
                      <p className="text-gray-600 text-xs md:text-sm">
                        핸디캡과 선호도를 고려한<br />
                        공정한 조편성을 자동으로 제공합니다
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 md:p-6">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg md:text-xl">💰</span>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">자동 정산</h4>
                      <p className="text-gray-600 text-xs md:text-sm">
                        회비와 경비를 자동으로 계산하고<br />
                        정확한 정산 내역을 제공합니다
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 md:p-6">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg md:text-xl">📊</span>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">기록 관리</h4>
                      <p className="text-gray-600 text-xs md:text-sm">
                        라운딩 기록과 통계를 체계적으로<br />
                        관리하고 분석할 수 있습니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="space-y-4">
                <button
                  onClick={handleCreateMeeting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  지금 시작하기
                </button>
              </div>

              {/* 추가 안내 */}
              {!authUtils.isAuthenticated() && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    이미 계정이 있으신가요? <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">로그인</Link>하세요
                  </p>
                </div>
              )}

            </div>
          </div>
        </section>
      </div>
      
      {/* 성공 토스트 메시지 */}
      {showSuccessToast && (
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2 bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg animate-slide-up">
          <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm font-medium">{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default HomePage;