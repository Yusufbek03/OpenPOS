import { useThemeStore, colors, type Colors } from '@/stores/theme-store';

export function useTheme(): { theme: 'light' | 'dark'; c: Colors; toggleTheme: () => void } {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return { theme, c: colors[theme] as Colors, toggleTheme };
}
