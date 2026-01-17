import Constants from 'expo-constants';

console.log('!!! Loading env config... !!!', Constants.expoConfig?.extra);
const extra = Constants.expoConfig?.extra || {};
const googleAuth = extra.googleAuth || {};
export const config = {
  API_BASE_URL: 'https://dev.teeup.run/api',
  API_VERSION: 'v1',
  GOOGLE_CLIENT_ID: googleAuth.clientId || '',
  GOOGLE_REDIRECT_URI: googleAuth.redirectUri || '',
  // app.json(expo.scheme)과 동일해야 딥링크/OAuth 리다이렉트가 정상 동작합니다.
  APP_SCHEME: 'teeup',
};

export const getApiBaseUrl = () => {
  const trimmed = config.API_BASE_URL.replace(/\/+$/, '');
  const version = config.API_VERSION?.replace(/^\/+/, '') || '';

  if (!version) {
    return trimmed;
  }

  if (trimmed.endsWith(`/api/${version}`)) {
    return trimmed;
  }

  if (trimmed.endsWith('/api')) {
    return `${trimmed}/${version}`;
  }

  return `${trimmed}/api/${version}`;
};
