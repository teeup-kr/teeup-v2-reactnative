export const googleAuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: '791884628850-gkqbgna2cn1ari12jielsttrsqvjrkm8.apps.googleusercontent.com',
  redirectUrl: 'com.googleusercontent.apps.791884628850-gkqbgna2cn1ari12jielsttrsqvjrkm8:/oauth2redirect',
  scopes: ['openid', 'profile', 'email'],
};

export const registerInitialForm = {
  email: '',
  password: '',
  nickname: '',
  average_score: '',
  terms_agreement: false,
  privacy_policy: false,
  privacy_collection: false,
  marketing_consent: false,
};

export const registerInitialErrors = {
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  average_score: '',
  terms_agreement: '',
  privacy_policy: '',
  privacy_collection: '',
};
