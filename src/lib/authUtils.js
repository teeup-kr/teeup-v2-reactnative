import { googleAuthConfig } from '../constants/authConstants';

export const buildGoogleAuthConfig = (state) => ({
  ...googleAuthConfig,
  skipCodeExchange: true,
  usePKCE: true,
  additionalParameters: {
    ...(googleAuthConfig.additionalParameters || {}),
    ...(state ? { state } : {}),
  },
});

export const generateOauthState = () => `google_${Date.now()}_${Math.random().toString(36).slice(2)}`;
