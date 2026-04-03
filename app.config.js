import fs from 'fs';
import dotenv from 'dotenv';

/**
 * .env 강제 reload (캐싱 방지)
 */
function reloadEnv() {
  Object.keys(process.env).forEach((k) => {
    if (k.startsWith('EXPO_')) {
      delete process.env[k];
    }
  });

  dotenv.config({ override: true });

  console.log('ENV reloaded:', new Date().toISOString());
}

/**
 * app.json 캐시 제거 후 재로드
 */
function loadAppJson() {
  delete require.cache[require.resolve('./app.json')];
  return JSON.parse(fs.readFileSync('./app.json', 'utf8'));
}

/**
 * 플랫폼 결정
 */
function resolvePlatform() {
  const platform = process.env.EAS_BUILD_PLATFORM;

  if (!platform) {
    throw new Error(
      'Platform not detected. Set EXPO_OS or EAS_BUILD_PLATFORM.'
    );
  }

  const normalized = platform.toLowerCase().trim();

  if (!['ios', 'android', 'web'].includes(normalized)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  console.log('Platform detected:', normalized);
  return normalized;
}

/**
 * 플랫폼별 env 선택
 * EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB 등
 */
function pickPlatformEnv(prefix, platform) {
  const key = `${prefix}_${platform.toUpperCase()}`;
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }

  return value;
}

/**
 * API Base URL 생성
 */
function buildApiBaseUrl(origin, version) {
  const trimmed = origin.replace(/\/+$/, '');
  const v = version.replace(/^\/+/, '');

  if (trimmed.endsWith(`/api/${v}`)) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/${v}`;

  return `${trimmed}/api/${v}`;
}

export default () => {
  reloadEnv();

  const appJson = loadAppJson();
  const base = appJson.expo;
  const platform = resolvePlatform();

  const {
    EXPO_PUBLIC_WEB_ORIGIN,
    EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_VERSION,
  } = process.env;

  if (!EXPO_PUBLIC_API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL missing');
  }

  if (!EXPO_PUBLIC_API_VERSION) {
    throw new Error('EXPO_PUBLIC_API_VERSION missing');
  }

  const googleClientId = pickPlatformEnv(
    'EXPO_PUBLIC_GOOGLE_CLIENT_ID',
    platform
  );

  const googleRedirectUri = pickPlatformEnv(
    'EXPO_PUBLIC_GOOGLE_REDIRECT_URI',
    platform
  );

  const apiBaseUrlFinal = buildApiBaseUrl(
    EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_VERSION
  );

  const extra = {
    ...(base.extra ?? {}),
    webOrigin: EXPO_PUBLIC_WEB_ORIGIN,
    apiBaseUrl: apiBaseUrlFinal,
    oauthPlatform: platform,
    googleAuth: {
      clientId: googleClientId,
      redirectUri: googleRedirectUri,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    },
  };

  console.log('Generated expo.extra:', extra);

  return {
    ...base,
    extra,
  };
};