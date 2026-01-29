import { tokenStorage } from '../tokenStorage';

import { apiClient } from './apiClient';

async function saveAuthData(authResponse) {
  if (!authResponse?.access_token) {
    throw new Error('액세스 토큰이 없습니다.');
  }

  await tokenStorage.setTokens(authResponse.access_token, authResponse.refresh_token);
  if (authResponse.user) {
    await tokenStorage.setUser(authResponse.user);
  }

  return authResponse.user;
}

function buildNotificationParams(params = {}) {
  const { filter, ...rest } = params;
  const queryParams = { ...rest };

  if (filter && filter !== 'all') {
    queryParams.status_filter = filter === 'unread' ? 'UNREAD' : 'READ';
  }

  return queryParams;
}

function buildClubStatusParams(params = {}) {
  const { status, status_filter: statusFilter, ...rest } = params;
  return {
    ...rest,
    ...(statusFilter ? { status_filter: statusFilter } : {}),
    ...(!statusFilter && status ? { status_filter: status } : {}),
  };
}

async function login(credentials) {
  const response = await apiClient.post('/auth/login', credentials, { auth: false });
  await saveAuthData(response);
  return response;
}

async function register(userData) {
  return apiClient.post('/auth/register', userData, { auth: false });
}

async function refreshToken(refreshToken) {
  return apiClient.post('/auth/refresh', { refresh_token: refreshToken }, { auth: false });
}

async function getCurrentUser() {
  return apiClient.get('/auth/me');
}

async function changePassword(passwordData) {
  return apiClient.put('/auth/change-password', null, {
    params: {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
      confirm_password: passwordData.confirm_password,
    },
  });
}

async function requestPasswordReset(data) {
  return apiClient.post('/auth/request-password-reset', data, { auth: false });
}

async function resetPassword(token, newPassword) {
  return apiClient.post('/auth/reset-password', { token, new_password: newPassword }, { auth: false });
}

async function verifyEmail(token) {
  return apiClient.post('/auth/verify-email', { token }, { auth: false });
}

async function resendVerification() {
  return apiClient.post('/auth/resend-verification', null, { auth: false });
}

async function checkEmail(email) {
  return apiClient.get('/auth/check-email', { params: { email }, auth: false });
}

async function checkNickname(nickname) {
  return apiClient.get('/auth/check-nickname', { params: { nickname }, auth: false });
}

async function googleLogin(oauthData) {
  try {
    const response = await apiClient.post('/auth/oauth/google/callback', oauthData, { auth: false });
    await saveAuthData(response);
    return response;
  } catch (error) {
    // 403 응답이고 약관 동의 전용 토큰이 있는 경우
    if (error.status === 403 && error.requiresTermsAgreement && error.termsAgreementToken) {
      // 약관 동의 전용 토큰 저장
      await tokenStorage.setTermsAgreementToken(error.termsAgreementToken);
    }
    throw error;
  }
}

async function agreeToTerms(termsIds) {
  // 약관 동의 전용 토큰 사용
  const termsToken = await tokenStorage.getTermsAgreementToken();
  if (!termsToken) {
    throw new Error('약관 동의 토큰이 없습니다.');
  }
  
  // 백엔드는 약관 ID 배열을 받음
  // termsIds는 [1, 2, 3] 형식의 약관 ID 배열
  if (!Array.isArray(termsIds) || termsIds.length === 0) {
    throw new Error('약관 ID가 필요합니다.');
  }
  
  // 약관 동의 전용 토큰을 사용하여 API 호출
  // apiClient의 auth 옵션 대신 직접 헤더에 토큰 추가
  const response = await apiClient.post(
    '/terms/agreements/bulk',
    {
      terms_ids: termsIds,
      agreed_at: new Date().toISOString(),
    },
    {
      auth: false,
      headers: {
        'Authorization': `Bearer ${termsToken}`,
      },
    }
  );
  
  // 약관 동의 완료 후 정상 토큰 저장
  // 백엔드 응답에 토큰이 포함되어 있지 않을 수 있으므로
  // 약관 동의 완료 후 다시 로그인 시도해야 할 수도 있음
  // 일단 응답을 반환하고 상위에서 처리하도록 함
  await tokenStorage.clearTermsAgreementToken();
  return response;
}

async function logout() {
  await tokenStorage.clearTokens();
  await tokenStorage.clearUser();
}

