import Constants from 'expo-constants';
const { clientId, redirectUri, webClientId } = Constants.expoConfig.extra.googleAuth;

export const googleAuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: clientId,
  redirectUrl: redirectUri,
  scopes: ['openid', 'profile', 'email'],
};

export const googleNativeConfig = {
  webClientId: webClientId,
};
