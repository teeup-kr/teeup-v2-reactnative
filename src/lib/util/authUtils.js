import { googleAuthConfig } from '../../constants/authConstants';

export function buildGoogleAuthConfig(state) {
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

export function generateOauthState() { return `google_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

// export const authUtils = {
//   buildGoogleAuthConfig,
//   generateOauthState,
// };
