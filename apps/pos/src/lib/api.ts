import axios from 'axios';
import { API_BASE } from './api-config';

let onAuthExpired: (() => void) | null = null;

export function setAuthExpiredCallback(cb: () => void) {
  onAuthExpired = cb;
}

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const url = config.url || '';

  if (url.startsWith('/admin/')) {
    config.url = `/admin-handler?_path=${encodeURIComponent(url.substring(7))}`;
  } else if (url === '/admin') {
    config.url = '/admin-handler';
  } else if (url.startsWith('/kitchen/')) {
    config.url = `/kitchen-handler?_path=${encodeURIComponent(url.substring(9))}`;
  } else if (url === '/kitchen') {
    config.url = '/kitchen-handler';
  } else if (url === '/payments') {
    config.url = '/admin-handler?_path=payments';
  } else if (url === '/shifts') {
    config.url = '/admin-handler?_path=shifts';
  } else if (url.startsWith('/reports/')) {
    config.url = `/admin-handler?_path=${encodeURIComponent(url.substring(1))}`;
  } else if (url === '/reports') {
    config.url = '/admin-handler?_path=reports';
  }

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
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('pos_access_token', data.accessToken);
          localStorage.setItem('pos_refresh_token', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('pos_access_token');
          localStorage.removeItem('pos_refresh_token');
          localStorage.removeItem('pos_user');
          if (onAuthExpired) {
            onAuthExpired();
          } else {
            window.location.reload();
          }
        }
      }
    }

    return Promise.reject(error);
  },
);
