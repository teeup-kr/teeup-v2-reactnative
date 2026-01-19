import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { googleAuthConfig } from '@/constants/authConstants';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api/api';
import { tokenStorage } from '@/lib/tokenStorage';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const { refreshAuth, setAuthError } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const params = new URLSearchParams(window.location.search);

    const authorizationCode = params.get('code');
    const returnedState = params.get('state');
    const authError = params.get('error');

    const resetUrl = () => {
      window.history.replaceState(null, '', window.location.pathname);
    };

    const handleCallback = async () => {
      if (authError) {
        setAuthError(`Google 로그인 실패: ${authError}`);
        await tokenStorage.clearOauth();
        resetUrl();
        return;
      }

      if (!authorizationCode) {
        resetUrl();
        return;
      }

      try {
        const storedState = await tokenStorage.getOauthState();
        const codeVerifier = await tokenStorage.getCodeVerifier();

        if (!codeVerifier) {
          throw new Error('PKCE code_verifier가 존재하지 않습니다.');
        }

        if (storedState && returnedState && storedState !== returnedState) {
          throw new Error('OAuth state 값이 일치하지 않습니다.');
        }

        await authApi.googleLogin({
          authorizationCode,
          codeVerifier,
          redirectUri: googleAuthConfig.redirectUrl,
        });

        await refreshAuth();
        router.replace('/');
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        setAuthError(err?.message || 'Google 로그인에 실패했습니다.');
      } finally {
        await tokenStorage.clearOauth();
        resetUrl();
      }
    };

    void handleCallback();
  }, [router, refreshAuth, setAuthError]);

  return null; // 화면 표시 없음
}
