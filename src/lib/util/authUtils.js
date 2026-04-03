import { Platform } from 'react-native';

import { googleAuthConfig, googleNativeConfig } from '../../constants/authConstants';
import { authApi } from '../api/api';
import { tokenStorage } from '../tokenStorage';

let GoogleSignin;
if (Platform.OS !== 'web') {
  console.log('GoogleSignin.configure webClientId:', googleNativeConfig.webClientId);
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  GoogleSignin.configure({
    webClientId: googleNativeConfig.webClientId,
    offlineAccess: true,
    scopes: ['openid', 'profile', 'email'],
  });
}

export function buildGoogleAuthPayload(authState, oauthState) {
  const payload = {
    provider: 'google',
    authorizationCode: authState?.authorizationCode,
  };

  if (authState?.codeVerifier) {
    payload.codeVerifier = authState.codeVerifier;
  }

  if (oauthState) {
    payload.state = oauthState;
  }

  if (googleAuthConfig.redirectUrl) {
    payload.redirectUri = googleAuthConfig.redirectUrl;
  }

  return payload;
}

export function generateOauthState() { return `google_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

export async function signInWithGoogle({
  refreshAuth,
  router,
  setLoading,
  setErrorMessage,
}) {
  setErrorMessage('');
  setLoading(true);

  try {
    const oauthState = generateOauthState();
    await tokenStorage.setOauthState(oauthState);

    if (Platform.OS === 'web') {
      if (!googleAuthConfig.clientId || !googleAuthConfig.redirectUrl) {
        setErrorMessage('Google 로그인 설정(clientId/redirectUrl)이 누락되었습니다.');
        setLoading(false);
        return;
      }

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      await tokenStorage.setCodeVerifier(codeVerifier);

      const authUrl = buildGoogleAuthorizeUrl({
        state: oauthState,
        codeChallenge,
        codeChallengeMethod: 'S256',
      });

      window.location.assign(authUrl);
      return;
    }

    // 네이티브: Google Sign-In SDK 사용
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const serverAuthCode = response?.data?.serverAuthCode;

    if (!serverAuthCode) {
      throw new Error('Google 로그인에서 serverAuthCode를 받지 못했습니다.');
    }

    const payload = {
      provider: 'google',
      authorizationCode: serverAuthCode,
      state: oauthState,
      redirectUri: '',
    };

    await authApi.googleLogin(payload);

    if (refreshAuth) {
      await refreshAuth();
    }

    if (router) {
      router.replace('/app');
    }
  } catch (error) {
    console.error('Google sign-in failed:', {
      code: error?.code,
      message: error?.message,
    });
    const message = error?.message || 'Google 로그인에 실패했습니다.';
    setErrorMessage(message);
  } finally {
    await tokenStorage.clearOauthState();
    setLoading(false);
  }
}

export function buildGoogleAuthorizeUrl({
  state,
  codeChallenge,
  codeChallengeMethod,
}) {
  console.log('!!! buildGoogleAuthorizeUrl - redirectUrl:', googleAuthConfig.redirectUrl);
  const params = new URLSearchParams({
    client_id: googleAuthConfig.clientId,
    redirect_uri: googleAuthConfig.redirectUrl,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('!!! Generated Google OAuth URL:', authUrl);
  return authUrl;
}

// 웹 OAuth용 PKCE 구현 함수
export function generateCodeVerifier(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < values.length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}


export const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  const digest = await crypto.subtle.digest('SHA-256', data);

  return base64UrlEncode(new Uint8Array(digest));
};

function base64UrlEncode(buffer) {
  let binary = '';
  const len = buffer.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
