import { apiRequest, oauthRequest } from './apiClient';
import { tokenStorage } from './tokenStorage';

const saveAuthData = async (authResponse) => {
  if (!authResponse?.access_token) {
    throw new Error('액세스 토큰이 없습니다.');
  }

  await tokenStorage.setTokens(authResponse.access_token, authResponse.refresh_token);
  if (authResponse.user) {
    await tokenStorage.setUser(authResponse.user);
  }

  return authResponse.user;
};

export const authApi = {
  async login(credentials) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    await saveAuthData(response);
    return response;
  },
  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: userData,
    });
  },
  async refreshToken(refreshToken) {
    return apiRequest('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  },
  async getCurrentUser() {
    return apiRequest('/auth/me', { method: 'GET', auth: true });
  },
  async changePassword(passwordData) {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      params: {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      },
      auth: true,
    });
  },
  async requestPasswordReset(data) {
    return apiRequest('/auth/request-password-reset', {
      method: 'POST',
      body: data,
    });
  },
  async resetPassword(token, newPassword) {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: { token, new_password: newPassword },
    });
  },
  async verifyEmail(token) {
    return apiRequest('/auth/verify-email', {
      method: 'POST',
      body: { token },
    });
  },
  async resendVerification() {
    return apiRequest('/auth/resend-verification', { method: 'POST' });
  },
  async checkEmail(email) {
    return apiRequest('/auth/check-email', {
      method: 'GET',
      params: { email },
    });
  },
  async checkNickname(nickname) {
    return apiRequest('/auth/check-nickname', {
      method: 'GET',
      params: { nickname },
    });
  },
  async googleLogin(oauthData) {
    const response = await oauthRequest('/auth/oauth/google/callback', {
      body: oauthData,
    });
    await saveAuthData(response);
    return response;
  },
  async logout() {
    await tokenStorage.clearTokens();
    await tokenStorage.clearUser();
  },
  async deleteAccount() {
    return apiRequest('/auth/withdraw', { method: 'DELETE', auth: true });
  },
};