async function deleteAccount() {
  return apiClient.delete('/auth/withdraw');
}

export const authApi = {
  login,
  register,
  refreshToken,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
  checkEmail,
  checkNickname,
  googleLogin,
  agreeToTerms,
  logout,
  deleteAccount,
};

async function getRounds(params) {
  return apiClient.get('/rounds', { params });
}

async function getRound(id) {
  return apiClient.get(`/rounds/${id}`);
}

async function createRound(data, config = {}) {
  return apiClient.post('/rounds/', data, config);
}

async function updateRound(id, data) {
  return apiClient.put(`/rounds/${id}`, data);
}

async function deleteRound(id) {
  return apiClient.delete(`/rounds/${id}`);
}

async function joinRound(id) {
  return apiClient.post(`/rounds/${id}/join`);
}

async function leaveRound(id) {
  return apiClient.delete(`/rounds/${id}/leave`);
}

async function cancelRound(id, reason) {
  return apiClient.post(`/meetings/${id}/cancel`, { reason });
}

async function getRoundParticipants(id) {
  return apiClient.get(`/rounds/${id}/participants`);
}

async function updateParticipantStatus(roundId, participantId, data) {
  return apiClient.patch(
    `/rounds/${roundId}/participants/${participantId}/status`,
    data
  );
}

async function updateParticipantRole(roundId, participantId, data) {
  return apiClient.patch(
    `/rounds/${roundId}/participants/${participantId}/role`,
    data
  );
}

async function removeParticipant(roundId, participantId) {
  return apiClient.delete(`/rounds/${roundId}/participants/${participantId}`);
}

async function getRoundTeams(id) {
  return apiClient.get(`/rounds/${id}/teams`);
}

async function createTeam(roundId, data) {
  return apiClient.post(`/rounds/${roundId}/teams`, data);
}

async function deleteTeam(roundId, teamId) {
  return apiClient.delete(`/rounds/${roundId}/teams/${teamId}`);
}

async function addTeamMember(roundId, teamId, userId) {
  return apiClient.post(`/rounds/${roundId}/teams/${teamId}/members`, {
    user_id: userId,
  });
}

async function removeTeamMember(roundId, teamId, memberId) {
  return apiClient.delete(`/rounds/${roundId}/teams/${teamId}/members/${memberId}`);
}

async function autoFormTeams(meetingId, data) {
  return apiClient.post(`/meetings/${meetingId}/teams/auto-formation`, data);
}

async function getTeamsByMeeting(meetingId) {
  return apiClient.get('/teams', { params: { meeting_id: meetingId } });
}

async function createTeamByMeeting(meetingId, data) {
  return apiClient.post('/teams', data, { params: { meeting_id: meetingId } });
}

async function updateTeam(teamId, data) {
  return apiClient.put(`/teams/${teamId}`, data);
}

async function deleteTeamByMeeting(teamId) {
  return apiClient.delete(`/teams/${teamId}`);
}

async function getParticipantScores(roundId, participantId, params) {
  return apiClient.get(`/rounds/${roundId}/participants/${participantId}/scores`, { params });
}

async function getParticipantScoreStats(roundId, participantId) {
  return apiClient.get(`/rounds/${roundId}/participants/${participantId}/scores/stats`);
}

async function createScore(roundId, participantId, data) {
  return apiClient.post(`/rounds/${roundId}/participants/${participantId}/scores`, data);
}

async function updateScore(roundId, participantId, scoreId, data) {
  return apiClient.put(
    `/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`,
    data
  );
}

async function deleteScore(roundId, participantId, scoreId) {
  return apiClient.delete(
    `/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`
  );
}

async function getRoundExpenses(id, params) {
  return apiClient.get(`/rounds/${id}/expenses`, { params });
}

async function createRoundExpense(roundId, data) {
  return apiClient.post(`/rounds/${roundId}/expenses`, data);
}

async function updateExpense(roundId, expenseId, data) {
  return apiClient.put(`/rounds/${roundId}/expenses/${expenseId}`, data);
}

async function deleteExpense(roundId, expenseId) {
  return apiClient.delete(`/rounds/${roundId}/expenses/${expenseId}`);
}

async function sendMeetingNotification(meetingId, data) {
  return apiClient.post(`/rounds/${meetingId}/notifications`, data);
}

