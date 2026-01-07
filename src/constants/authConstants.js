import { config } from '../config/env';

export const googleAuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: config.GOOGLE_CLIENT_ID,
  redirectUrl: config.GOOGLE_REDIRECT_URI,
  scopes: ['openid', 'profile', 'email'],
};

export const registerInitialForm = {
  email: '',
  password: '',
  nickname: '',
  average_score: '',
  terms_agreement: false,
  privacy_policy: false,
  privacy_collection: false,
  marketing_consent: false,
};

export const registerInitialErrors = {
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  average_score: '',
  terms_agreement: '',
  privacy_policy: '',
  privacy_collection: '',
};
