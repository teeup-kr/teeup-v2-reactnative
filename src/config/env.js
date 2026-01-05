export const config = {
  API_BASE_URL: 'https://www.teeup.run/api',
  API_VERSION: 'v1',
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
  APP_SCHEME: 'teeuplink',
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
