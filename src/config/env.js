export const config = {
  API_BASE_URL: 'https://dev.teeup.run/api',
  API_VERSION: 'v1',
  GOOGLE_CLIENT_ID: '791884628850-gkqbgna2cn1ari12jielsttrsqvjrkm8.apps.googleusercontent.com',
  GOOGLE_REDIRECT_URI: 'com.googleusercontent.apps.791884628850-gkqbgna2cn1ari12jielsttrsqvjrkm8:/oauth2redirect',
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
