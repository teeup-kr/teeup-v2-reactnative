import Constants from 'expo-constants';
import { router } from "expo-router";
import { Alert } from 'react-native';
import { URLSearchParams } from 'react-native-url-polyfill';

import { tokenStorage } from '../tokenStorage';

let extra =
  Constants.expoConfig?.extra ??
  Constants.manifest?.extra;

// 런타임에 3000을 8200으로 강제 변경
if (extra?.apiBaseUrl && extra.apiBaseUrl.includes('3000')) {
  console.warn('⚠️ apiClient.js - Force replacing 3000 with 8200 in apiBaseUrl');
  extra = {
    ...extra,
    apiBaseUrl: extra.apiBaseUrl.replace(/3000/g, '8200'),
  };
}

// redirectUri에 /callback이 없으면 추가
if (extra?.googleAuth?.redirectUri && !extra.googleAuth.redirectUri.includes('/callback')) {
  console.warn('⚠️ apiClient.js - Adding /callback to redirectUri');
  extra = {
    ...extra,
    googleAuth: {
      ...extra.googleAuth,
      redirectUri: extra.googleAuth.redirectUri + '/callback',
    },
  };
}

const API_BASE_URL = extra?.apiBaseUrl;

console.log('!!! apiClient.js - Constants.expoConfig:', Constants.expoConfig);
console.log('!!! apiClient.js - Constants.manifest:', Constants.manifest);
console.log('!!! apiClient.js - extra (after fix):', JSON.stringify(extra, null, 2));
console.log('!!! apiClient.js - API_BASE_URL:', API_BASE_URL);

const sensitiveKeys = ['password', 'token', 'authorization', 'refresh', 'access'];
const REFRESH_PATH = '/auth/refresh';
let refreshPromise = null;

function maskValue(value) {
  if (typeof value !== 'string') return value;
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
};

function sanitizePayload(payload) {
  if (!payload) return payload;
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }
  if (typeof payload === 'object') {
    return Object.keys(payload).reduce((acc, key) => {
      const lowered = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowered.includes(sensitive))) {
        acc[key] = maskValue(payload[key]);
      } else {
        acc[key] = sanitizePayload(payload[key]);
      }
      return acc;
    }, {});
  }
  return payload;
};

async function parseJsonPayload(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  return isJson ? await response.json() : null;
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';

  const query = new URLSearchParams();
  entries.forEach(([key, value]) => {
    query.append(key, String(value));
  });
  return `?${query.toString()}`;
};

