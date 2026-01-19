import Constants from 'expo-constants';

const extra = Constants.expoConfig.extra;
console.log('!!! Loading env config... !!!', extra);

const googleAuth = extra.googleAuth;
const apiBaseUrl = extra.apiBaseUrl;
const apiVersion = extra.apiVersion;

if (!apiBaseUrl) {
  throw new Error(
    'API base URL is missing. Set API_BASE_URL in .env or expo extra.',
  );
}
if (!apiVersion) {
  throw new Error(
    'API version is missing. Set API_VERSION in .env or expo extra.',
  );
}
if (!googleAuth) {
  throw new Error(
    'Google OAuth credentials are missing. Set googleAuth in expo extra.',
  );
}

export const config = {
  API_BASE_URL: apiBaseUrl,
  API_VERSION: apiVersion,
  GOOGLE_CLIENT_ID: googleAuth.clientId,
  GOOGLE_REDIRECT_URI: googleAuth.redirectUri,
  APP_SCHEME: 'teeup' // app.json(expo.scheme)과 동일해야 딥링크/OAuth 리다이렉트가 정상 동작합니다.
};

export const getApiBaseUrl = () => {
  const trimmed = config.API_BASE_URL.replace(/\/+$/, '');
  const version = config.API_VERSION?.replace(/^\/+/, '');

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
