import axios from 'axios';

// API 기본 설정 (토큰 갱신용)
// 순환 참조 방지를 위해 lazy import 사용
const API_VERSION = '/api/v1';

// 응답 인터셉터 설정
export const setupResponseInterceptor = (apiClient) => {
  apiClient.interceptors.response.use(
    (response) => {
      // 규정 관련 API 응답 로그 추가
      if (response.config.url?.includes('regulations')) {
        console.log('📋 규정 API 응답:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // 401 에러 시 토큰 갱신 시도
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            // 순환 참조 방지를 위해 동적으로 apiClient 가져오기
            const { default: refreshClient } = await import('./api.js');
            // apiClient의 baseURL을 사용하여 상대/절대 경로 모두 처리
            const response = await refreshClient.post('/auth/refresh', {
              refresh_token: refreshToken,
            });
            
            const { access_token, refresh_token: newRefreshToken } = response.data;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', newRefreshToken);
            
            // 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // 토큰 갱신 실패 시 로그아웃 (자동 리다이렉트 제거)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('csrf_token');
          console.log('🔄 토큰 갱신 실패, 수동 로그인 필요');
          return Promise.reject(refreshError);
        }
      }
      
      // 403, 404 에러 시 사용자 삭제/비활성화 감지
      if (error.response?.status === 403 || error.response?.status === 404) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || '';
        
        // 사용자 관련 에러 메시지 확인
        if (errorMessage.includes('사용자를 찾을 수 없습니다') || 
            errorMessage.includes('삭제된 사용자') ||
            errorMessage.includes('비활성화된 사용자') ||
            errorMessage.includes('User not found')) {
          
          console.log('🚨 삭제된 사용자 감지, 자동 로그아웃:', errorMessage);
          
          // 토큰 정리
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('csrf_token');
          
          // 로그아웃 알림 (자동 리다이렉트 제거)
          console.log('🚨 삭제된 사용자 감지:', errorMessage);
          // alert('계정이 삭제되었거나 비활성화되었습니다. 다시 로그인해주세요.');
          // window.location.href = '/login';
          return Promise.reject(error);
        }
      }
      
      // 일반적인 에러 처리
      if (error.response) {
        // 서버에서 응답을 받았지만 에러 상태
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            console.error('잘못된 요청:', data.message || data.detail);
            break;
          case 422:
            console.error('요청 데이터 검증 오류:', data.detail || data.message || data);
            break;
          case 403:
            console.error('권한이 없습니다:', data.message || data.detail);
            break;
          case 404:
            console.error('리소스를 찾을 수 없습니다:', data.message || data.detail);
            break;
          case 500:
            console.error('서버 에러:', data.message || data.detail);
            break;
          default:
            console.error('알 수 없는 에러:', data.message || data.detail);
        }
      } else if (error.request) {
        // 요청을 보냈지만 응답을 받지 못함
        console.error('네트워크 오류: 네트워크 연결을 확인해주세요.', error.message);
      } else {
        // 요청 설정 중 에러
        console.error('요청 설정 에러:', error.message);
      }
      
      return Promise.reject(error);
    }
  );
};

// 통합 에러 핸들러
export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data.message || error.response.data.detail || '서버 에러가 발생했습니다.';
  } else if (error.request) {
    return '네트워크 연결을 확인해주세요.';
  } else {
    return '알 수 없는 에러가 발생했습니다.';
  }
};

