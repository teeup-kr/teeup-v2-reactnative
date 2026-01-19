import 'dotenv/config';
import appJson from './app.json';

/**
 * 플랫폼 결정
 * - 로컬 dev: EXPO_OS
 * - EAS 빌드: EAS_BUILD_PLATFORM
 */
function resolvePlatform() {
  const platform =
    process.env.EXPO_OS ||
    process.env.EAS_BUILD_PLATFORM;

  if (!platform) {
    throw new Error(
      'Platform not detected. Set EXPO_OS or EAS_BUILD_PLATFORM.'
    );
  }

  const normalized = platform.toLowerCase();
  if (!['ios', 'android', 'web'].includes(normalized)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  console.log('!!! Platform detected !!!:', normalized);
  return normalized;
}

/**
 * 플랫폼별 env 선택 헬퍼
 * 예: EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
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
 * API Base URL 빌드 (빌드 타임 1회)
 */
function buildApiBaseUrl(origin, version) {
  const trimmed = origin.replace(/\/+$/, '');
  const v = version.replace(/^\/+/, '');

  if (trimmed.endsWith(`/api/${v}`)) {
    return trimmed;
  }

  if (trimmed.endsWith('/api')) {
    return `${trimmed}/${v}`;
  }

  return `${trimmed}/api/${v}`;
}

export default () => {
  const base = appJson.expo;
  const platform = resolvePlatform();

  /**
   * 공통 EXPO_PUBLIC 값
   */
  const {
    EXPO_PUBLIC_WEB_ORIGIN,
    EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_VERSION,
  } = process.env;

  if (!EXPO_PUBLIC_API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is missing');
  }

  if (!EXPO_PUBLIC_API_VERSION) {
    throw new Error('EXPO_PUBLIC_API_VERSION is missing');
  }

  /**
   * Google OAuth (플랫폼별)
   */
  const googleClientId = pickPlatformEnv(
    'EXPO_PUBLIC_GOOGLE_CLIENT_ID',
    platform,
  );

  const googleRedirectUri = pickPlatformEnv(
    'EXPO_PUBLIC_GOOGLE_REDIRECT_URI',
    platform,
  );

  // // Web은 origin + path 조합
  // if (platform === 'web') {
  //   if (!EXPO_PUBLIC_WEB_ORIGIN) {
  //     throw new Error('EXPO_PUBLIC_WEB_ORIGIN is missing for web');
  //   }
  //   googleRedirectUri = EXPO_PUBLIC_GOOGLE_REDIRECT_URI_WEB;
  // }

  /**
   * API URL 최종 확정 (빌드 타임)
   */
  const apiBaseUrlFinal = buildApiBaseUrl(
    EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_VERSION,
  );

  /**
   * expo.extra (런타임에서 그대로 사용)
   */
  const extra = {
    ...(base.extra ?? {}),
    webOrigin: EXPO_PUBLIC_WEB_ORIGIN,
    apiBaseUrl: apiBaseUrlFinal,
    oauthPlatform: platform,
    googleAuth: {
      clientId: googleClientId,
      redirectUri: googleRedirectUri,
    },
  };

  console.log('!!! Generated expo extra !!!');
  console.log(extra);

  return {
    ...base,
    extra,
  };
};
