import { apiRequest, apiRequestForm } from './apiClient';

export const buildRequestConfig = (config = {}) => {
  return {
    params: config.params,
    headers: config.headers,
    auth: config.auth !== false,
  };
};

export const apiClient = {
  get: async (url, config = {}) => ({
    data: await apiRequest(url, { method: 'GET', ...buildRequestConfig(config) }),
  }),
  post: async (url, data, config = {}) => ({
    data: await apiRequest(url, {
      method: 'POST',
      body: data,
      ...buildRequestConfig(config),
    }),
  }),
  put: async (url, data, config = {}) => ({
    data: await apiRequest(url, {
      method: 'PUT',
      body: data,
      ...buildRequestConfig(config),
    }),
  }),
  patch: async (url, data, config = {}) => ({
    data: await apiRequest(url, {
      method: 'PATCH',
      body: data,
      ...buildRequestConfig(config),
    }),
  }),
  delete: async (url, config = {}) => ({
    data: await apiRequest(url, { method: 'DELETE', ...buildRequestConfig(config) }),
  }),
  upload: async (url, formData, config = {}) => ({
    data: await apiRequestForm(url, {
      method: config.method || 'POST',
      formData,
      ...buildRequestConfig(config),
    }),
  }),
};
