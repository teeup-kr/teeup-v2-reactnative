import { URLSearchParams } from 'react-native-url-polyfill';

import { apiRequest, apiRequestForm } from './apiClient';
import { apiClient, buildRequestConfig } from './httpClient';

export const api = {
  get: (url, config) => apiRequest(url, { method: 'GET', ...buildRequestConfig(config || {}) }),
  post: (url, data, config) => apiRequest(url, {
    method: 'POST',
    body: data,
    ...buildRequestConfig(config || {}),
  }),
  put: (url, data, config) => apiRequest(url, {
    method: 'PUT',
    body: data,
    ...buildRequestConfig(config || {}),
  }),
  patch: (url, data, config) => apiRequest(url, {
    method: 'PATCH',
    body: data,
    ...buildRequestConfig(config || {}),
  }),
  delete: (url, config) => apiRequest(url, { method: 'DELETE', ...buildRequestConfig(config || {}) }),
  upload: (url, formData, config) => apiRequestForm(url, {
    method: config?.method || 'POST',
    formData,
    ...buildRequestConfig(config || {}),
  }),
};

export const roundsApi = {
  getRounds: (params) => api.get('/rounds', { params }),
  getRound: (id) => api.get(`/rounds/${id}`),
  createRound: (data, config = {}) => api.post('/rounds/', data, config),
  updateRound: (id, data) => api.put(`/rounds/${id}`, data),
  deleteRound: (id) => api.delete(`/rounds/${id}`),
  joinRound: (id) => api.post(`/rounds/${id}/join`),
  leaveRound: (id) => api.delete(`/rounds/${id}/leave`),
  cancelRound: (id, reason) => api.post(`/meetings/${id}/cancel`, { reason }),
  getRoundParticipants: (id) => api.get(`/rounds/${id}/participants`),
  updateParticipantStatus: (roundId, participantId, data) =>
    api.patch(`/rounds/${roundId}/participants/${participantId}/status`, data),
  updateParticipantRole: (roundId, participantId, data) =>
    api.patch(`/rounds/${roundId}/participants/${participantId}/role`, data),
  removeParticipant: (roundId, participantId) =>
    api.delete(`/rounds/${roundId}/participants/${participantId}`),
  getRoundTeams: (id) => api.get(`/rounds/${id}/teams`),
  createTeam: (roundId, data) => api.post(`/rounds/${roundId}/teams`, data),
  deleteTeam: (roundId, teamId) => api.delete(`/rounds/${roundId}/teams/${teamId}`),
  addTeamMember: (roundId, teamId, userId) =>
    api.post(`/rounds/${roundId}/teams/${teamId}/members`, { user_id: userId }),
  removeTeamMember: (roundId, teamId, memberId) =>
    api.delete(`/rounds/${roundId}/teams/${teamId}/members/${memberId}`),
  autoFormTeams: (meetingId, data) => api.post(`/meetings/${meetingId}/teams/auto-formation`, data),
  getTeamsByMeeting: (meetingId) => api.get(`/teams?meeting_id=${meetingId}`),
  createTeamByMeeting: (meetingId, data) => api.post(`/teams?meeting_id=${meetingId}`, data),
  updateTeam: (teamId, data) => api.put(`/teams/${teamId}`, data),
  deleteTeamByMeeting: (teamId) => api.delete(`/teams/${teamId}`),
  getParticipantScores: (roundId, participantId, params) =>
    api.get(`/rounds/${roundId}/participants/${participantId}/scores`, { params }),
  getParticipantScoreStats: (roundId, participantId) =>
    api.get(`/rounds/${roundId}/participants/${participantId}/scores/stats`),
  createScore: (roundId, participantId, data) =>
    api.post(`/rounds/${roundId}/participants/${participantId}/scores`, data),
  updateScore: (roundId, participantId, scoreId, data) =>
    api.put(`/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`, data),
  deleteScore: (roundId, participantId, scoreId) =>
    api.delete(`/rounds/${roundId}/participants/${participantId}/scores/${scoreId}`),
  getRoundExpenses: (id, params) => api.get(`/rounds/${id}/expenses`, { params }),
  createRoundExpense: (roundId, data) => api.post(`/rounds/${roundId}/expenses`, data),
  updateExpense: (roundId, expenseId, data) =>
    api.put(`/rounds/${roundId}/expenses/${expenseId}`, data),
  deleteExpense: (roundId, expenseId) =>
    api.delete(`/rounds/${roundId}/expenses/${expenseId}`),
  sendMeetingNotification: (meetingId, data) =>
    api.post(`/rounds/${meetingId}/notifications`, data),
  sendMeetingReminder: (meetingId) => api.post(`/rounds/${meetingId}/reminder`),
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationAsRead: (notificationId) => api.put(`/users/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => api.put('/users/notifications/read-all'),
  applyToMeeting: (meetingId) => api.post(`/meetings/${meetingId}/apply`),
  approveParticipant: (meetingId, participantId) => api.post(`/meetings/${meetingId}/participants/${participantId}/approve`),
  rejectParticipant: (meetingId, participantId) => api.post(`/meetings/${meetingId}/participants/${participantId}/reject`),
  closeApplicationEarly: (meetingId) => api.post(`/meetings/${meetingId}/close-application`),
  getApplicationStatus: (meetingId) => api.get(`/meetings/${meetingId}/application-status`),
  startTeamFormation: (meetingId) => api.post(`/meetings/${meetingId}/start-team-formation`),
  confirmTeamFormation: (meetingId) => api.post(`/meetings/${meetingId}/teams/confirm`),
  startRounding: (meetingId) => api.post(`/meetings/${meetingId}/start-rounding`),
  completeRounding: (meetingId) => api.post(`/meetings/${meetingId}/complete-rounding`),
  submitSimpleScore: (meetingId, participantId, data) =>
    api.post(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data),
  updateSimpleScore: (meetingId, participantId, data) =>
    api.put(`/meetings/${meetingId}/participants/${participantId}/simple-score`, data),
  confirmTeamMember: (meetingId, teamId, memberId) =>
    api.post(`/meetings/${meetingId}/teams/${teamId}/members/${memberId}/confirm`),
  completeMeeting: (meetingId) => api.post(`/meetings/${meetingId}/complete`),
  confirmSettlement: (meetingId) => api.post(`/meetings/${meetingId}/settlement/confirm`),
  createRoundingSettlement: (meetingId, data) => api.post(`/meetings/${meetingId}/settlement/rounding`, data),
  getMySettlement: (meetingId) => api.get(`/meetings/${meetingId}/settlement/my`),
  createEventSettlement: (meetingId, data) => api.post(`/meetings/${meetingId}/settlement/social`, data),
  getMeetingSettlement: (meetingId) => api.get(`/meetings/${meetingId}/settlement`),
  getAvailableParticipants: (meetingId) => api.get(`/meetings/${meetingId}/settlement/available-participants`),
  addGuest: (meetingId, guestData) => api.post(`/meetings/${meetingId}/guests`, guestData),
  getGuests: (meetingId) => api.get(`/meetings/${meetingId}/guests`),
};

export const socialsApi = {
  createSocial: (data, config = {}) => api.post('/socials/', data, config),
  getSocials: (params) => api.get('/socials', { params }),
  getSocial: (id) => api.get(`/socials/${id}`),
  updateSocial: (id, data) => api.put(`/socials/${id}`, data),
  deleteSocial: (id) => api.delete(`/socials/${id}`),
  joinSocial: (id) => api.post(`/socials/${id}/join`),
  leaveSocial: (id) => api.delete(`/socials/${id}/leave`),
  cancelSocial: (id, reason) => api.post(`/socials/${id}/cancel`, { reason }),
};

export const notificationsApi = {
  getNotifications: (params) => {
    const { filter, ...rest } = params || {};
    const queryParams = { ...rest };
    if (filter && filter !== 'all') {
      queryParams.status_filter = filter === 'unread' ? 'UNREAD' : 'READ';
    }
    return api.get('/users/notifications', { params: queryParams });
  },
  markAsRead: (notificationId) => api.put(`/users/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/users/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/users/notifications/${notificationId}`),
};

export const usersApi = {
  getMyProfile: () => api.get('/users/profile'),
  updateMyProfile: (data) => api.put('/users/me', data),
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserHandicap: (id) => api.get(`/users/${id}/handicap`),
  updateUserHandicap: (id, data) => api.put(`/users/${id}/handicap`, data),
  calculateHandicap: (id) => api.get(`/users/handicap/calculate/${id}`),
  getUserScoreHistory: (id, limit = 10) => api.get(`/users/${id}/score-history`, { params: { limit } }),
  getLastMeetingResult: (id) => api.get(`/users/${id}/last-meeting-result`),
  getMyRoundingMeetings: (params) => api.get('/users/me/rounding-meetings', { params }),
  getRoundingStats: () => api.get('/users/me/rounding-stats'),
  getMyMeetings: (params) => api.get('/users/my-meetings', { params }),
  getUserStats: () => api.get('/users/stats'),
};

export const getTerms = async (type) => {
  const response = await apiClient.get(`/auth/terms/${type}`);
  return response.data;
};

export const noticesApi = {
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
  getNotice: async (id) => {
    const response = await apiClient.get(`/notices/${id}`);
    return response.data;
  },
};

export const faqApi = {
  getFaqs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());

    const response = await apiClient.get(`/faq?${queryParams.toString()}`);
    return response.data;
  },
  getFaq: async (id) => {
    const response = await apiClient.get(`/faq/${id}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await apiClient.get('/faq-categories');
    return response.data;
  },
};

export const clubApi = {
  getClubs: (params) => api.get('/clubs', { params }),
  getMyClubs: (params) => api.get('/clubs/my', { params }),
  getClub: (id) => api.get(`/clubs/${id}`),
  createClub: (data) => api.post('/clubs', data),
  updateClub: (id, data) => api.put(`/clubs/${id}`, data),
  deleteClub: (id) => api.delete(`/clubs/${id}`),
  getClubApplications: (params) => api.get('/clubs/applications', { params }),
  getClubApplication: (id) => api.get(`/clubs/applications/${id}`),
  updateClubApplication: (id, data) => api.patch(`/clubs/applications/${id}`, data),
  getClubMembership: (clubId) => api.get(`/clubs/${clubId}/membership`),
  getTerms,
};

export default apiClient;
