import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, LoginResponse } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<LoginResponse>('/auth/login', {
            username,
            password,
          });
          localStorage.setItem('pos_access_token', data.accessToken);
          localStorage.setItem('pos_refresh_token', data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore
        }
        localStorage.removeItem('pos_access_token');
        localStorage.removeItem('pos_refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      loadUser: async () => {
        const token = localStorage.getItem('pos_access_token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        try {
          const { data } = await api.get<{ id: string; fullName: string; username: string; role: string; branchId: string | null }>('/auth/me');
          set({ user: data, isAuthenticated: true });
        } catch {
          localStorage.removeItem('pos_access_token');
          localStorage.removeItem('pos_refresh_token');
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'pos-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