async function sendMeetingReminder(meetingId) {
  return apiClient.post(`/rounds/${meetingId}/reminder`);
}

async function getNotifications(params) {
  return apiClient.get('/users/notifications', { params });
}

async function markNotificationAsRead(notificationId) {
  return apiClient.put(`/users/notifications/${notificationId}/read`);
}

async function markAllNotificationsAsRead() {
  return apiClient.put('/users/notifications/read-all');
}

async function applyToMeeting(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/apply`);
}

async function approveParticipant(meetingId, participantId) {
  return apiClient.post(`/meetings/${meetingId}/participants/${participantId}/approve`);
}

async function rejectParticipant(meetingId, participantId) {
  return apiClient.post(`/meetings/${meetingId}/participants/${participantId}/reject`);
}

async function closeApplicationEarly(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/close-application`);
}

async function getApplicationStatus(meetingId) {
  return apiClient.get(`/meetings/${meetingId}/application-status`);
}

async function startTeamFormation(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/start-team-formation`);
}

async function confirmTeamFormation(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/teams/confirm`);
}

async function startRounding(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/start-rounding`);
}

async function completeRounding(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/complete-rounding`);
}

async function submitSimpleScore(meetingId, participantId, data) {
  return apiClient.post(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data);
}

async function updateSimpleScore(meetingId, participantId, data) {
  return apiClient.put(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data);
}

async function confirmTeamMember(meetingId, teamId, memberId) {
  return apiClient.post(`/meetings/${meetingId}/teams/${teamId}/members/${memberId}/confirm`);
}

async function completeMeeting(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/complete`);
}

async function confirmSettlement(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/settlement/confirm`);
}

async function createRoundingSettlement(meetingId, data) {
  return apiClient.post(`/meetings/${meetingId}/settlement/rounding`, data);
}

async function getMySettlement(meetingId) {
  return apiClient.get(`/meetings/${meetingId}/settlement/my`);
}

async function createEventSettlement(meetingId, data) {
  return apiClient.post(`/meetings/${meetingId}/settlement/social`, data);
}

async function getMeetingSettlement(meetingId) {
  return apiClient.get(`/meetings/${meetingId}/settlement`);
}

async function getAvailableParticipants(meetingId) {
  return apiClient.get(`/meetings/${meetingId}/settlement/available-participants`);
}

async function addGuest(meetingId, guestData) {
  return apiClient.post(`/meetings/${meetingId}/guests`, guestData);
}

async function getGuests(meetingId) {
  return apiClient.get(`/meetings/${meetingId}/guests`);
}

export const roundsApi = {
  getRounds,
  getRound,
  createRound,
  updateRound,
  deleteRound,
  joinRound,
  leaveRound,
  cancelRound,
  getRoundParticipants,
  updateParticipantStatus,
  updateParticipantRole,
  removeParticipant,
  getRoundTeams,
  createTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  autoFormTeams,
  getTeamsByMeeting,
  createTeamByMeeting,
  updateTeam,
  deleteTeamByMeeting,
  getParticipantScores,
  getParticipantScoreStats,
  createScore,
  updateScore,
  deleteScore,
  getRoundExpenses,
  createRoundExpense,
  updateExpense,
  deleteExpense,
  sendMeetingNotification,
  sendMeetingReminder,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  applyToMeeting,
  approveParticipant,
  rejectParticipant,
  closeApplicationEarly,
  getApplicationStatus,
  startTeamFormation,
  confirmTeamFormation,
  startRounding,
  completeRounding,
  submitSimpleScore,
  updateSimpleScore,
  confirmTeamMember,
  completeMeeting,
  confirmSettlement,
  createRoundingSettlement,
  getMySettlement,
  createEventSettlement,
  getMeetingSettlement,
  getAvailableParticipants,
  addGuest,
  getGuests,
};

async function createSocial(data, config = {}) {
  return apiClient.post('/socials/', data, config);
}

async function getSocials(params) {
  return apiClient.get('/socials', { params });
}

async function getSocial(id) {
  return apiClient.get(`/socials/${id}`);
}

async function updateSocial(id, data) {
  return apiClient.put(`/socials/${id}`, data);
}

async function deleteSocial(id) {
  return apiClient.delete(`/socials/${id}`);
}

async function joinSocial(id) {
  return apiClient.post(`/socials/${id}/join`);
}

