import axios from 'axios';
import { setupResponseInterceptor } from './errorHandler.js';

// API Base URL 유틸리티 함수 (export하여 다른 파일에서도 사용 가능)
export const getApiBaseUrl = () => {
  // 프로덕션 환경에서는 상대 경로 사용 (nginx 프록시 활용)
  if (import.meta.env.PROD) {
    return ''; // 상대 경로 사용 (빈 문자열 = 현재 도메인)
  }
  
  // 개발 환경: 환경 변수 필수
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiBaseUrl) {
    console.error('VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.');
    throw new Error('VITE_API_BASE_URL 환경 변수가 필요합니다.');
  }
  
  // HTTP URL을 HTTPS로 자동 변환
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (apiBaseUrl.startsWith('http://')) {
      return apiBaseUrl.replace('http://', 'https://');
    }
  }
  
  return apiBaseUrl;
};

// API 기본 설정
const API_BASE_URL = getApiBaseUrl();
const API_VERSION = '/api/v1';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 토큰 전송:', config.url, token.substring(0, 20) + '...');
    } else {
      console.log('❌ 토큰 없음:', config.url);
      console.log('❌ localStorage 전체:', localStorage);
    }
    
    // 규정 관련 API 호출 로그 추가
    if (config.url?.includes('regulations')) {
      console.log('📋 규정 API 호출:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        data: config.data
      });
    }
    
    // CSRF 토큰 추가 (모든 변경 메서드마다 최신 토큰을 발급받아 사용)
    const method = (config.method || 'get').toUpperCase();
    const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (needsCsrf) {
      try {
        // apiClient의 baseURL을 사용하여 상대/절대 경로 모두 처리
        // baseURL이 이미 설정되어 있으므로 상대 경로만 사용
        const csrfUrl = `${apiClient.defaults.baseURL}/auth/csrf-token`;
        const resp = await fetch(csrfUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!resp.ok) {
          throw new Error(`CSRF token request failed: ${resp.status}`);
        }
        const data = await resp.json();
        const csrfToken = data?.csrf_token;
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      } catch (e) {
        console.warn('CSRF 토큰 발급 실패(요청 계속 진행):', e);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
setupResponseInterceptor(apiClient);

// API 클라이언트 유틸리티 함수들
export const apiUtils = {
  // 에러 메시지 추출
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.message) {
      return error.message;
    }
    return '알 수 없는 오류가 발생했습니다.';
  },
  
  // 응답 데이터 추출
  getResponseData: (response) => {
    return response.data;
  },
  
  // 성공 응답 확인
  isSuccessResponse: (response) => {
    return response.status >= 200 && response.status < 300;
  },
  
  // 에러 응답 확인
  isErrorResponse: (response) => {
    return response.status >= 400;
  },
};

// HTTP 메서드별 API 호출 함수
export const api = {
  // GET 요청
  get: async (url, config) => {
    const response = await apiClient.get(url, config);
    return response.data;
  },

  // POST 요청
  post: async (url, data, config) => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  // PUT 요청
  put: async (url, data, config) => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  // PATCH 요청
  patch: async (url, data, config) => {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  },

  // DELETE 요청
  delete: async (url, config) => {
    const response = await apiClient.delete(url, config);
    return response.data;
  },

  // 파일 업로드
  upload: async (url, formData, config) => {
    const response = await apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  },
};

// 토큰 관리 함수
export const tokenManager = {
  // 토큰 저장
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },

  // 토큰 가져오기
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),

  // 토큰 삭제
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('csrf_token');
  },

  // 토큰 유효성 검사
  isTokenValid: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
};

// CSRF 토큰 관리
export const csrfManager = {
  // CSRF 토큰 저장
  setToken: (token) => {
    localStorage.setItem('csrf_token', token);
  },

  // CSRF 토큰 가져오기
  getToken: () => localStorage.getItem('csrf_token'),

  // CSRF 토큰 삭제
  clearToken: () => {
    localStorage.removeItem('csrf_token');
  },
};

