import { apiClient } from './httpClient';

/**
 * 클럽 관련 API 클라이언트
 * old-ts-version/apps/mobile-web/src/lib/clubsApi.ts를 JSX로 변환
 */

// ===== 타입 정의 (JSDoc) =====

/**
 * @typedef {Object} Club
 * @property {string} id - 클럽 ID
 * @property {string} display_id - CLUB-48219 형태의 표시용 ID
 * @property {string} name - 클럽명
 * @property {string} type - 클럽 타입 (REGULAR/IRREGULAR)
 * @property {string} description - 클럽 설명
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} representative_name - 대표자명
 * @property {string} [additional_info] - 추가 정보
 * @property {number} member_count - 멤버 수
 * @property {string} [attachment_file] - 첨부 파일
 * @property {string} [profile_image] - 프로필 이미지
 * @property {'PENDING'|'APPROVED'|'REJECTED'} status - 클럽 상태
 * @property {'PENDING'|'APPROVED'|'REJECTED'} [membership_status] - 멤버십 상태
 * @property {'LEADER'|'MANAGER'|'MEMBER'} [membership_role] - 멤버십 역할
 * @property {string} created_at - 생성일
 * @property {string} updated_at - 수정일
 */

/**
 * @typedef {Object} ClubCreate
 * @property {string} name - 클럽명
 * @property {string} type - 클럽 타입
 * @property {string} description - 클럽 설명
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} representative_name - 대표자명
 * @property {string} [additional_info] - 추가 정보
 * @property {string} [supporting_documents] - 지원 서류
 */

/**
 * @typedef {Object} ClubApplication
 * @property {string} id - 신청 ID
 * @property {string} name - 클럽명
 * @property {string} type - 클럽 타입
 * @property {string} description - 클럽 설명
 * @property {number} member_count - 멤버 수
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} [additional_info] - 추가 정보
 * @property {string} [attachment_file] - 첨부 파일
 * @property {'PENDING'|'APPROVED'|'REJECTED'|'CANCELED'} status - 신청 상태
 * @property {string} applicant_id - 신청자 ID
 * @property {string} created_at - 신청일
 * @property {string} updated_at - 수정일
 */

/**
 * @typedef {Object} ClubApplicationCreate
 * @property {string} name - 클럽명
 * @property {string} type - 클럽 타입
 * @property {string} description - 클럽 설명
 * @property {number} member_count - 멤버 수
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} [additional_info] - 추가 정보
 * @property {string} [attachment_file] - 첨부 파일
 */

/**
 * @typedef {Object} ClubMember
 * @property {string} id - 멤버 ID
 * @property {string} user_id - 사용자 ID
 * @property {string} club_id - 클럽 ID
 * @property {'LEADER'|'MANAGER'|'MEMBER'} role - 역할
 * @property {string} joined_at - 가입일
 * @property {User} user - 사용자 정보
 */

/**
 * @typedef {Object} ClubNotice
 * @property {string} id - 공지 ID
 * @property {string} club_id - 클럽 ID
 * @property {string} title - 제목
 * @property {string} content - 내용
 * @property {string} created_at - 생성일
 * @property {string} updated_at - 수정일
 */

/**
 * @typedef {Object} ClubRegulation
 * @property {string} id - 규정 ID
 * @property {string} club_id - 클럽 ID
 * @property {string} title - 제목
 * @property {string} content - 내용
 * @property {string} created_at - 생성일
 * @property {string} updated_at - 수정일
 */

/**
 * @typedef {Object} ClubMeeting
 * @property {string} id - 모임 ID
 * @property {string} name - 모임명
 * @property {string} meeting_time - 모임 시간
 * @property {string} meeting_type - 모임 타입 (ROUND/SOCIAL)
 * @property {string} status - 모임 상태
 * @property {number} participant_count - 참가자 수
 */

/**
 * @typedef {Object} ClubFee
 * @property {string} id - 회비 ID
 * @property {string} club_id - 클럽 ID
 * @property {string} type - 회비 유형
 * @property {number} amount - 금액
 * @property {string} due_date - 납부일
 * @property {string} created_at - 생성일
 */

/**
 * @typedef {Object} ClubActivity
 * @property {string} id - 활동 ID
 * @property {string} club_id - 클럽 ID
 * @property {string} title - 활동 제목
 * @property {string} description - 활동 설명
 * @property {string} date - 활동 날짜
 */

/**
 * @typedef {Object} ClubStats
 * @property {number} total_members - 총 멤버 수
 * @property {number} active_members - 활성 멤버 수
 * @property {number} total_meetings - 총 모임 수
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data - 데이터 배열
 * @property {number} total - 총 개수
 * @property {number} page - 현재 페이지
 * @property {number} limit - 페이지당 개수
 */

