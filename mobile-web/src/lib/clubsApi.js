import apiClient from './api.js';

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
 * @property {'REGULAR'|'IRREGULAR'} type - 클럽 타입
 * @property {string} description - 클럽 설명
 * @property {number} member_count - 멤버 수
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} [additional_info] - 추가 정보
 * @property {string} attachment_file - 첨부 파일명
 */

/**
 * @typedef {Object} ClubMembership
 * @property {string} id - 멤버십 ID
 * @property {string} club_id - 클럽 ID
 * @property {string} user_id - 사용자 ID
 * @property {'LEADER'|'MANAGER'|'MEMBER'} role - 역할
 * @property {'PENDING'|'APPROVED'|'REJECTED'} status - 멤버십 상태
 * @property {string} [term_start] - 임기 시작일
 * @property {string} [term_end] - 임기 종료일
 * @property {string} created_at - 가입일
 * @property {string} updated_at - 수정일
 * @property {string} user_nickname - 사용자 닉네임
 * @property {string} [user_realname] - 사용자 실명
 * @property {string} [user_phone_number] - 사용자 전화번호
 * @property {string} [user_birthdate] - 사용자 생년월일
 * @property {string} [user_gender] - 사용자 성별
 * @property {number} [user_handicap] - 사용자 핸디캡
 * @property {number} [user_average_score] - 사용자 평균 스코어
 * @property {string} [additional_info] - 추가 정보
 * @property {string} [contact_info] - 연락처 정보
 */

/**
 * @typedef {Object} ClubMembersResponse
 * @property {ClubMembership[]} members - 멤버 목록
 * @property {number} total_members - 총 멤버 수
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {any[]} data - 데이터 목록
 * @property {number} total - 총 개수
 * @property {number} page - 현재 페이지
 * @property {number} limit - 페이지당 개수
 * @property {number} total_pages - 총 페이지 수
 */

/**
 * @typedef {Object} MessageResponse
 * @property {string} message - 메시지
 * @property {boolean} success - 성공 여부
 */

// ===== 클럽 API 함수들 =====

