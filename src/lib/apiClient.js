import { getApiBaseUrl } from '../config/env';
import { tokenStorage } from './tokenStorage';

const API_BASE_URL = getApiBaseUrl();

const sensitiveKeys = ['password', 'token', 'authorization', 'refresh', 'access'];

const maskValue = (value) => {
  if (typeof value !== 'string') return value;
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
};

const sanitizePayload = (payload) => {
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

const buildQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';

  const query = new URLSearchParams();
  entries.forEach(([key, value]) => {
    query.append(key, String(value));
  });
  return `?${query.toString()}`;
};

const buildUrl = (path) => {
  if (!path) {
    throw new Error('요청 경로를 지정해주세요.');
  }
  const urlPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${urlPath}`;
};

export const apiRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    params,
    headers = {},
    body,
    auth = false,
  } = options;

  const url = `${buildUrl(path)}${buildQuery(params)}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
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
    body: sanitizePayload(body),
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
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

  console.log('[API Response]', {
    method,
    url,
    status: response.status,
    payload: sanitizePayload(payload),
  });

  if (!response.ok) {
    const error = new Error(payload?.detail || payload?.message || '요청에 실패했습니다.');
    error.status = response.status;
    error.payload = payload;
    console.warn('[API Error]', {
      method,
      url,
      status: response.status,
      payload: sanitizePayload(payload),
    });
    throw error;
  }

  return payload;
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
      method,
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
      method : 'POST',
      url,
      status: response.status,
      payload: sanitizePayload(payload),
    });
    throw error;
  }

  return payload;
};

export const apiRequestForm = async (path, options = {}) => {
  const {
    method = 'POST',
    params,
    headers = {},
    formData,
    auth = false,
  } = options;

  const url = `${buildUrl(path)}${buildQuery(params)}`;

  const requestHeaders = {
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
    body: '[FormData]',
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: formData,
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

  console.log('[API Response]', {
    method,
    url,
    status: response.status,
    payload: sanitizePayload(payload),
  });

  if (!response.ok) {
    const error = new Error(payload?.detail || payload?.message || '요청에 실패했습니다.');
    error.status = response.status;
    error.payload = payload;
    console.warn('[API Error]', {
      method,
      url,
      status: response.status,
      payload: sanitizePayload(payload),
    });
    throw error;
  }

  return payload;
};
