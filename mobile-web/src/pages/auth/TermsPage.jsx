import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { termsApi } from '../../lib/termsApi';
import { FaTimes, FaArrowLeft } from 'react-icons/fa';

const TermsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('terms');
  const [termsData, setTermsData] = useState({
    service: null,
    privacy: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 약관 데이터 로드
  useEffect(() => {
    const loadTermsData = async () => {
      try {
        setIsLoading(true);
        const [serviceTerms, privacyTerms] = await Promise.all([
          termsApi.getActiveServiceTerms(),
          termsApi.getActivePrivacyTerms(),
        ]);
        
        setTermsData({
          service: serviceTerms,
          privacy: privacyTerms,
        });
      } catch (error) {
        setError('약관 정보를 불러오는데 실패했습니다.');
        console.error('Load terms error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTermsData();
  }, []);

  const termsContent = termsData.service?.content || '서비스 이용약관을 불러오는 중입니다...';
  const privacyContent = termsData.privacy?.content || '개인정보처리방침을 불러오는 중입니다...';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-neutral-600">약관 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FaTimes className="w-6 h-6 sm:w-8 sm:h-8 text-error-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">오류 발생</h2>
          <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center mb-3 sm:mb-4">
            <button
              onClick={() => navigate(-1)}
              className="mr-2 sm:mr-4 p-1.5 sm:p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <FaArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
                약관 및 정책
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                서비스 이용약관과 개인정보처리방침을 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-4 sm:mb-6">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              <button
                onClick={() => setActiveTab('terms')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'terms'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                서비스 이용약관
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'privacy'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                개인정보처리방침
              </button>
            </nav>
          </div>
        </div>

        {/* 약관 내용 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="max-h-[calc(100vh-20rem)] sm:max-h-96 md:max-h-[28rem] overflow-y-auto p-4 sm:p-6">
            {termsData.service || termsData.privacy ? (
              <div 
                className="prose prose-sm sm:prose-base max-w-none prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-p:leading-relaxed prose-ul:text-neutral-700 prose-ol:text-neutral-700 prose-li:text-neutral-700 prose-strong:text-neutral-900 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-img:max-w-full prose-img:rounded-lg prose-img:mx-auto prose-table:w-full prose-table:text-sm sm:prose-table:text-base"
                dangerouslySetInnerHTML={{ __html: activeTab === 'terms' ? termsContent : privacyContent }}
              />
            ) : (
              <div className="text-sm sm:text-base text-neutral-500">
                {activeTab === 'terms' ? '서비스 이용약관을 불러오는 중입니다...' : '개인정보처리방침을 불러오는 중입니다...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
