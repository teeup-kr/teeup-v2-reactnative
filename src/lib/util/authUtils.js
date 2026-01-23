

import { googleAuthConfig } from '../../constants/authConstants';

export function buildGoogleAuthConfig(state) {
  return {
    ...googleAuthConfig,
    skipCodeExchange: true,
    usePKCE: true, // 명시적으로 통일
    additionalParameters: {
      ...(googleAuthConfig.additionalParameters || {}),
      ...(state ? { state } : {}),
    },
  };
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

// export const authUtils = {
//   buildGoogleAuthConfig,
//   generateOauthState,
// };

// // 웹 플랫폼 Google OAuth 처리
// export default function useGoogleWebAuthEffect({
//   refreshAuth,
//   router,
//   setErrors,
//   setIsGoogleSigningIn,
// }) {
//   console.log("!!!!!!!!useGoogleWebAuthEffect!!!!!!")
//   useEffect(() => {

//     const params = new URLSearchParams(window.location.search);
//     const authorizationCode = params.get('code');
//     const authError = params.get('error');
//     const returnedState = params.get('state');

//     if (!authorizationCode && !authError) {
//       return;
//     }

//     const resetUrl = () => {
//       window.history.replaceState(null, '', window.location.pathname);
//     };

//     const handleWebCallback = async () => {
//       setIsGoogleSigningIn(true);

//       if (authError) {
//         setErrors((prev) => ({
//           ...prev,
//           general: `Google 로그인에 실패했습니다: ${authError}`,
//         }));
//         await tokenStorage.clearOauthState();
//         setIsGoogleSigningIn(false);
//         resetUrl();
//         return;
//       }

//       try {
//         if (authorizationCode) {
//           const storedState = await tokenStorage.getOauthState();
//           if (returnedState && storedState && returnedState !== storedState) {
//             setErrors((prev) => ({
//               ...prev,
//               general: 'Google 인증 상태가 일치하지 않습니다.',
//             }));
//             await tokenStorage.clearOauthState();
//             setIsGoogleSigningIn(false);
//             resetUrl();
//             return;
//           }
//           const codeVerifier = await tokenStorage.getCodeVerifier();

//           if (!codeVerifier) {
//             throw new Error('PKCE code_verifier가 존재하지 않습니다.');
//           }
//           const payload = buildGoogleAuthPayload(
//             {
//               authorizationCode,
//               codeVerifier,
//             },
//             returnedState || storedState,
//           );
//           await authApi.googleLogin(payload);
//         }
//         await refreshAuth();
//         router.replace('/');
//       } catch (error) {
//         const message = error?.message || 'Google 로그인에 실패했습니다.';
//         setErrors((prev) => ({ ...prev, general: message }));
//       } finally {
//         await tokenStorage.clearOauthState();
//         setIsGoogleSigningIn(false);
//         resetUrl();
//       }
//     };

//     void handleWebCallback();
//   }, [refreshAuth, router, setErrors, setIsGoogleSigningIn]);
// }

export function buildGoogleAuthorizeUrl({
  state,
  codeChallenge,
  codeChallengeMethod,
}) {
  const params = new URLSearchParams({
    client_id: googleAuthConfig.clientId,
    redirect_uri: googleAuthConfig.redirectUrl,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