// 라운딩 관리 API
export const roundsApi = {
  // 라운딩 목록 조회
  getRounds: (params) => api.get('/rounds', { params }),
  
  // 라운딩 상세 조회
  getRound: (id) => api.get(`/rounds/${id}`),
  
  // 라운딩 생성
  createRound: (data, config = {}) => api.post('/rounds/', data, config),
  
  // 라운딩 수정
  updateRound: (id, data) => api.put(`/rounds/${id}`, data),
  
  // 라운딩 삭제
  deleteRound: (id) => api.delete(`/rounds/${id}`),
  
  // 라운딩 참가
  joinRound: (id) => api.post(`/rounds/${id}/join`),
  
  // 라운딩 탈퇴
  leaveRound: (id) => api.delete(`/rounds/${id}/leave`),
  
  // 라운딩 취소
  cancelRound: (id, reason) => api.post(`/meetings/${id}/cancel`, { reason }),
  
  // 라운딩 참가자 목록 조회
  getRoundParticipants: (id) => api.get(`/rounds/${id}/participants`),
  
  // 참가자 상태 변경
  updateParticipantStatus: (roundId, participantId, data) => 
    api.patch(`/rounds/${roundId}/participants/${participantId}/status`, data),
  
  // 참가자 역할 변경
  updateParticipantRole: (roundId, participantId, data) => 
    api.patch(`/rounds/${roundId}/participants/${participantId}/role`, data),
  
  // 참가자 제거
  removeParticipant: (roundId, participantId) => 
    api.delete(`/rounds/${roundId}/participants/${participantId}`),
  
  // 팀 목록 조회
  getRoundTeams: (id) => api.get(`/rounds/${id}/teams`),
  
  // 팀 생성
  createTeam: (roundId, data) => api.post(`/rounds/${roundId}/teams`, data),
  
  // 팀 삭제
  deleteTeam: (roundId, teamId) => api.delete(`/rounds/${roundId}/teams/${teamId}`),
  
  // 팀 멤버 추가
  addTeamMember: (roundId, teamId, userId) => 
    api.post(`/rounds/${roundId}/teams/${teamId}/members`, { user_id: userId }),
  
  // 팀 멤버 제거
  removeTeamMember: (roundId, teamId, memberId) => 
    api.delete(`/rounds/${roundId}/teams/${teamId}/members/${memberId}`),
  
  // 자동 팀 구성
  autoFormTeams: (meetingId, data) => api.post(`/meetings/${meetingId}/teams/auto-formation`, data),
  
  // 팀 목록 조회 (meeting_id 기반)
  getTeamsByMeeting: (meetingId) => api.get(`/teams?meeting_id=${meetingId}`),
  
  // 팀 생성 (meeting_id 기반)
  createTeamByMeeting: (meetingId, data) => api.post(`/teams?meeting_id=${meetingId}`, data),
  
  // 팀 수정
  updateTeam: (teamId, data) => api.put(`/teams/${teamId}`, data),
  
  // 팀 삭제 (meeting_id 기반)
  deleteTeamByMeeting: (teamId) => api.delete(`/teams/${teamId}`),
  
  // 참가자 점수 목록 조회
  getParticipantScores: (roundId, participantId, params) => 
    api.get(`/rounds/${roundId}/participants/${participantId}/scores`, { params }),
  
  // 참가자 점수 통계 조회
  getParticipantScoreStats: (roundId, participantId) => 
    api.get(`/rounds/${roundId}/participants/${participantId}/scores/stats`),
  
  // 점수 생성
  createScore: (roundId, participantId, data) => 
    api.post(`/rounds/${roundId}/participants/${participantId}/scores`, data),
  
  // 점수 수정
  updateScore: (roundId, participantId, scoreId, data) => 
    api.put(`/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`, data),
  
  // 점수 삭제
  deleteScore: (roundId, participantId, scoreId) => 
    api.delete(`/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`),
  
  // 라운딩 비용 목록 조회
  getRoundExpenses: (id, params) => api.get(`/rounds/${id}/expenses`, { params }),
  
  // 라운딩 비용 생성
  createRoundExpense: (roundId, data) => api.post(`/rounds/${roundId}/expenses`, data),
  
  // 비용 수정
  updateExpense: (roundId, expenseId, data) => 
    api.put(`/rounds/${roundId}/expenses/${expenseId}`, data),
  
  // 비용 삭제
  deleteExpense: (roundId, expenseId) => 
    api.delete(`/rounds/${roundId}/expenses/${expenseId}`),
  
  // 모임 알림 발송
  sendMeetingNotification: (meetingId, data) => 
    api.post(`/rounds/${meetingId}/notifications`, data),
  
  // 모임 리마인더 발송
  sendMeetingReminder: (meetingId) => api.post(`/rounds/${meetingId}/reminder`),
  
  // 알림 관련 API
  getNotifications: (params) => 
    api.get('/users/notifications', { params }),
  markNotificationAsRead: (notificationId) => api.put(`/users/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => api.put('/users/notifications/read-all'),
  
  // 워크플로우 API
  applyToMeeting: (meetingId) => api.post(`/meetings/${meetingId}/apply`),
  approveParticipant: (meetingId, participantId) => api.post(`/meetings/${meetingId}/participants/${participantId}/approve`),
  rejectParticipant: (meetingId, participantId) => api.post(`/meetings/${meetingId}/participants/${participantId}/reject`),
  closeApplicationEarly: (meetingId) => api.post(`/meetings/${meetingId}/close-application`),
  getApplicationStatus: (meetingId) => api.get(`/meetings/${meetingId}/application-status`),
  startTeamFormation: (meetingId) => api.post(`/meetings/${meetingId}/start-team-formation`),
  confirmTeamFormation: (meetingId) => api.post(`/meetings/${meetingId}/teams/confirm`),
  
  // 모임 진행 시작
  startRounding: (meetingId) => api.post(`/meetings/${meetingId}/start-rounding`),
  // 라운딩 종료
  completeRounding: (meetingId) => api.post(`/meetings/${meetingId}/complete-rounding`),
  // 간단 점수 입력
  submitSimpleScore: (meetingId, participantId, data) => 
    api.post(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data),
  // 간단 점수 수정
  updateSimpleScore: (meetingId, participantId, data) => 
    api.put(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data),
  confirmTeamMember: (meetingId, teamId, memberId) => api.post(`/meetings/${meetingId}/teams/${teamId}/members/${memberId}/confirm`),
  completeMeeting: (meetingId) => api.post(`/meetings/${meetingId}/complete`),
  confirmSettlement: (meetingId) => api.post(`/meetings/${meetingId}/settlement/confirm`),
  
  // 정산 API
  createRoundingSettlement: (meetingId, data) => api.post(`/meetings/${meetingId}/settlement/rounding`, data),
  getMySettlement: (meetingId) => api.get(`/meetings/${meetingId}/settlement/my`),
  createEventSettlement: (meetingId, data) => api.post(`/meetings/${meetingId}/settlement/social`, data),
  getMeetingSettlement: (meetingId) => api.get(`/meetings/${meetingId}/settlement`),
  getAvailableParticipants: (meetingId) => api.get(`/meetings/${meetingId}/settlement/available-participants`),
  
  // 게스트 관리 API
  addGuest: (meetingId, guestData) => api.post(`/meetings/${meetingId}/guests`, guestData),
  getGuests: (meetingId) => api.get(`/meetings/${meetingId}/guests`)
};

// 소셜 모임 관리 API
export const socialsApi = {
  // 소셜 모임 생성
  createSocial: (data, config = {}) => api.post('/socials/', data, config),
  
  // 소셜 모임 목록 조회
  getSocials: (params) => api.get('/socials', { params }),
  
  // 소셜 모임 상세 조회
  getSocial: (id) => api.get(`/socials/${id}`),
  
  // 소셜 모임 수정
  updateSocial: (id, data) => api.put(`/socials/${id}`, data),
  
  // 소셜 모임 삭제
  deleteSocial: (id) => api.delete(`/socials/${id}`),
  
  // 소셜 모임 참가
  joinSocial: (id) => api.post(`/socials/${id}/join`),
  
  // 소셜 모임 탈퇴
  leaveSocial: (id) => api.delete(`/socials/${id}/leave`),
  
  // 소셜 모임 취소
  cancelSocial: (id, reason) => api.post(`/socials/${id}/cancel`, { reason }),
};

// 알림 관리 API
export const notificationsApi = {
  // 알림 목록 조회
  getNotifications: (params) => {
    const { filter, ...rest } = params || {};
    const queryParams = { ...rest };
    if (filter && filter !== 'all') {
      queryParams.status_filter = filter === 'unread' ? 'UNREAD' : 'READ';
    }
    return api.get('/users/notifications', { params: queryParams });
  },
  
  // 알림 읽음 처리
  markAsRead: (notificationId) => api.put(`/users/notifications/${notificationId}/read`),
  
  // 전체 알림 읽음 처리
  markAllAsRead: () => api.put('/users/notifications/read-all'),
  
  // 알림 삭제
  deleteNotification: (notificationId) => api.delete(`/users/notifications/${notificationId}`),
};

// 사용자 관리 API
export const usersApi = {
  // 내 프로필 조회
  getMyProfile: () => api.get('/users/profile'),
  
  // 내 프로필 수정
  updateMyProfile: (data) => api.put('/users/me', data),
  
  // 사용자 목록 조회 (관리자)
  getUsers: (params) => api.get('/users', { params }),
  
  // 사용자 상세 조회
  getUser: (id) => api.get(`/users/${id}`),
  
  // 사용자 생성 (관리자)
  createUser: (data) => api.post('/users', data),
  
  // 사용자 수정 (관리자)
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  
  // 사용자 삭제 (관리자)
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // 핸디캡 조회
  getUserHandicap: (id) => api.get(`/users/${id}/handicap`),
  
  // 핸디캡 수정 (initial_handicap만 수정 가능)
  updateUserHandicap: (id, data) => api.put(`/users/${id}/handicap`, data),
  
  // 핸디캡 자동 계산
  calculateHandicap: (id) => api.get(`/users/handicap/calculate/${id}`),
  
  // 최근 경기 스코어 히스토리 조회
  getUserScoreHistory: (id, limit = 10) => api.get(`/users/${id}/score-history`, { params: { limit } }),
  
  // 직전 대회 성적 조회
  getLastMeetingResult: (id) => api.get(`/users/${id}/last-meeting-result`),
  
  // 라운딩 종료된 모임 목록 조회
  getMyRoundingMeetings: (params) => api.get('/users/me/rounding-meetings', { params }),
  getRoundingStats: () => api.get('/users/me/rounding-stats'),
  
  // 내 참여 모임 목록 조회
  getMyMeetings: (params) => api.get('/users/my-meetings', { params }),
  
  // 사용자 통계 (관리자)
  getUserStats: () => api.get('/users/stats'),
};

// 약관 조회 함수 (별도 export)
export const getTerms = async (type) => {
  const response = await apiClient.get(`/auth/terms/${type}`);
  return response.data;
};

// 공지사항 관리 API
export const noticesApi = {
  // 공지사항 목록 조회
  getNotices: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());
    if (params.is_important !== undefined) queryParams.append('is_important', params.is_important.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get(`/notices?${queryParams.toString()}`);
    return response.data;
  },
  
  // 공지사항 상세 조회
  getNotice: async (id) => {
    const response = await apiClient.get(`/notices/${id}`);
    return response.data;
  },
};

// FAQ 관리 API
export const faqApi = {
  // FAQ 목록 조회
  getFaqs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());
    
    const response = await apiClient.get(`/faq?${queryParams.toString()}`);
    return response.data;
  },
  
  // FAQ 상세 조회
  getFaq: async (id) => {
    const response = await apiClient.get(`/faq/${id}`);
    return response.data;
  },
  
  // FAQ 카테고리 목록 조회
  getCategories: async () => {
    const response = await apiClient.get('/faq-categories');
    return response.data;
  },
};

export const clubApi = {
  // 클럽 목록 조회
  getClubs: (params) => api.get('/clubs', { params }),
  
  // 내 클럽 목록 조회
  getMyClubs: (params) => api.get('/clubs/my', { params }),
  
  // 클럽 상세 조회
  getClub: (id) => api.get(`/clubs/${id}`),
  
  // 클럽 생성
  createClub: (data) => api.post('/clubs', data),
  
  // 클럽 수정
  updateClub: (id, data) => api.put(`/clubs/${id}`, data),
  
  // 클럽 삭제
  deleteClub: (id) => api.delete(`/clubs/${id}`),
  
  // 클럽 신청 목록 조회
  getClubApplications: (params) => api.get('/clubs/applications', { params }),
  
  // 클럽 신청 상세 조회
  getClubApplication: (id) => api.get(`/clubs/applications/${id}`),
  
  // 클럽 신청 승인/거부
  updateClubApplication: (id, data) => api.patch(`/clubs/applications/${id}`, data),
  
  // 클럽 멤버십 정보
  getClubMembership: (clubId) => api.get(`/clubs/${clubId}/membership`),
  
  // 약관 조회
  getTerms,
};

// clubsApi re-export
export { clubsApi } from './clubsApi';

export default apiClient;

