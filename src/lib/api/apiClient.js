import Constants from 'expo-constants';
import { router } from "expo-router";
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

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
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

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

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
    const error = new Error(payload?.detail || payload?.message || '요청에 실패했습니다.');

    const hasAuthHeader = Boolean(requestHeaders.Authorization);
    if (response.status === 401 && hasAuthHeader) {
      console.info('[Auth] Token expired → logout');
      await tokenStorage.clearTokens();
      await tokenStorage.clearUser();
      router.replace('/login');
      return;
    }

    // 요청 실패, 약관동의 요구 받은경우
    if (
      response.status === 403 &&
      payload?.detail?.code === "TERMS_NOT_AGREED"
    ) {
      const redirect = payload.detail.redirect ?? "/terms-agree";

      console.info("[Auth] Terms not agreed → redirect", redirect);

      // 뒤로가기 방지
      router.replace(redirect);
      return; // throw 하지 않음
    }

    if (
      response.status === 403 &&
      payload?.detail?.code === "PROFILE_NOT_COMPLETED"
    ) {
      const redirect = payload.detail.redirect ?? "/mypage/edit";

      console.info("[Auth] Terms not agreed → redirect", redirect);

      // 뒤로가기 방지
      router.replace(redirect);
      return; // throw 하지 않음
    }

    error.status = response.status;
    error.payload = payload;

    // // 403 응답이고 약관 동의 토큰이 헤더에 있는 경우
    // if (response.status === 403) {
    //   const termsAgreementToken = response.headers.get('X-Terms-Agreement-Token') ||
    //     response.headers.get('terms-agreement-token');
    //   if (termsAgreementToken) {
    //     error.termsAgreementToken = termsAgreementToken;
    //     error.requiresTermsAgreement = true;
    //     // payload에도 토큰이 있을 수 있으므로 확인
    //     if (payload?.terms_agreement_token) {
    //       error.termsAgreementToken = payload.terms_agreement_token;
    //     }
    //   }
    // }

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
