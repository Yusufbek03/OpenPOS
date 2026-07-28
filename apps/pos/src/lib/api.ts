import axios from 'axios';
import { API_BASE } from './api-config';

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('pos_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, { refreshToken });
          localStorage.setItem('pos_access_token', data.accessToken);
          localStorage.setItem('pos_refresh_token', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('pos_access_token');
          localStorage.removeItem('pos_refresh_token');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);