function buildUrl(path) {
  if (!path) {
    throw new Error('요청 경로를 지정해주세요.');
  }
  const urlPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_BASE_URL}${urlPath}`;
  console.log('!!! buildUrl - path:', path, '-> fullUrl:', fullUrl);
  return fullUrl;
};

function buildRequestConfig(config = {}) {
  return {
    params: config.params,
    headers: config.headers,
    auth: config.auth !== false,
  };
};

async function requestTokenRefresh() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const refreshUrl = buildUrl(REFRESH_PATH);
    let refreshResponse;
    try {
      refreshResponse = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.warn('[Auth Refresh Network Error]', {
        url: refreshUrl,
        message: error?.message,
      });
      return null;
    }

    const refreshPayload = await parseJsonPayload(refreshResponse);
    console.log('[Auth Refresh Response]', {
      url: refreshUrl,
      status: refreshResponse.status,
      payload: sanitizePayload(refreshPayload),
    });

    if (!refreshResponse.ok || !refreshPayload?.access_token) {
      return null;
    }

    await tokenStorage.setTokens(refreshPayload.access_token, refreshPayload.refresh_token);
    return refreshPayload.access_token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function handleAuthExpired() {
  console.info('[Auth] Session expired → logout');
  await tokenStorage.clearTokens();
  await tokenStorage.clearUser();
  router.replace('/login');
}

async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    params,
    headers = {},
    body,
    formData,
    auth = false,
  } = options;

  const url = `${buildUrl(path)}${buildQuery(params)}`;
  const isForm = Boolean(formData);

  const requestHeaders = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  };

  if (auth) {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const logHeaders = { ...requestHeaders };
  if (logHeaders.Authorization) {
    logHeaders.Authorization = `Bearer ${maskValue(logHeaders.Authorization.replace('Bearer ', ''))}`;
  }

  console.log('[API Request]', {
    method,
    url,
    params,
    headers: logHeaders,
    body: isForm ? '[FormData]' : sanitizePayload(body),
  });

  const requestOnce = async (headersToUse) => {
    const result = {};
    try {
      result.response = await fetch(url, {
        method,
        headers: headersToUse,
        body: isForm ? formData : (body ? JSON.stringify(body) : undefined),
      });
    } catch (networkError) {
      console.warn('[API Network Error]', {
        method,
        url,
        message: networkError?.message,
      });
      throw networkError;
    }

    result.payload = await parseJsonPayload(result.response);
    return result;
  };

  let { response, payload } = await requestOnce(requestHeaders);

  console.log(
    '[API Response]\n' +
    JSON.stringify({
      method,
      url,
      status: response.status,
      payload: sanitizePayload(payload),
    }, null, 2)
  );

  if (!response.ok) {
    const hasAuthHeader = Boolean(requestHeaders.Authorization);
    const detailText =
      typeof payload?.detail === 'string'
        ? payload.detail
        : typeof payload?.message === 'string'
          ? payload.message
          : '';
    const isAuthForbidden =
      response.status === 403 &&
      hasAuthHeader &&
      (
        detailText.toLowerCase().includes('not authenticated') ||
        payload?.detail?.code === 'NOT_AUTHENTICATED'
      );
    const isAuthFailure = auth && ((response.status === 401 && hasAuthHeader) || isAuthForbidden);

    if (isAuthFailure) {
      const refreshedAccessToken = await requestTokenRefresh();
      if (refreshedAccessToken) {
        const retryHeaders = {
          ...requestHeaders,
          Authorization: `Bearer ${refreshedAccessToken}`,
        };
        const retryResult = await requestOnce(retryHeaders);
        response = retryResult.response;
        payload = retryResult.payload;

        console.log(
          '[API Retry Response]\n' +
          JSON.stringify({
            method,
            url,
            status: response.status,
            payload: sanitizePayload(payload),
          }, null, 2)
        );

        if (response.ok) {
          return payload;
        }

        const retryHasAuthHeader = Boolean(retryHeaders.Authorization);
        const retryDetailText =
          typeof payload?.detail === 'string'
            ? payload.detail
            : typeof payload?.message === 'string'
              ? payload.message
              : '';
        const retryIsAuthForbidden =
          response.status === 403 &&
          retryHasAuthHeader &&
          (
            retryDetailText.toLowerCase().includes('not authenticated') ||
            payload?.detail?.code === 'NOT_AUTHENTICATED'
          );

        if ((response.status === 401 && retryHasAuthHeader) || retryIsAuthForbidden) {
          await handleAuthExpired();
          return;
        }
      } else {
        await handleAuthExpired();
        return;
      }
    }

    const error = new Error(payload?.detail || payload?.message || '요청에 실패했습니다.');
    error.status = response.status;
    error.payload = payload;

    // 요청 실패, 약관동의 요구 받은경우
    if (
      response.status === 403 &&
      payload?.detail?.code === "TERMS_NOT_AGREED"
    ) {
      const redirect = "/terms-agree";

      console.info("[Auth] Terms not agreed → redirect", redirect);

      // 뒤로가기 방지
      router.replace(redirect);
      return; // throw 하지 않음
    }

    if (
      response.status === 403 &&
      payload?.detail?.code === "PROFILE_NOT_COMPLETED"
    ) {
      const requestPath = path.startsWith('/') ? path : `/${path}`;
      const isClubJoinRequest =
        method.toUpperCase() === 'POST' &&
        /^\/clubs\/[^/]+\/join\/?$/.test(requestPath);
      const rawRedirect = payload.detail.redirect ?? "/mypage/edit";
      const redirect = (() => {
        if (!rawRedirect.startsWith('/mypage/edit')) return rawRedirect;
        const [path, queryString = ''] = rawRedirect.split('?');
        const params = new URLSearchParams(queryString);
        params.set('profile_required', '1');
        const nextQueryString = params.toString();
        return nextQueryString ? `${path}?${nextQueryString}` : path;
      })();
      const message =
        typeof payload?.detail?.message === "string"
          ? payload.detail.message
          : "프로필을 먼저 완성해주세요.";

      console.info("[Auth] Profile not completed → redirect", redirect);

      const alertButtons = isClubJoinRequest
        ? [
          {
            text: "다음에 하기",
            style: 'cancel',
          },
          {
            text: "확인",
            onPress: () => router.replace(redirect),
          },
        ]
        : [
          {
            text: "확인",
            onPress: () => router.replace(redirect),
          },
        ];

      Alert.alert("안내", message, alertButtons);
      return; // throw 하지 않음
    }

    console.warn('[API Error]', {
      method,
      url,
      status: response.status,
      payload: sanitizePayload(payload),
      requiresTermsAgreement: error.requiresTermsAgreement,
    });
    throw error;
  }

  return payload;
};

async function get(url, config = {}) {
  return apiRequest(url, { method: 'GET', ...buildRequestConfig(config) });
}

async function post(url, data, config = {}) {
  return apiRequest(url, {
    method: 'POST',
    body: data,
    ...buildRequestConfig(config),
  });
}

async function put(url, data, config = {}) {
  return apiRequest(url, {
    method: 'PUT',
    body: data,
    ...buildRequestConfig(config),
  });
}

async function patch(url, data, config = {}) {
  return apiRequest(url, {
    method: 'PATCH',
    body: data,
    ...buildRequestConfig(config),
  });
}

// 예약어 delete -> deleteRequest
async function deleteRequest(url, config = {}) {
  return apiRequest(url, { method: 'DELETE', ...buildRequestConfig(config) });
}

async function upload(url, formData, config = {}) {
  return apiRequest(url, {
    method: config.method || 'POST',
    formData,
    ...buildRequestConfig(config),
  });
}

export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: deleteRequest,
  upload,
};

export const oauthRequest = async (path, authData) => {

  const url = `${buildUrl(path)}`;

  const requestHeaders = {
    'Content-Type': 'application/json'
  };

  // console.log('[OAuth Request]', {
  //     url,
  //     method,
  //     headers: requestHeaders,
  //     body: body
  //   });

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(authData)
    });
  } catch (networkError) {
    console.warn('[OAuth Network Error]', {
      method: 'POST',
      url,
      message: networkError?.message,
    });
    throw networkError;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  console.log('[OAuth Response]', {
    method: 'POST',
    url,
    status: response.status,
    payload: sanitizePayload(payload),
  });

  if (!response.ok) {
    const error = new Error(payload?.detail || payload?.message || 'OAuth 요청에 실패했습니다.');
    error.status = response.status;
    error.payload = payload;
    console.warn('[OAuth Error]', {
      method: 'POST',
      url,
      status: response.status,
      payload: sanitizePayload(payload),
    });
    throw error;
  }

  return payload;
};
