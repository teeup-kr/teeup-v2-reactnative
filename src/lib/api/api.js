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
  await saveAuthData(response.data);
  return response.data;
}

async function register(userData) {
  const response = await apiClient.post('/auth/register', userData, { auth: false });
  return response.data;
}

async function refreshToken(refreshToken) {
  const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken }, { auth: false });
  return response.data;
}

async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

async function changePassword(passwordData) {
  const response = await apiClient.put('/auth/change-password', null, {
    params: {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
      confirm_password: passwordData.confirm_password,
    },
  });
  return response.data;
}

async function requestPasswordReset(data) {
  const response = await apiClient.post('/auth/request-password-reset', data, { auth: false });
  return response.data;
}

async function resetPassword(token, newPassword) {
  const response = await apiClient.post('/auth/reset-password', { token, new_password: newPassword }, { auth: false });
  return response.data;
}

async function verifyEmail(token) {
  const response = await apiClient.post('/auth/verify-email', { token }, { auth: false });
  return response.data;
}

async function resendVerification() {
  const response = await apiClient.post('/auth/resend-verification', null, { auth: false });
  return response.data;
}

async function checkEmail(email) {
  const response = await apiClient.get('/auth/check-email', { params: { email }, auth: false });
  return response.data;
}

async function checkNickname(nickname) {
  const response = await apiClient.get('/auth/check-nickname', { params: { nickname }, auth: false });
  return response.data;
}

async function googleLogin(oauthData) {
  const response = await apiClient.post('/auth/oauth/google/callback', oauthData, { auth: false });
  await saveAuthData(response.data);
  return response.data;
}

async function logout() {
  await tokenStorage.clearTokens();
  await tokenStorage.clearUser();
}

async function deleteAccount() {
  const response = await apiClient.delete('/auth/withdraw');
  return response.data;
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
  logout,
  deleteAccount,
};

async function getRounds(params) {
  const response = await apiClient.get('/rounds', { params });
  return response.data;
}

async function getRound(id) {
  const response = await apiClient.get(`/rounds/${id}`);
  return response.data;
}

async function createRound(data, config = {}) {
  const response = await apiClient.post('/rounds/', data, config);
  return response.data;
}

async function updateRound(id, data) {
  const response = await apiClient.put(`/rounds/${id}`, data);
  return response.data;
}

async function deleteRound(id) {
  const response = await apiClient.delete(`/rounds/${id}`);
  return response.data;
}

async function joinRound(id) {
  const response = await apiClient.post(`/rounds/${id}/join`);
  return response.data;
}

async function leaveRound(id) {
  const response = await apiClient.delete(`/rounds/${id}/leave`);
  return response.data;
}

async function cancelRound(id, reason) {
  const response = await apiClient.post(`/meetings/${id}/cancel`, { reason });
  return response.data;
}

async function getRoundParticipants(id) {
  const response = await apiClient.get(`/rounds/${id}/participants`);
  return response.data;
}

async function updateParticipantStatus(roundId, participantId, data) {
  const response = await apiClient.patch(
    `/rounds/${roundId}/participants/${participantId}/status`,
    data
  );
  return response.data;
}

async function updateParticipantRole(roundId, participantId, data) {
  const response = await apiClient.patch(
    `/rounds/${roundId}/participants/${participantId}/role`,
    data
  );
  return response.data;
}

async function removeParticipant(roundId, participantId) {
  const response = await apiClient.delete(`/rounds/${roundId}/participants/${participantId}`);
  return response.data;
}

async function getRoundTeams(id) {
  const response = await apiClient.get(`/rounds/${id}/teams`);
  return response.data;
}

async function createTeam(roundId, data) {
  const response = await apiClient.post(`/rounds/${roundId}/teams`, data);
  return response.data;
}

async function deleteTeam(roundId, teamId) {
  const response = await apiClient.delete(`/rounds/${roundId}/teams/${teamId}`);
  return response.data;
}

async function addTeamMember(roundId, teamId, userId) {
  const response = await apiClient.post(`/rounds/${roundId}/teams/${teamId}/members`, {
    user_id: userId,
  });
  return response.data;
}

async function removeTeamMember(roundId, teamId, memberId) {
  const response = await apiClient.delete(`/rounds/${roundId}/teams/${teamId}/members/${memberId}`);
  return response.data;
}

async function autoFormTeams(meetingId, data) {
  const response = await apiClient.post(`/meetings/${meetingId}/teams/auto-formation`, data);
  return response.data;
}

async function getTeamsByMeeting(meetingId) {
  const response = await apiClient.get('/teams', { params: { meeting_id: meetingId } });
  return response.data;
}

