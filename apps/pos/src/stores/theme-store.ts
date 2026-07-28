import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'openpos-theme' },
  ),
);

export const colors = {
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    bgTertiary: '#F1F5F9',
    bgHover: '#F3F4F6',
    bgCard: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    primary: '#2563EB',
    primaryBg: '#EFF6FF',
    success: '#22C55E',
    successBg: '#DCFCE7',
    danger: '#EF4444',
    dangerBg: '#FEE2E2',
    warning: '#F59E0B',
    warningBg: '#FEF9C3',
    purple: '#8B5CF6',
    purpleBg: '#F3E8FF',
    cyan: '#0891B2',
    cyanBg: '#CFFAFE',
    sidebar: '#0F172A',
    sidebarText: '#CBD5E1',
    sidebarActive: '#2563EB',
  },
  dark: {
    bg: '#0F172A',
    bgSecondary: '#1E293B',
    bgTertiary: '#334155',
    bgHover: '#1E293B',
    bgCard: '#1E293B',
    border: '#334155',
    borderLight: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0F172A',
    primary: '#3B82F6',
    primaryBg: '#1E3A5F',
    success: '#22C55E',
    successBg: '#14532D',
    danger: '#EF4444',
    dangerBg: '#7F1D1D',
    warning: '#F59E0B',
    warningBg: '#78350F',
    purple: '#A78BFA',
    purpleBg: '#3B1F6E',
    cyan: '#22D3EE',
    cyanBg: '#164E63',
    sidebar: '#020617',
    sidebarText: '#94A3B8',
    sidebarActive: '#3B82F6',
  },
} as const;

export type Colors = typeof colors.light;
