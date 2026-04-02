export default {
  expoConfig: {
    extra: {
      webOrigin: 'http://localhost:8081',
      apiBaseUrl: 'http://localhost:8200/api/v1',
      oauthPlatform: 'web',
      googleAuth: {
        clientId: 'test-google-web-client-id',
        redirectUri: 'http://localhost:8081/auth/google/callback',
      },
    },
  },
};