async function createTeamByMeeting(meetingId, data) {
  const response = await apiClient.post('/teams', data, { params: { meeting_id: meetingId } });
  return response.data;
}

async function updateTeam(teamId, data) {
  const response = await apiClient.put(`/teams/${teamId}`, data);
  return response.data;
}

async function deleteTeamByMeeting(teamId) {
  const response = await apiClient.delete(`/teams/${teamId}`);
  return response.data;
}

async function getParticipantScores(roundId, participantId, params) {
  const response = await apiClient.get(`/rounds/${roundId}/participants/${participantId}/scores`, { params });
  return response.data;
}

async function getParticipantScoreStats(roundId, participantId) {
  const response = await apiClient.get(`/rounds/${roundId}/participants/${participantId}/scores/stats`);
  return response.data;
}

async function createScore(roundId, participantId, data) {
  const response = await apiClient.post(`/rounds/${roundId}/participants/${participantId}/scores`, data);
  return response.data;
}

async function updateScore(roundId, participantId, scoreId, data) {
  const response = await apiClient.put(
    `/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`,
    data
  );
  return response.data;
}

async function deleteScore(roundId, participantId, scoreId) {
  const response = await apiClient.delete(
    `/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`
  );
  return response.data;
}

async function getRoundExpenses(id, params) {
  const response = await apiClient.get(`/rounds/${id}/expenses`, { params });
  return response.data;
}

async function createRoundExpense(roundId, data) {
  const response = await apiClient.post(`/rounds/${roundId}/expenses`, data);
  return response.data;
}

async function updateExpense(roundId, expenseId, data) {
  const response = await apiClient.put(`/rounds/${roundId}/expenses/${expenseId}`, data);
  return response.data;
}

async function deleteExpense(roundId, expenseId) {
  const response = await apiClient.delete(`/rounds/${roundId}/expenses/${expenseId}`);
  return response.data;
}

async function sendMeetingNotification(meetingId, data) {
  const response = await apiClient.post(`/rounds/${meetingId}/notifications`, data);
  return response.data;
}

async function sendMeetingReminder(meetingId) {
  const response = await apiClient.post(`/rounds/${meetingId}/reminder`);
  return response.data;
}

async function getNotifications(params) {
  const response = await apiClient.get('/users/notifications', { params });
  return response.data;
}

async function markNotificationAsRead(notificationId) {
  const response = await apiClient.put(`/users/notifications/${notificationId}/read`);
  return response.data;
}

async function markAllNotificationsAsRead() {
  const response = await apiClient.put('/users/notifications/read-all');
  return response.data;
}

async function applyToMeeting(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/apply`);
  return response.data;
}

async function approveParticipant(meetingId, participantId) {
  const response = await apiClient.post(`/meetings/${meetingId}/participants/${participantId}/approve`);
  return response.data;
}

async function rejectParticipant(meetingId, participantId) {
  const response = await apiClient.post(`/meetings/${meetingId}/participants/${participantId}/reject`);
  return response.data;
}

async function closeApplicationEarly(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/close-application`);
  return response.data;
}

async function getApplicationStatus(meetingId) {
  const response = await apiClient.get(`/meetings/${meetingId}/application-status`);
  return response.data;
}

async function startTeamFormation(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/start-team-formation`);
  return response.data;
}

async function confirmTeamFormation(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/teams/confirm`);
  return response.data;
}

async function startRounding(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/start-rounding`);
  return response.data;
}

async function completeRounding(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/complete-rounding`);
  return response.data;
}

async function submitSimpleScore(meetingId, participantId, data) {
  const response = await apiClient.post(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data);
  return response.data;
}

async function updateSimpleScore(meetingId, participantId, data) {
  const response = await apiClient.put(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data);
  return response.data;
}

async function confirmTeamMember(meetingId, teamId, memberId) {
  const response = await apiClient.post(`/meetings/${meetingId}/teams/${teamId}/members/${memberId}/confirm`);
  return response.data;
}

async function completeMeeting(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/complete`);
  return response.data;
}

async function confirmSettlement(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/settlement/confirm`);
  return response.data;
}

async function createRoundingSettlement(meetingId, data) {
  const response = await apiClient.post(`/meetings/${meetingId}/settlement/rounding`, data);
  return response.data;
}

async function getMySettlement(meetingId) {
  const response = await apiClient.get(`/meetings/${meetingId}/settlement/my`);
  return response.data;
}

async function createEventSettlement(meetingId, data) {
  const response = await apiClient.post(`/meetings/${meetingId}/settlement/social`, data);
  return response.data;
}