export const clubsApi = {
  // ===== 클럽 등록 신청 관련 =====
  
  /**
   * 클럽 등록 신청
   * @param {ClubApplicationCreate} applicationData - 신청 데이터
   * @returns {Promise<MessageResponse & {club_id: string}>}
   */
  registerClubApplication: async (applicationData) => {
    const response = await apiClient.post('/clubs/register', applicationData);
    return response.data;
  },

  /**
   * 내 클럽 신청 내역 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @returns {Promise<PaginatedResponse<ClubApplication>>}
   */
  getMyClubApplications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/clubs/applications/my?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 클럽 신청 상세 조회
   * @param {string} applicationId - 신청 ID
   * @returns {Promise<ClubApplication>}
   */
  getClubApplicationDetail: async (applicationId) => {
    const response = await apiClient.get(`/clubs/applications/${applicationId}`);
    const d = response.data || {};
    // 백엔드 필드(name,type,applicant_id) → 프런트 사용 필드(club_name,club_type,applicant_name)
    return {
      ...d,
      club_name: d.club_name || d.name,
      club_type: d.club_type || d.type,
      applicant_name: d.applicant_name || d.applicant || d.applicant_id, // 표시용 이름이 없으면 id 표시
    };
  },

  /**
   * 클럽 신청 수정
   * @param {string} applicationId
   * @param {Partial<ClubApplicationCreate>} data - 수정 필드
   */
  updateClubApplication: async (applicationId, data) => {
    const response = await apiClient.put(`/clubs/applications/${applicationId}`, data);
    return response.data;
  },

  /**
   * 클럽 신청 취소
   * @param {string} applicationId - 신청 ID
   * @returns {Promise<MessageResponse>}
   */
  cancelClubApplication: async (applicationId) => {
    const response = await apiClient.put(`/clubs/applications/${applicationId}/cancel`);
    return response.data;
  },

  // ===== 클럽 조회 관련 =====

  /**
   * 클럽 목록 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @param {'PENDING'|'APPROVED'|'REJECTED'} [params.status_filter] - 상태 필터
   * @param {string} [params.search] - 검색어
   * @returns {Promise<PaginatedResponse<Club>>}
   */
  getClubs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/clubs/?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 내 클럽 목록 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @param {'APPROVED'|'PENDING'|'REJECTED'} [params.status_filter] - 상태 필터
   * @returns {Promise<PaginatedResponse<Club>>}
   */
  getMyClubs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status_filter) queryParams.append('status_filter', params.status_filter);

    const response = await apiClient.get(`/clubs/my?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 클럽 상세 조회
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<Club>}
   */
  getClub: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}`);
    return response.data;
  },

  // ===== 클럽 가입 관련 =====

  /**
   * 클럽 가입
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<MessageResponse>}
   */
  joinClub: async (clubId) => {
    const response = await apiClient.post(`/clubs/${clubId}/join`);
    return response.data;
  },

  /**
   * 클럽 가입 (추가 정보 포함)
   * @param {string} clubId - 클럽 ID
   * @param {Object} userInfo - 사용자 정보
   * @param {string} userInfo.nickname - 닉네임
   * @param {string} userInfo.realname - 실명
   * @param {string} userInfo.phone_number - 전화번호
   * @param {string} userInfo.birthdate - 생년월일
   * @param {'MALE'|'FEMALE'|'OTHER'} userInfo.gender - 성별
   * @param {number} [userInfo.handicap] - 핸디캡
   * @param {number} [userInfo.average_score] - 평균 스코어
   * @returns {Promise<MessageResponse>}
   */
  joinClubWithInfo: async (clubId, userInfo) => {
    const response = await apiClient.post(`/clubs/${clubId}/join`, userInfo);
    return response.data;
  },

  /**
   * 클럽 가입 신청 수정
   * @param {string} clubId - 클럽 ID
   * @param {Object} userInfo - 사용자 정보
   * @returns {Promise<MessageResponse>}
   */
  updateClubJoinApplication: async (clubId, userInfo) => {
    const response = await apiClient.put(`/clubs/${clubId}/join`, userInfo);
    return response.data;
  },

  /**
   * 클럽 탈퇴
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<MessageResponse>}
   */
  leaveClub: async (clubId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/leave`);
    return response.data;
  },

  // ===== 클럽 멤버 관리 =====

  /**
   * 클럽 멤버 목록 조회
   * @param {string} clubId - 클럽 ID
   * @param {Object} params - 쿼리 파라미터
   * @param {boolean} [params.allMembers] - 모든 멤버 조회 (대기중 포함), 기본값 false
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @returns {Promise<PaginatedResponse>}
   */
  getClubMembers: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.allMembers !== undefined) {
      queryParams.append('all_members', params.allMembers.toString());
    }
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/clubs/${clubId}/members?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 멤버 역할 변경
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @param {'LEADER'|'MANAGER'|'MEMBER'} newRole - 새로운 역할
   * @returns {Promise<MessageResponse>}
   */
  updateMemberRole: async (clubId, userId, newRole) => {
    const response = await apiClient.put(`/clubs/${clubId}/members/${userId}/role`, { 
      role: newRole 
    });
    return response.data;
  },

  /**
   * 클럽 멤버 내보내기
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<MessageResponse>}
   */
  removeClubMember: async (clubId, userId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/members/${userId}`);
    return response.data;
  },

  /**
   * 멤버십 승인
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<MessageResponse>}
   */
  approveMembership: async (clubId, userId) => {
    const response = await apiClient.post(`/clubs/${clubId}/members/${userId}/approve`);
    return response.data;
  },

  /**
   * 멤버십 거절
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @param {string} reason - 거절 사유 (선택)
   * @returns {Promise<MessageResponse>}
   */
  rejectMembership: async (clubId, userId, reason = '') => {
    const response = await apiClient.post(`/clubs/${clubId}/members/${userId}/reject`, {
      reason: reason
    });
    return response.data;
  },

  /**
   * 멤버 메모 조회
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{note: string, updated_at: string}>}
   */
  getMemberNote: async (clubId, userId) => {
    const response = await apiClient.get(`/clubs/${clubId}/members/${userId}/note`);
    return response.data;
  },

  /**
   * 멤버 메모 작성/수정
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @param {string} note - 메모 내용
   * @returns {Promise<MessageResponse>}
   */
  updateMemberNote: async (clubId, userId, note) => {
    const response = await apiClient.put(`/clubs/${clubId}/members/${userId}/note`, {
      note: note
    });
    return response.data;
  },

  // ===== 클럽 관리 =====

  /**
   * 클럽 생성
   * @param {ClubCreate} clubData - 클럽 데이터
   * @returns {Promise<Club>}
   */
  createClub: async (clubData) => {
    const response = await apiClient.post('/clubs', clubData);
    return response.data;
  },

  /**
   * 클럽 정보 수정
   * @param {string} clubId - 클럽 ID
   * @param {Partial<ClubCreate>} clubData - 수정할 클럽 데이터
   * @returns {Promise<Club>}
   */
  updateClub: async (clubId, clubData) => {
    const response = await apiClient.put(`/clubs/${clubId}`, clubData);
    return response.data;
  },

  /**
   * 클럽 삭제
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<MessageResponse>}
   */
  deleteClub: async (clubId) => {
    const response = await apiClient.delete(`/clubs/${clubId}`);
    return response.data;
  },

  // ===== 파일 업로드 =====

  /**
   * 파일 업로드
   * @param {File} file - 업로드할 파일
   * @returns {Promise<{success: boolean, message: string, filename: string, original_filename: string, file_size: number, upload_path: string}>}
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ===== 정기 회비 관리 =====

  /**
   * 정기 회비 조회
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<{has_regular_fee: boolean, regular_fee_amount?: number, regular_fee_cycle?: string, regular_fee_description?: string}>}
   */
  getRegularFee: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/regular-fee`);
    return response.data;
  },

  /**
   * 정기 회비 설정/수정
   * @param {string} clubId - 클럽 ID
   * @param {Object} feeData - 회비 데이터
   * @param {boolean} feeData.has_regular_fee - 정기 회비 여부
   * @param {number} [feeData.regular_fee_amount] - 회비 금액
   * @param {string} [feeData.regular_fee_cycle] - 회비 주기
   * @param {string} [feeData.regular_fee_description] - 회비 설명
   * @returns {Promise<MessageResponse>}
   */
  updateRegularFee: async (clubId, feeData) => {
    const response = await apiClient.put(`/clubs/${clubId}/regular-fee`, feeData);
    return response.data;
  },

  // ===== 회비 항목 관리 =====

  /**
   * 회비 항목 목록 조회
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<Array>}
   */
  getClubFees: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/fees`);
    return response.data;
  },

  /**
   * 회비 항목 생성
   * @param {string} clubId - 클럽 ID
   * @param {Object} feeData - 회비 항목 데이터
   * @returns {Promise<Object>}
   */
  createClubFee: async (clubId, feeData) => {
    const response = await apiClient.post(`/clubs/${clubId}/fees`, feeData);
    return response.data;
  },

  /**
   * 회비 항목 수정
   * @param {string} clubId - 클럽 ID
   * @param {string} feeId - 회비 항목 ID
   * @param {Object} feeData - 회비 항목 데이터
   * @returns {Promise<Object>}
   */
  updateClubFee: async (clubId, feeId, feeData) => {
    const response = await apiClient.put(`/clubs/${clubId}/fees/${feeId}`, feeData);
    return response.data;
  },

  /**
   * 회비 항목 삭제
   * @param {string} clubId - 클럽 ID
   * @param {string} feeId - 회비 항목 ID
   * @returns {Promise<Object>}
   */
  deleteClubFee: async (clubId, feeId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/fees/${feeId}`);
    return response.data;
  },

  // ===== 클럽 공지사항 관리 =====

  /**
   * 클럽 공지사항 목록 조회
   * @param {string} clubId - 클럽 ID
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @returns {Promise<PaginatedResponse>}
   */
  getClubNotices: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/clubs/${clubId}/notices?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 클럽 공지사항 상세 조회
   * @param {string} clubId - 클럽 ID
   * @param {string} noticeId - 공지사항 ID
   * @returns {Promise<Object>}
   */
  getClubNotice: async (clubId, noticeId) => {
    const response = await apiClient.get(`/clubs/${clubId}/notices/${noticeId}`);
    return response.data;
  },

  /**
   * 클럽 공지사항 생성
   * @param {string} clubId - 클럽 ID
   * @param {Object} noticeData - 공지사항 데이터
   * @param {string} noticeData.title - 제목
   * @param {string} noticeData.content - 내용
   * @param {boolean} noticeData.is_important - 중요 공지 여부
   * @returns {Promise<Object>}
   */
  createClubNotice: async (clubId, noticeData) => {
    const response = await apiClient.post(`/clubs/${clubId}/notices`, noticeData);
    return response.data;
  },

  /**
   * 클럽 공지사항 수정
   * @param {string} clubId - 클럽 ID
   * @param {string} noticeId - 공지사항 ID
   * @param {Object} noticeData - 수정할 공지사항 데이터
   * @returns {Promise<Object>}
   */
  updateClubNotice: async (clubId, noticeId, noticeData) => {
    const response = await apiClient.put(`/clubs/${clubId}/notices/${noticeId}`, noticeData);
    return response.data;
  },

  /**
   * 클럽 공지사항 삭제
   * @param {string} clubId - 클럽 ID
   * @param {string} noticeId - 공지사항 ID
   * @returns {Promise<MessageResponse>}
   */
  deleteClubNotice: async (clubId, noticeId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/notices/${noticeId}`);
    return response.data;
  },

  // ===== 클럽 규정 관리 =====

  /**
   * 클럽 규정 조회 (카테고리 및 조항 구조)
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<Object>}
   */
  getClubRegulations: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/regulations`);
    return response.data;
  },

  /**
   * 클럽 규정 목록 조회
   * @param {string} clubId - 클럽 ID
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @returns {Promise<PaginatedResponse>}
   */
  getClubRegulationsList: async (clubId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/clubs/${clubId}/regulations/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('API 호출:', { url, clubId, params });
    
    try {
      const response = await apiClient.get(url);
      console.log('API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('API 에러:', error);
      throw error;
    }
  },

  /**
   * 클럽 규정 생성
   * @param {string} clubId - 클럽 ID
   * @param {Object} regulationData - 규정 데이터
   * @returns {Promise<Object>}
   */
  createClubRegulation: async (clubId, regulationData) => {
    const response = await apiClient.post(`/clubs/${clubId}/regulations`, regulationData);
    return response.data;
  },

  /**
   * 클럽 규정 상세 조회
   * @param {string} clubId - 클럽 ID
   * @param {string} regulationId - 규정 ID
   * @returns {Promise<Object>}
   */
  getClubRegulation: async (clubId, regulationId) => {
    const response = await apiClient.get(`/clubs/${clubId}/regulations/${regulationId}`);
    return response.data;
  },

  /**
   * 클럽 규정 수정
   * @param {string} clubId - 클럽 ID
   * @param {string} regulationId - 규정 ID
   * @param {Object} regulationData - 수정할 규정 데이터
   * @returns {Promise<Object>}
   */
  updateClubRegulation: async (clubId, regulationId, regulationData) => {
    const response = await apiClient.put(`/clubs/${clubId}/regulations/${regulationId}`, regulationData);
    return response.data;
  },

  /**
   * 클럽 규정 삭제
   * @param {string} clubId - 클럽 ID
   * @param {string} regulationId - 규정 ID
   * @returns {Promise<void>}
   */
  deleteClubRegulation: async (clubId, regulationId) => {
    await apiClient.delete(`/clubs/${clubId}/regulations/${regulationId}`);
  },

  // ===== 기타 유틸리티 =====

  /**
   * 가입 신청 취소
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<MessageResponse>}
   */
  cancelMembership: async (clubId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/membership`);
    return response.data;
  },

  /**
   * 리더십 양도
   * @param {string} clubId - 클럽 ID
   * @param {Object} transferData - 양도 데이터
   * @param {string} transferData.new_leader_id - 새로운 리더 ID
   * @param {string} [transferData.current_leader_new_role] - 현재 리더의 새로운 역할
   * @returns {Promise<MessageResponse>}
   */
  transferLeadership: async (clubId, transferData) => {
    const response = await apiClient.post(`/clubs/${clubId}/transfer-leadership`, transferData);
    return response.data;
  },

  /**
   * 활성화된 모임 체크
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<any>}
   */
  checkActiveMeetings: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/active-meetings-check`);
    return response.data;
  },

  /**
   * 클럽 모임 목록 조회
   * @param {string} clubId - 클럽 ID
   * @param {Object} params - 쿼리 파라미터
   * @param {'round'|'social'} [params.meeting_type] - 모임 타입
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @returns {Promise<any>}
   */
  getClubMeetings: async (clubId, params = {}) => {
    const response = await apiClient.get(`/meetings/clubs/${clubId}`, { params });
    return response.data;
  },
};

export default clubsApi;