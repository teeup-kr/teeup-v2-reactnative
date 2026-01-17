const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');
function resolvePlatform() {
  const envPlatform =
    process.env.EAS_BUILD_PLATFORM || process.env.EXPO_OS;

  if (!envPlatform) {
    throw new Error(
      'OAuth platform is not set. Provide EAS_BUILD_PLATFORM, EXPO_OS, or EXPO_PLATFORM.',
    );
  }

  const normalized = envPlatform.toLowerCase();
  const supportedPlatforms = ['ios', 'android', 'web'];

  if (!supportedPlatforms.includes(normalized)) {
    throw new Error(`Unsupported OAuth platform: ${envPlatform}`);
  }

  return normalized;
}

module.exports = () => {
  debugger;
  const base = appJson.expo || {};
  const platform = resolvePlatform();
  debugger;
  console.log('!!! Platform detected !!! :', platform);
  const credentialsPath = path.resolve(
    __dirname,
    `credentials/oauth.${platform}.json`,
  );
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `OAuth credentials file is missing for ${platform}: ${credentialsPath}`,
    );
  }
  const selectedCredentials = JSON.parse(
    fs.readFileSync(credentialsPath, 'utf8'),
  );

  const selectedGoogleAuth = selectedCredentials.googleAuth || {};

  const extra = {
    ...(base.extra || {}),
    googleAuth: selectedGoogleAuth,
    oauthPlatform: platform,
  };

  const expoConfig = {
    ...base,
    extra,
  };

  console.log('!!! Generated expo config: !!!', expoConfig);
  return expoConfig;
};