/**
 * @typedef {Object} MessageResponse
 * @property {string} message - 메시지
 */

// ===== API 클라이언트 =====

export const clubsApi = {
  registerClubApplication: async (applicationData) => {
    const response = await apiClient.post('/clubs/register', applicationData);
    return response.data;
  },

  getMyClubApplications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/clubs/applications/my?${queryParams.toString()}`);
    return response.data;
  },

  getClubApplication: async (applicationId) => {
    const response = await apiClient.get(`/clubs/applications/${applicationId}`);
    return response.data;
  },

  updateClubApplication: async (applicationId, data) => {
    const response = await apiClient.put(`/clubs/applications/${applicationId}`, data);
    return response.data;
  },

  cancelClubApplication: async (applicationId) => {
    const response = await apiClient.put(`/clubs/applications/${applicationId}/cancel`);
    return response.data;
  },

  getClubs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);

    const response = await apiClient.get(`/clubs/?${queryParams.toString()}`);
    return response.data;
  },

  getMyClubs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/clubs/my?${queryParams.toString()}`);
    return response.data;
  },

  getClub: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}`);
    return response.data;
  },

  joinClub: async (clubId) => {
    const response = await apiClient.post(`/clubs/${clubId}/join`);
    return response.data;
  },

  leaveClub: async (clubId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/leave`);
    return response.data;
  },

  getClubMembers: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);

    const response = await apiClient.get(`/clubs/${clubId}/members?${queryParams.toString()}`);
    return response.data;
  },

  updateClubMemberRole: async (clubId, memberId, data) => {
    const response = await apiClient.put(`/clubs/${clubId}/members/${memberId}/role`, data);
    return response.data;
  },

  removeClubMember: async (clubId, memberId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/members/${memberId}`);
    return response.data;
  },

  getClubNotices: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());

    const response = await apiClient.get(`/clubs/${clubId}/notices?${queryParams.toString()}`);
    return response.data;
  },

  createClubNotice: async (clubId, data) => {
    const response = await apiClient.post(`/clubs/${clubId}/notices`, data);
    return response.data;
  },

  updateClubNotice: async (clubId, noticeId, data) => {
    const response = await apiClient.put(`/clubs/${clubId}/notices/${noticeId}`, data);
    return response.data;
  },

  deleteClubNotice: async (clubId, noticeId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/notices/${noticeId}`);
    return response.data;
  },

  getClubRegulations: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/clubs/${clubId}/regulations?${queryParams.toString()}`);
    return response.data;
  },

  getClubRegulation: async (clubId, regulationId) => {
    const response = await apiClient.get(`/clubs/${clubId}/regulations/${regulationId}`);
    return response.data;
  },

  createClubRegulation: async (clubId, data) => {
    const response = await apiClient.post(`/clubs/${clubId}/regulations`, data);
    return response.data;
  },

  updateClubRegulation: async (clubId, regulationId, data) => {
    const response = await apiClient.put(`/clubs/${clubId}/regulations/${regulationId}`, data);
    return response.data;
  },

  deleteClubRegulation: async (clubId, regulationId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/regulations/${regulationId}`);
    return response.data;
  },

  getClubMeetings: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.meeting_type) queryParams.append('meeting_type', params.meeting_type);

    const response = await apiClient.get(`/clubs/${clubId}/meetings?${queryParams.toString()}`);
    return response.data;
  },

  getClubFees: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/clubs/${clubId}/fees?${queryParams.toString()}`);
    return response.data;
  },

  createClubFee: async (clubId, data) => {
    const response = await apiClient.post(`/clubs/${clubId}/fees`, data);
    return response.data;
  },

  updateClubFee: async (clubId, feeId, data) => {
    const response = await apiClient.put(`/clubs/${clubId}/fees/${feeId}`, data);
    return response.data;
  },

  deleteClubFee: async (clubId, feeId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/fees/${feeId}`);
    return response.data;
  },

  getClubActivities: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/clubs/${clubId}/activities?${queryParams.toString()}`);
    return response.data;
  },

  createClubActivity: async (clubId, data) => {
    const response = await apiClient.post(`/clubs/${clubId}/activities`, data);
    return response.data;
  },

  updateClubActivity: async (clubId, activityId, data) => {
    const response = await apiClient.put(`/clubs/${clubId}/activities/${activityId}`, data);
    return response.data;
  },

  deleteClubActivity: async (clubId, activityId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/activities/${activityId}`);
    return response.data;
  },

  getClubStats: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/stats`);
    return response.data;
  },

  uploadClubFile: async (clubId, formData) => {
    const response = await apiClient.upload(`/clubs/${clubId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default clubsApi;
