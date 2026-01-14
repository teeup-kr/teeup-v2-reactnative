import { googleAuthConfig } from '../../constants/authConstants';

function buildGoogleAuthConfig(state) {
  return ({
    ...googleAuthConfig,
    skipCodeExchange: true,
    usePKCE: true,
    additionalParameters: {
      ...(googleAuthConfig.additionalParameters || {}),
      ...(state ? { state } : {}),
    },
  });
}

function generateOauthState() { return `google_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

export const authUtils = {
  buildGoogleAuthConfig,
  generateOauthState,
};
