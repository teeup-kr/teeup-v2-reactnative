import { withDangerousMod } from '@expo/config-plugins';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const withAdiRegistration = (config) => {
  console.log('🛠️  [Plugin] withAdiRegistration 플러그인 설정 중...');

  // DangerousMod는 네이티브 파일 시스템에 직접 접근할 때 사용합니다.
  return withDangerousMod(config, [
    'android',
    (config) => {
      // 🚀 여기가 실행되어야 합니다!
      console.log('🚀 [Build Step] 파일 복사 로직 진입');

      const projectRoot = config.modRequest.projectRoot;
      const srcFile = path.join(projectRoot, 'adi-registration.properties');
      
      // 안드로이드 앱의 실제 assets 경로
      const destFolder = path.join(config.modRequest.platformProjectRoot, 'app/src/main/assets');
      const destFile = path.join(destFolder, 'adi-registration.properties');

      try {
        if (fs.existsSync(srcFile)) {
          if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder, { recursive: true });
            console.log('📁 [Build Step] assets 폴더 생성됨');
          }
          
          fs.copyFileSync(srcFile, destFile);
          console.log('✅ [Build Step] 복사 완료: adi-registration.properties');
        } else {
          console.error('❌ [Build Step] 소스 파일을 찾을 수 없음:', srcFile);
        }
      } catch (err) {
        console.error('❌ [Build Step] 복사 에러 발생:', err.message);
      }

      return config;
    },
  ]);
};

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
  console.log('--- ENV reloaded at:', new Date().toISOString(), '---');
}

/**
 * app.json 캐시 제거 후 재로드
 */
function loadAppJson() {
  const appJsonPath = path.resolve(__dirname, './app.json');
  if (require.cache[require.resolve(appJsonPath)]) {
    delete require.cache[require.resolve(appJsonPath)];
  }
  return JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
}

/**
 * 플랫폼 결정 (EAS 빌드 및 로컬 환경 대응)
 */
function resolvePlatform() {
  const platform = process.env.EAS_BUILD_PLATFORM || process.env.EXPO_OS || 'android';
  const normalized = platform.toLowerCase().trim();
  console.log('📍 Target Platform Detected:', normalized);
  return normalized;
}

/**
 * 플랫폼별 env 선택
 */
function pickPlatformEnv(prefix, platform) {
  const key = `${prefix}_${platform.toUpperCase()}`;
  const value = process.env[key];

  if (!value) {
    // 특정 값이 없을 경우 에러를 던지지 않으려면 경고만 띄우고 기본값 처리 가능
    console.warn(`⚠️ Warning: Missing env var: ${key}`);
    return '';
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

export default ({ config }) => {
  // 1. 환경변수 및 기본 설정 로드
  reloadEnv();
  const appJson = loadAppJson();
  const base = appJson.expo;
  const platform = resolvePlatform();

  const {
    EXPO_PUBLIC_WEB_ORIGIN,
    EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_VERSION,
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  } = process.env;

  // 2. 환경변수 검증
  if (!EXPO_PUBLIC_API_BASE_URL || !EXPO_PUBLIC_API_VERSION) {
    console.warn('⚠️ API 관련 환경변수가 누락되었습니다.');
  }

  // 3. 동적 데이터 구성
  const googleClientId = pickPlatformEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID', platform);
  const googleRedirectUri = pickPlatformEnv('EXPO_PUBLIC_GOOGLE_REDIRECT_URI', platform);
  const apiBaseUrlFinal = buildApiBaseUrl(
    EXPO_PUBLIC_API_BASE_URL || '',
    EXPO_PUBLIC_API_VERSION || 'v1'
  );

  const extra = {
    ...(base.extra ?? {}),
    webOrigin: EXPO_PUBLIC_WEB_ORIGIN,
    apiBaseUrl: apiBaseUrlFinal,
    oauthPlatform: platform,
    googleAuth: {
      clientId: googleClientId,
      redirectUri: googleRedirectUri,
      webClientId: EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    },
  };

  // 4. 최종 설정 객체 생성
  let finalConfig = {
    ...base,
    extra,
  };
// 플러그인 적용
  if (platform === 'android') {
    finalConfig = withAdiRegistration(finalConfig);
  }

  console.log('📍 Target Platform:', platform);
  console.log('✅ Final Expo Config generated.');

  return finalConfig;
};