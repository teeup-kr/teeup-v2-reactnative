import { useEffect } from 'react';
import { Platform } from 'react-native';

import { authApi } from '@/lib/api/api';
import { tokenStorage } from '@/lib/tokenStorage';

import { googleAuthConfig } from '../../constants/authConstants';

export function buildGoogleAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: googleAuthConfig.clientId || '',
    redirect_uri: googleAuthConfig.redirectUrl || '',
    response_type: 'code',
    scope: (googleAuthConfig.scopes || []).join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    ...(state ? { state } : {}),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function buildGoogleAuthConfig(state) {
  const platformOverrides = Platform.select({
    web: { usePKCE: false },
    default: { usePKCE: true },
  });

  return ({
    ...googleAuthConfig,
    skipCodeExchange: true,
    ...platformOverrides,
    additionalParameters: {
      ...(googleAuthConfig.additionalParameters || {}),
      ...(state ? { state } : {}),
    },
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

  if (Platform.OS !== 'android' && googleAuthConfig.redirectUrl) {
    payload.redirectUri = googleAuthConfig.redirectUrl;
  }

  return payload;
}

export function generateOauthState() { return `google_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

// export const authUtils = {
//   buildGoogleAuthConfig,
//   generateOauthState,
// };

export default function useGoogleWebAuthEffect({
  refreshAuth,
  router,
  setErrors,
  setIsGoogleSigningIn,
}) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const authorizationCode = params.get('code');
    const authError = params.get('error');
    const returnedState = params.get('state');

    if (!authorizationCode && !authError) {
      return;
    }

    const resetUrl = () => {
      window.history.replaceState(null, '', window.location.pathname);
    };

    const handleWebCallback = async () => {
      setIsGoogleSigningIn(true);

      if (authError) {
        setErrors((prev) => ({
          ...prev,
          general: `Google 로그인에 실패했습니다: ${authError}`,
        }));
        await tokenStorage.clearOauthState();
        setIsGoogleSigningIn(false);
        resetUrl();
        return;
      }

      const storedState = await tokenStorage.getOauthState();
      if (returnedState && storedState && returnedState !== storedState) {
        setErrors((prev) => ({
          ...prev,
          general: 'Google 인증 상태가 일치하지 않습니다.',
        }));
        await tokenStorage.clearOauthState();
        setIsGoogleSigningIn(false);
        resetUrl();
        return;
      }

      try {
        const payload = buildGoogleAuthPayload(
          { authorizationCode },
          returnedState || storedState,
        );
        await authApi.googleLogin(payload);
        await refreshAuth();
        router.replace('/');
      } catch (error) {
        const message = error?.message || 'Google 로그인에 실패했습니다.';
        setErrors((prev) => ({ ...prev, general: message }));
      } finally {
        await tokenStorage.clearOauthState();
        setIsGoogleSigningIn(false);
        resetUrl();
      }
    };

    void handleWebCallback();
  }, [refreshAuth, router, setErrors, setIsGoogleSigningIn]);
}
