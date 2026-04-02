import Constants from 'expo-constants';
const { clientId, redirectUri } = Constants.expoConfig.extra.googleAuth;

export const googleAuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: clientId,
  redirectUrl: redirectUri,
  scopes: ['openid', 'profile', 'email'],
};