async function leaveSocial(id) {
  return apiClient.delete(`/socials/${id}/leave`);
}

async function cancelSocial(id, reason) {
  return apiClient.post(`/socials/${id}/cancel`, { reason });
}

export const socialsApi = {
  createSocial,
  getSocials,
  getSocial,
  updateSocial,
  deleteSocial,
  joinSocial,
  leaveSocial,
  cancelSocial,
};

async function getUserNotifications(params = {}) {
  return apiClient.get('/users/notifications', { params: buildNotificationParams(params) });
}

async function markAsRead(notificationId) {
  return apiClient.put(`/users/notifications/${notificationId}/read`);
}

async function markAllAsRead() {
  return apiClient.put('/users/notifications/read-all');
}

async function deleteNotification(notificationId) {
  return apiClient.delete(`/users/notifications/${notificationId}`);
}

export const notificationsApi = {
  getNotifications: getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

async function getMyProfile() {
  return apiClient.get('/users/profile');
}

async function updateMyProfile(data) {
  return apiClient.put('/users/me', data);
}

async function getUsers(params) {
  return apiClient.get('/users', { params });
}

async function getUser(id) {
  return apiClient.get(`/users/${id}`);
}

async function createUser(data) {
  return apiClient.post('/users', data);
}

async function updateUser(id, data) {
  return apiClient.put(`/users/${id}`, data);
}

async function deleteUser(id) {
  return apiClient.delete(`/users/${id}`);
}

async function getUserHandicap(id) {
  return apiClient.get(`/users/${id}/handicap`);
}

async function updateUserHandicap(id, data) {
  return apiClient.put(`/users/${id}/handicap`, data);
}

async function calculateHandicap(id) {
  return apiClient.get(`/users/handicap/calculate/${id}`);
}

async function getUserScoreHistory(id, limit = 10) {
  return apiClient.get(`/users/${id}/score-history`, { params: { limit } });
}

async function getLastMeetingResult(id) {
  return apiClient.get(`/users/${id}/last-meeting-result`);
}

async function getMyRoundingMeetings(params) {
  return apiClient.get('/users/me/rounding-meetings', { params });
}

async function getRoundingStats() {
  return apiClient.get('/users/me/rounding-stats');
}

async function getMyMeetings(params) {
  return apiClient.get('/users/my-meetings', { params });
}

async function getUserStats() {
  return apiClient.get('/users/stats');
}

export const usersApi = {
  getMyProfile,
  updateMyProfile,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserHandicap,
  updateUserHandicap,
  calculateHandicap,
  getUserScoreHistory,
  getLastMeetingResult,
  getMyRoundingMeetings,
  getRoundingStats,
  getMyMeetings,
  getUserStats,
};

async function getTerms(type) {
  return apiClient.get(`/auth/terms/${type}`, { auth: false });
}

async function getNotices(params = {}) {
  return apiClient.get('/notices', { params });
}

async function getNotice(id) {
  return apiClient.get(`/notices/${id}`);
}

export const noticesApi = {
  getNotices,
  getNotice,
};

async function getFaqs(params = {}) {
  return apiClient.get('/faq', { params });
}

async function getFaq(id) {
  return apiClient.get(`/faq/${id}`);
}

async function getCategories() {
  return apiClient.get('/faq-categories');
}

export const faqApi = {
  getFaqs,
  getFaq,
  getCategories,
};

async function getSidoList() {
  return apiClient.get('/sido-list', { auth: false });
}

async function getGunguList(sidoCode) {
  return apiClient.get('/gungu-list', {
    params: { sido_code: sidoCode },
    auth: false,
  });
}

export const regionApi = {
  getSidoList,
  getGunguList,
};

async function registerClubApplication(applicationData) {
  return apiClient.post('/clubs/register', applicationData);
}

async function createClub(data) {
  return apiClient.post('/clubs', data);
}

async function updateClub(clubId, data) {
  return apiClient.put(`/clubs/${clubId}`, data);
}

async function deleteClub(clubId) {
  return apiClient.delete(`/clubs/${clubId}`);
}

async function getClubApplications(params = {}) {
  return apiClient.get('/clubs/applications', { params });
}

async function getMyClubApplications(params = {}) {
  return apiClient.get('/clubs/applications/my', { params });
}

async function getClubApplication(applicationId) {
  return apiClient.get(`/clubs/applications/${applicationId}`);
}

async function updateClubApplication(applicationId, data) {
  return apiClient.put(`/clubs/applications/${applicationId}`, data);
}

async function cancelClubApplication(applicationId) {
  return apiClient.put(`/clubs/applications/${applicationId}/cancel`, null);
}

async function getClubs(params = {}) {
  return apiClient.get('/clubs/', { params: buildClubStatusParams(params) });
}

async function getMyClubs(params = {}) {
  return apiClient.get('/clubs/my', { params: buildClubStatusParams(params) });
}

async function getClub(clubId) {
  return apiClient.get(`/clubs/${clubId}`);
}

async function getClubMembership(clubId) {
  return apiClient.get(`/clubs/${clubId}/membership`);
}

async function joinClub(clubId) {
  return apiClient.post(`/clubs/${clubId}/join`);
}

async function leaveClub(clubId) {
  return apiClient.delete(`/clubs/${clubId}/leave`);
}

async function getClubMembers(clubId, params = {}) {
  return apiClient.get(`/clubs/${clubId}/members`, { params });
}

async function updateClubMemberRole(clubId, memberId, data) {
  return apiClient.put(`/clubs/${clubId}/members/${memberId}/role`, data);
}

async function removeClubMember(clubId, memberId) {
  return apiClient.delete(`/clubs/${clubId}/members/${memberId}`);
}

async function getClubNotices(clubId, params = {}) {
  return apiClient.get(`/clubs/${clubId}/notices`, { params });
}

async function createClubNotice(clubId, data) {
  return apiClient.post(`/clubs/${clubId}/notices`, data);
}

async function updateClubNotice(clubId, noticeId, data) {
  return apiClient.put(`/clubs/${clubId}/notices/${noticeId}`, data);
}

async function deleteClubNotice(clubId, noticeId) {
  return apiClient.delete(`/clubs/${clubId}/notices/${noticeId}`);
}

async function getClubRegulations(clubId, params = {}) {
  return apiClient.get(`/clubs/${clubId}/regulations`, { params });
}

async function getClubRegulation(clubId, regulationId) {
  return apiClient.get(`/clubs/${clubId}/regulations/${regulationId}`);
}

async function createClubRegulation(clubId, data) {
  return apiClient.post(`/clubs/${clubId}/regulations`, data);
}

async function updateClubRegulation(clubId, regulationId, data) {
  return apiClient.put(`/clubs/${clubId}/regulations/${regulationId}`, data);
}

async function deleteClubRegulation(clubId, regulationId) {
  return apiClient.delete(`/clubs/${clubId}/regulations/${regulationId}`);
}

async function getClubMeetings(clubId, params = {}) {
  return apiClient.get(`/clubs/${clubId}/meetings`, { params });
}

async function getClubFees(clubId, params = {}) {
  return apiClient.get(`/clubs/${clubId}/fees`, { params });
}

async function createClubFee(clubId, data) {
  return apiClient.post(`/clubs/${clubId}/fees`, data);
}

async function updateClubFee(clubId, feeId, data) {
  return apiClient.put(`/clubs/${clubId}/fees/${feeId}`, data);
}

async function deleteClubFee(clubId, feeId) {
  return apiClient.delete(`/clubs/${clubId}/fees/${feeId}`);
}

async function getClubActivities(clubId, params = {}) {
  return apiClient.get(`/clubs/${clubId}/activities`, { params });
}

async function createClubActivity(clubId, data) {
  return apiClient.post(`/clubs/${clubId}/activities`, data);
}

async function updateClubActivity(clubId, activityId, data) {
  return apiClient.put(`/clubs/${clubId}/activities/${activityId}`, data);
}

async function deleteClubActivity(clubId, activityId) {
  return apiClient.delete(`/clubs/${clubId}/activities/${activityId}`);
}

async function getClubStats(clubId) {
  return apiClient.get(`/clubs/${clubId}/stats`);
}

async function uploadClubFile(clubId, formData) {
  return apiClient.upload(`/clubs/${clubId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export const clubsApi = {
  registerClubApplication,
  createClub,
  updateClub,
  deleteClub,
  getClubApplications,
  getMyClubApplications,
  getClubApplication,
  updateClubApplication,
  cancelClubApplication,
  getClubs,
  getMyClubs,
  getClub,
  getClubMembership,
  joinClub,
  leaveClub,
  getClubMembers,
  updateClubMemberRole,
  removeClubMember,
  getClubNotices,
  createClubNotice,
  updateClubNotice,
  deleteClubNotice,
  getClubRegulations,
  getClubRegulation,
  createClubRegulation,
  updateClubRegulation,
  deleteClubRegulation,
  getClubMeetings,
  getClubFees,
  createClubFee,
  updateClubFee,
  deleteClubFee,
  getClubActivities,
  createClubActivity,
  updateClubActivity,
  deleteClubActivity,
  getClubStats,
  uploadClubFile,
};

async function getActiveTerms() {
  const response = await apiClient.get('/terms/active/', { auth: false });
  const data = response;
  return data?.value || data || [];
}

async function getActiveTermsByType(type) {
  try {
    const response = await apiClient.get('/terms/active/', {
      params: { type_filter: type },
      auth: false,
    });
    const data = response;
    if (Array.isArray(data)) {
      return data;
    }
    return data?.value || [];
  } catch (error) {
    console.error(`약관 조회 실패 (${type}):`, error);
    return [];
  }
}

async function getActiveServiceTerms() {
  try {
    const terms = await getActiveTermsByType('TERMS_OF_SERVICE');
    return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
  } catch (error) {
    console.error('서비스이용약관 조회 실패:', error);
    return null;
  }
}

async function getActivePrivacyTerms() {
  try {
    const terms = await getActiveTermsByType('PRIVACY_POLICY');
    return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
  } catch (error) {
    console.error('개인정보처리방침 조회 실패:', error);
    return null;
  }
}

async function getActivePrivacyCollectionTerms() {
  try {
    const terms = await getActiveTermsByType('PRIVACY_COLLECTION');
    return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
  } catch (error) {
    console.error('개인정보 수집 및 활용동의 조회 실패:', error);
    return null;
  }
}

async function getActiveMarketingTerms() {
  try {
    const terms = await getActiveTermsByType('MARKETING_OPT_IN');
    return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
  } catch (error) {
    console.error('마케팅정보수신동의 조회 실패:', error);
    return null;
  }
}

function getDefaultTermsTitle(type) {
  const titles = {
    service: '서비스 이용약관',
    privacy: '개인정보처리방침',
    collection: '개인정보 수집 및 이용동의',
    marketing: '마케팅 정보 수신동의',
  };
  return titles[type] || '약관';
}

function getDefaultTermsContent(type) {
  const contents = {
    service: '서비스 이용약관 내용이 준비되지 않았습니다.',
    privacy: '개인정보처리방침 내용이 준비되지 않았습니다.',
    collection: '개인정보 수집 및 이용동의 내용이 준비되지 않았습니다.',
    marketing: '마케팅 정보 수신동의 내용이 준비되지 않았습니다.',
  };
  return contents[type] || '약관 내용이 준비되지 않았습니다.';
}

async function getActiveTermsByRequestType(type) {
  const typeMapping = {
    service: 'TERMS_OF_SERVICE',
    privacy: 'PRIVACY_POLICY',
    collection: 'PRIVACY_COLLECTION',
    marketing: 'MARKETING_OPT_IN',
  };

  const dbType = typeMapping[type] || type;
  return getActiveTermsByType(dbType);
}

async function getTermsByType(type) {
  try {
    const terms = await getActiveTermsByRequestType(type);

    if (Array.isArray(terms) && terms.length > 0) {
      return terms[0];
    }

    return {
      title: getDefaultTermsTitle(type),
      content: getDefaultTermsContent(type),
    };
  } catch (error) {
    console.error(`약관 조회 실패 (${type}):`, error);
    return {
      title: getDefaultTermsTitle(type),
      content: getDefaultTermsContent(type),
    };
  }
}

export const termsApi = {
  getActiveTerms,
  getActiveTermsByType,
  getActiveServiceTerms,
  getActivePrivacyTerms,
  getActivePrivacyCollectionTerms,
  getActiveMarketingTerms,
  getTerms: getTermsByType,
};

async function fetchMyClubs(params) {
  return apiClient.get('/clubs/my', { params: buildClubStatusParams(params || {}) });
}

async function fetchRounds(params) {
  return apiClient.get('/rounds', { params });
}

async function fetchSocials(params) {
  return apiClient.get('/socials', { params });
}

async function fetchRound(meetingId) {
  return apiClient.get(`/rounds/${meetingId}`);
}

async function updateRoundById(meetingId, payload) {
  return apiClient.put(`/rounds/${meetingId}`, payload);
}

async function fetchSocial(meetingId) {
  return apiClient.get(`/socials/${meetingId}`);
}

async function updateSocialById(meetingId, payload) {
  return apiClient.put(`/socials/${meetingId}`, payload);
}

async function fetchRoundExpenses(meetingId) {
  return apiClient.get(`/rounds/${meetingId}/expenses`);
}

async function fetchRoundParticipants(meetingId) {
  return apiClient.get(`/rounds/${meetingId}/participants`);
}

async function fetchRoundTeams(meetingId) {
  return apiClient.get(`/rounds/${meetingId}/teams`);
}

async function fetchApplicationStatus(meetingId) {
  return apiClient.get(`/meetings/${meetingId}/application-status`);
}

async function closeApplicationEarlyByMeeting(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/close-application`);
}

async function autoFormTeamsByMeeting(meetingId, payload) {
  return apiClient.post(`/meetings/${meetingId}/teams/auto-formation`, payload);
}

async function confirmTeamFormationByMeeting(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/teams/confirm`);
}

async function startRoundingByMeeting(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/start-rounding`);
}

