import axios from 'axios';
import { API_BASE } from './api-config';

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kitchen_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('kitchen_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, { refreshToken });
          localStorage.setItem('kitchen_token', data.accessToken);
          localStorage.setItem('kitchen_refresh', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('kitchen_token');
          localStorage.removeItem('kitchen_refresh');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);
