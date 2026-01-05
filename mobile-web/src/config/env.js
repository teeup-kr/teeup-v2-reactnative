// 환경 변수 설정
export const config = {
  // API 설정
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  
  // Google OAuth 설정
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  
  // 앱 설정
  APP_NAME: import.meta.env.VITE_APP_NAME || 'TeeupLink',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // 개발 환경 설정
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

// 환경 변수 검증
export const validateConfig = () => {
  const required = [
    'VITE_API_BASE_URL',
    'VITE_GOOGLE_CLIENT_ID',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }
  
  return missing.length === 0;
};

export default config;