async function completeRoundingByMeeting(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/complete-rounding`);
}

async function confirmSettlementByMeeting(meetingId) {
  return apiClient.post(`/meetings/${meetingId}/settlement/confirm`);
}

async function joinRoundByMeeting(meetingId) {
  return apiClient.post(`/rounds/${meetingId}/join`);
}

async function leaveRoundByMeeting(meetingId) {
  return apiClient.delete(`/rounds/${meetingId}/leave`);
}

async function joinSocialByMeeting(meetingId) {
  return apiClient.post(`/socials/${meetingId}/join`);
}

async function leaveSocialByMeeting(meetingId) {
  return apiClient.delete(`/socials/${meetingId}/leave`);
}

async function fetchMyProfile() {
  return apiClient.get('/users/profile');
}

async function fetchUserHandicap(userId) {
  return apiClient.get(`/users/${userId}/handicap`);
}

async function fetchMyMeetings(params) {
  return apiClient.get('/users/my-meetings', { params });
}

async function fetchMyRoundingMeetings(params) {
  return apiClient.get('/users/me/rounding-meetings', { params });
}

async function fetchRoundingStats() {
  return apiClient.get('/users/me/rounding-stats');
}

async function checkNicknameAvailability(nickname) {
  return apiClient.get('/auth/check-nickname', { params: { nickname }, auth: false });
}

export const meetingsApi = {
  fetchMyClubs,
  fetchRounds,
  fetchSocials,
  fetchRound,
  createRound,
  updateRound,
  updateRoundById,
  fetchSocial,
  createSocial,
  updateSocial,
  updateSocialById,
  fetchRoundExpenses,
  fetchRoundParticipants,
  fetchRoundTeams,
  fetchApplicationStatus,
  closeApplicationEarly,
  closeApplicationEarlyByMeeting,
  autoFormTeams,
  autoFormTeamsByMeeting,
  confirmTeamFormation,
  confirmTeamFormationByMeeting,
  startRounding,
  startRoundingByMeeting,
  completeRounding,
  completeRoundingByMeeting,
  confirmSettlement,
  confirmSettlementByMeeting,
  joinRound,
  joinRoundByMeeting,
  leaveRound,
  leaveRoundByMeeting,
  joinSocial,
  joinSocialByMeeting,
  leaveSocial,
  leaveSocialByMeeting,
};

export const mypageApi = {
  fetchMyClubs,
  fetchMyProfile,
  fetchUserHandicap,
  updateMyProfile,
  fetchMyMeetings,
  fetchMyRoundingMeetings,
  fetchRoundingStats,
  fetchRoundParticipants,
  changePassword,
  checkNicknameAvailability,
  completeRounding,
  submitSimpleScore,
};

export const clubApi = {
  getClubs,
  getMyClubs,
  getClub,
  createClub,
  updateClub,
  deleteClub,
  getClubApplications,
  getClubApplication,
  updateClubApplication,
  getClubMembership,
  getTerms,
};