async function getMeetingSettlement(meetingId) {
  const response = await apiClient.get(`/meetings/${meetingId}/settlement`);
  return response.data;
}

async function getAvailableParticipants(meetingId) {
  const response = await apiClient.get(`/meetings/${meetingId}/settlement/available-participants`);
  return response.data;
}

async function addGuest(meetingId, guestData) {
  const response = await apiClient.post(`/meetings/${meetingId}/guests`, guestData);
  return response.data;
}

async function getGuests(meetingId) {
  const response = await apiClient.get(`/meetings/${meetingId}/guests`);
  return response.data;
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
  const response = await apiClient.post('/socials/', data, config);
  return response.data;
}

async function getSocials(params) {
  const response = await apiClient.get('/socials', { params });
  return response.data;
}

async function getSocial(id) {
  const response = await apiClient.get(`/socials/${id}`);
  return response.data;
}

async function updateSocial(id, data) {
  const response = await apiClient.put(`/socials/${id}`, data);
  return response.data;
}

async function deleteSocial(id) {
  const response = await apiClient.delete(`/socials/${id}`);
  return response.data;
}

async function joinSocial(id) {
  const response = await apiClient.post(`/socials/${id}/join`);
  return response.data;
}

async function leaveSocial(id) {
  const response = await apiClient.delete(`/socials/${id}/leave`);
  return response.data;
}

async function cancelSocial(id, reason) {
  const response = await apiClient.post(`/socials/${id}/cancel`, { reason });
  return response.data;
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
  const response = await apiClient.get('/users/notifications', { params: buildNotificationParams(params) });
  return response.data;
}

async function markAsRead(notificationId) {
  const response = await apiClient.put(`/users/notifications/${notificationId}/read`);
  return response.data;
}

async function markAllAsRead() {
  const response = await apiClient.put('/users/notifications/read-all');
  return response.data;
}

async function deleteNotification(notificationId) {
  const response = await apiClient.delete(`/users/notifications/${notificationId}`);
  return response.data;
}

