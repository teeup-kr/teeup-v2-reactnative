import { api, tokenManager, csrfManager } from './api';
import apiClient from './api';
import { config } from '../config/env';

// 인증 API 함수들
export const authApi = {
  // 로그인
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // 회원가입
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // 로그아웃
  logout: async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      tokenManager.clearTokens();
      csrfManager.clearToken();
    }
  },

  // 토큰 갱신
  refreshToken: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 비밀번호 변경
  changePassword: async (passwordData) => {
    // 백엔드가 Query 파라미터로 받으므로 params로 전송
    await api.put('/auth/change-password', null, {
      params: {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      }
    });
  },

  // Google OAuth 로그인
  googleLogin: async (oauthData) => {
    const response = await api.post('/auth/oauth/google/callback', oauthData);
    console.log('🔥 Google OAuth API 응답:', response);
    return response.data || response.value || response;
  },

  // 이메일 인증
  verifyEmail: async (token) => {
    await api.post('/auth/verify-email', { token });
  },

  // 이메일 인증 재전송
  resendVerification: async () => {
    await api.post('/auth/resend-verification');
  },

  // 비밀번호 재설정 요청
  requestPasswordReset: async (data) => {
    await api.post('/auth/request-password-reset', data);
  },

  // 비밀번호 재설정
  resetPassword: async (token, newPassword) => {
    await api.post('/auth/reset-password', { token, new_password: newPassword });
  },

  // 회원 탈퇴
  deleteAccount: async () => {
    await api.delete('/auth/withdraw');
  },
};

// 인증 상태 관리 함수들
export const authUtils = {
  // 로그인 상태 확인
  isAuthenticated: () => {
    return tokenManager.isTokenValid();
  },

  // 관리자 권한 확인
  isAdmin: (user) => {
    return user?.role === 'admin';
  },

  // 슈퍼 관리자 권한 확인 (더 이상 사용하지 않음)
  isSuperAdmin: (_user) => {
    return false; // SUPER_ADMIN 역할 제거됨
  },

  // 토큰 저장 및 사용자 정보 반환
  saveAuthData: (authResponse) => {
    console.log('🔥 saveAuthData 호출됨!', authResponse);
    
    // authResponse가 undefined인 경우 처리
    if (!authResponse) {
      throw new Error('인증 응답이 없습니다.');
    }
    
    // access_token이 없는 경우 처리
    if (!authResponse.access_token) {
      throw new Error('액세스 토큰이 없습니다.');
    }
    
    console.log('🔥 토큰 저장 중:', authResponse.access_token?.substring(0, 20) + '...');
    tokenManager.setTokens(authResponse.access_token, authResponse.refresh_token);
    console.log('🔥 토큰 저장 완료, localStorage 확인:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
    
    // user 객체가 없는 경우 처리
    if (!authResponse.user) {
      throw new Error('사용자 정보가 없습니다.');
    }
    
    return authResponse.user;
  },

  // 인증 데이터 초기화
  clearAuthData: () => {
    tokenManager.clearTokens();
    csrfManager.clearToken();
  },

  // JWT 토큰에서 사용자 정보 추출
  getUserFromToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        nickname: payload.nickname,
        role: payload.role,
      };
    } catch {
      return null;
    }
  },
};

// Google OAuth 관련 함수들
export const googleAuth = {
  // Google OAuth URL 생성
  getAuthUrl: () => {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    
    return `${baseUrl}?${params.toString()}`;
  },

  // Google OAuth 콜백 처리
  handleCallback: async (code, state) => {
    return await authApi.googleLogin({ provider: 'google', code, state });
  },
};

export default authApi;



