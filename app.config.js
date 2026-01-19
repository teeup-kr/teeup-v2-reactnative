const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const appJson = require('./app.json');
dotenv.config();

// 플랫폼 감지
function resolvePlatform() {

  const envPlatform = process.env.EXPO_OS;
  if (!envPlatform) { throw new Error('OAuth platform is not set. Provide EAS_BUILD_PLATFORM, EXPO_OS, or EXPO_PLATFORM.'); }

  const normalized = envPlatform.toLowerCase();
  const supportedPlatforms = ['ios', 'android', 'web'];
  if (!supportedPlatforms.includes(normalized)) { throw new Error(`Unsupported OAuth platform: ${envPlatform}`); }

  console.log('!!! Platform detected !!! :', normalized);
  return normalized;
}

module.exports = () => {

  const base = appJson.expo;
  const platform = resolvePlatform();

  // 플랫폼별 OAuth 자격 증명 로드
  const credentialsPath = path.resolve(__dirname, `credentials/oauth.${platform}.json`,);
  if (!fs.existsSync(credentialsPath)) { throw new Error(`OAuth credentials file is missing for ${platform}: ${credentialsPath}`,); }

  const selectedCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const selectedGoogleAuth = selectedCredentials.googleAuth;
  if (!selectedGoogleAuth) { throw new Error(`Google OAuth credentials are missing in ${credentialsPath}`,); }

  // API URL 및 버전 설정
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) { throw new Error('API base URL is missing. Set API_BASE_URL in .env.'); }

  const apiVersion = process.env.API_VERSION;
  if (!apiVersion) { throw new Error('API version is missing. Set API_VERSION in .env.'); }

  // Expo extra 설정 병합
  const extra = {
    ...(base.extra ?? {}),
    apiBaseUrl: apiBaseUrl,
    apiVersion: apiVersion,
    googleAuth: selectedGoogleAuth,
    oauthPlatform: platform,
  }

  // 최종 expo 설정 생성
  const expoConfig = {
    ...base,
    extra,
  };

  console.log('!!! Generated expo config: !!!', expoConfig);

  return expoConfig;
};