export const notificationsApi = {
  getNotifications: getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

async function getMyProfile() {
  const response = await apiClient.get('/users/profile');
  return response.data;
}

async function updateMyProfile(data) {
  const response = await apiClient.put('/users/me', data);
  return response.data;
}

async function getUsers(params) {
  const response = await apiClient.get('/users', { params });
  return response.data;
}

async function getUser(id) {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}

async function createUser(data) {
  const response = await apiClient.post('/users', data);
  return response.data;
}

async function updateUser(id, data) {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
}

async function deleteUser(id) {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
}

async function getUserHandicap(id) {
  const response = await apiClient.get(`/users/${id}/handicap`);
  return response.data;
}

async function updateUserHandicap(id, data) {
  const response = await apiClient.put(`/users/${id}/handicap`, data);
  return response.data;
}

async function calculateHandicap(id) {
  const response = await apiClient.get(`/users/handicap/calculate/${id}`);
  return response.data;
}

async function getUserScoreHistory(id, limit = 10) {
  const response = await apiClient.get(`/users/${id}/score-history`, { params: { limit } });
  return response.data;
}

async function getLastMeetingResult(id) {
  const response = await apiClient.get(`/users/${id}/last-meeting-result`);
  return response.data;
}

async function getMyRoundingMeetings(params) {
  const response = await apiClient.get('/users/me/rounding-meetings', { params });
  return response.data;
}

async function getRoundingStats() {
  const response = await apiClient.get('/users/me/rounding-stats');
  return response.data;
}

async function getMyMeetings(params) {
  const response = await apiClient.get('/users/my-meetings', { params });
  return response.data;
}

async function getUserStats() {
  const response = await apiClient.get('/users/stats');
  return response.data;
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
  const response = await apiClient.get(`/auth/terms/${type}`, { auth: false });
  return response.data;
}

async function getNotices(params = {}) {
  const response = await apiClient.get('/notices', { params });
  return response.data;
}

async function getNotice(id) {
  const response = await apiClient.get(`/notices/${id}`);
  return response.data;
}

export const noticesApi = {
  getNotices,
  getNotice,
};

async function getFaqs(params = {}) {
  const response = await apiClient.get('/faq', { params });
  return response.data;
}

async function getFaq(id) {
  const response = await apiClient.get(`/faq/${id}`);
  return response.data;
}

async function getCategories() {
  const response = await apiClient.get('/faq-categories');
  return response.data;
}

export const faqApi = {
  getFaqs,
  getFaq,
  getCategories,
};

async function registerClubApplication(applicationData) {
  const response = await apiClient.post('/clubs/register', applicationData);
  return response.data;
}

async function createClub(data) {
  const response = await apiClient.post('/clubs', data);
  return response.data;
}

async function updateClub(clubId, data) {
  const response = await apiClient.put(`/clubs/${clubId}`, data);
  return response.data;
}

async function deleteClub(clubId) {
  const response = await apiClient.delete(`/clubs/${clubId}`);
  return response.data;
}

async function getClubApplications(params = {}) {
  const response = await apiClient.get('/clubs/applications', { params });
  return response.data;
}

async function getMyClubApplications(params = {}) {
  const response = await apiClient.get('/clubs/applications/my', { params });
  return response.data;
}

async function getClubApplication(applicationId) {
  const response = await apiClient.get(`/clubs/applications/${applicationId}`);
  return response.data;
}

async function updateClubApplication(applicationId, data) {
  const response = await apiClient.put(`/clubs/applications/${applicationId}`, data);
  return response.data;
}

async function cancelClubApplication(applicationId) {
  const response = await apiClient.put(`/clubs/applications/${applicationId}/cancel`, null);
  return response.data;
}

async function getClubs(params = {}) {
  const response = await apiClient.get('/clubs/', { params: buildClubStatusParams(params) });
  return response.data;
}

async function getMyClubs(params = {}) {
  const response = await apiClient.get('/clubs/my', { params: buildClubStatusParams(params) });
  return response.data;
}

async function getClub(clubId) {
  const response = await apiClient.get(`/clubs/${clubId}`);
  return response.data;
}

async function getClubMembership(clubId) {
  const response = await apiClient.get(`/clubs/${clubId}/membership`);
  return response.data;
}

async function joinClub(clubId) {
  const response = await apiClient.post(`/clubs/${clubId}/join`);
  return response.data;
}

async function leaveClub(clubId) {
  const response = await apiClient.delete(`/clubs/${clubId}/leave`);
  return response.data;
}

async function getClubMembers(clubId, params = {}) {
  const response = await apiClient.get(`/clubs/${clubId}/members`, { params });
  return response.data;
}

async function updateClubMemberRole(clubId, memberId, data) {
  const response = await apiClient.put(`/clubs/${clubId}/members/${memberId}/role`, data);
  return response.data;
}

async function removeClubMember(clubId, memberId) {
  const response = await apiClient.delete(`/clubs/${clubId}/members/${memberId}`);
  return response.data;
}

async function getClubNotices(clubId, params = {}) {
  const response = await apiClient.get(`/clubs/${clubId}/notices`, { params });
  return response.data;
}

async function createClubNotice(clubId, data) {
  const response = await apiClient.post(`/clubs/${clubId}/notices`, data);
  return response.data;
}

async function updateClubNotice(clubId, noticeId, data) {
  const response = await apiClient.put(`/clubs/${clubId}/notices/${noticeId}`, data);
  return response.data;
}

async function deleteClubNotice(clubId, noticeId) {
  const response = await apiClient.delete(`/clubs/${clubId}/notices/${noticeId}`);
  return response.data;
}

async function getClubRegulations(clubId, params = {}) {
  const response = await apiClient.get(`/clubs/${clubId}/regulations`, { params });
  return response.data;
}

async function getClubRegulation(clubId, regulationId) {
  const response = await apiClient.get(`/clubs/${clubId}/regulations/${regulationId}`);
  return response.data;
}

async function createClubRegulation(clubId, data) {
  const response = await apiClient.post(`/clubs/${clubId}/regulations`, data);
  return response.data;
}

async function updateClubRegulation(clubId, regulationId, data) {
  const response = await apiClient.put(`/clubs/${clubId}/regulations/${regulationId}`, data);
  return response.data;
}

async function deleteClubRegulation(clubId, regulationId) {
  const response = await apiClient.delete(`/clubs/${clubId}/regulations/${regulationId}`);
  return response.data;
}

async function getClubMeetings(clubId, params = {}) {
  const response = await apiClient.get(`/clubs/${clubId}/meetings`, { params });
  return response.data;
}

async function getClubFees(clubId, params = {}) {
  const response = await apiClient.get(`/clubs/${clubId}/fees`, { params });
  return response.data;
}

async function createClubFee(clubId, data) {
  const response = await apiClient.post(`/clubs/${clubId}/fees`, data);
  return response.data;
}

async function updateClubFee(clubId, feeId, data) {
  const response = await apiClient.put(`/clubs/${clubId}/fees/${feeId}`, data);
  return response.data;
}

async function deleteClubFee(clubId, feeId) {
  const response = await apiClient.delete(`/clubs/${clubId}/fees/${feeId}`);
  return response.data;
}

async function getClubActivities(clubId, params = {}) {
  const response = await apiClient.get(`/clubs/${clubId}/activities`, { params });
  return response.data;
}

async function createClubActivity(clubId, data) {
  const response = await apiClient.post(`/clubs/${clubId}/activities`, data);
  return response.data;
}

async function updateClubActivity(clubId, activityId, data) {
  const response = await apiClient.put(`/clubs/${clubId}/activities/${activityId}`, data);
  return response.data;
}

async function deleteClubActivity(clubId, activityId) {
  const response = await apiClient.delete(`/clubs/${clubId}/activities/${activityId}`);
  return response.data;
}

async function getClubStats(clubId) {
  const response = await apiClient.get(`/clubs/${clubId}/stats`);
  return response.data;
}

async function uploadClubFile(clubId, formData) {
  const response = await apiClient.upload(`/clubs/${clubId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
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
  const data = response?.data;
  return data?.value || data || [];
}

async function getActiveTermsByType(type) {
  try {
    const response = await apiClient.get('/terms/active/', {
      params: { type_filter: type },
      auth: false,
    });
    const data = response?.data;
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
  const response = await apiClient.get('/clubs/my', { params: buildClubStatusParams(params || {}) });
  return response.data;
}

async function fetchRounds(params) {
  const response = await apiClient.get('/rounds', { params });
  return response.data;
}

async function fetchSocials(params) {
  const response = await apiClient.get('/socials', { params });
  return response.data;
}

async function fetchRound(meetingId) {
  const response = await apiClient.get(`/rounds/${meetingId}`);
  return response.data;
}

async function updateRoundById(meetingId, payload) {
  const response = await apiClient.put(`/rounds/${meetingId}`, payload);
  return response.data;
}

async function fetchSocial(meetingId) {
  const response = await apiClient.get(`/socials/${meetingId}`);
  return response.data;
}

async function updateSocialById(meetingId, payload) {
  const response = await apiClient.put(`/socials/${meetingId}`, payload);
  return response.data;
}

async function fetchRoundExpenses(meetingId) {
  const response = await apiClient.get(`/rounds/${meetingId}/expenses`);
  return response.data;
}

async function fetchRoundParticipants(meetingId) {
  const response = await apiClient.get(`/rounds/${meetingId}/participants`);
  return response.data;
}

async function fetchRoundTeams(meetingId) {
  const response = await apiClient.get(`/rounds/${meetingId}/teams`);
  return response.data;
}

async function fetchApplicationStatus(meetingId) {
  const response = await apiClient.get(`/meetings/${meetingId}/application-status`);
  return response.data;
}

async function closeApplicationEarlyByMeeting(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/close-application`);
  return response.data;
}

async function autoFormTeamsByMeeting(meetingId, payload) {
  const response = await apiClient.post(`/meetings/${meetingId}/teams/auto-formation`, payload);
  return response.data;
}

async function confirmTeamFormationByMeeting(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/teams/confirm`);
  return response.data;
}

async function startRoundingByMeeting(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/start-rounding`);
  return response.data;
}

async function completeRoundingByMeeting(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/complete-rounding`);
  return response.data;
}

async function confirmSettlementByMeeting(meetingId) {
  const response = await apiClient.post(`/meetings/${meetingId}/settlement/confirm`);
  return response.data;
}

async function joinRoundByMeeting(meetingId) {
  const response = await apiClient.post(`/rounds/${meetingId}/join`);
  return response.data;
}

async function leaveRoundByMeeting(meetingId) {
  const response = await apiClient.delete(`/rounds/${meetingId}/leave`);
  return response.data;
}

async function joinSocialByMeeting(meetingId) {
  const response = await apiClient.post(`/socials/${meetingId}/join`);
  return response.data;
}

async function leaveSocialByMeeting(meetingId) {
  const response = await apiClient.delete(`/socials/${meetingId}/leave`);
  return response.data;
}

async function fetchMyProfile() {
  const response = await apiClient.get('/users/profile');
  return response.data;
}

async function fetchUserHandicap(userId) {
  const response = await apiClient.get(`/users/${userId}/handicap`);
  return response.data;
}

async function fetchMyMeetings(params) {
  const response = await apiClient.get('/users/my-meetings', { params });
  return response.data;
}

async function fetchMyRoundingMeetings(params) {
  const response = await apiClient.get('/users/me/rounding-meetings', { params });
  return response.data;
}

async function fetchRoundingStats() {
  const response = await apiClient.get('/users/me/rounding-stats');
  return response.data;
}

async function checkNicknameAvailability(nickname) {
  const response = await apiClient.get('/auth/check-nickname', { params: { nickname }, auth: false });
  return response.data;
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
