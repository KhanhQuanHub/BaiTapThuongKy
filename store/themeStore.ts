import { Appearance, ColorSchemeName, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import {
  colors as lightPalette,
  darkColors as darkPalette,
  ThemeColors,
  ThemeMode,
} from '../constants/theme';

const STORAGE_KEY = '@fitlog_theme_mode';

export type ThemeState = {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  initTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const resolveIsDark = (mode: ThemeMode, sysScheme?: ColorSchemeName): boolean => {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  const current = sysScheme ?? Appearance.getColorScheme();
  return current === 'dark';
};

// Kích hoạt rung phản hồi công thái học nhẹ
const triggerHaptic = () => {
  if (Platform.OS !== 'web') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // Bỏ qua lỗi rung trên thiết bị không hỗ trợ
    }
  }
};

let appearanceListenerAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'light',
  isDark: false,
  colors: lightPalette,

  initTheme: async () => {
    try {
      const savedMode = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
      const initialMode: ThemeMode = savedMode ?? 'light';
      const isDark = resolveIsDark(initialMode);

      set({
        themeMode: initialMode,
        isDark,
        colors: isDark ? darkPalette : lightPalette,
      });

      // Lắng nghe thay đổi chế độ hệ điều hành nếu đang ở chế độ 'system'
      if (!appearanceListenerAttached) {
        appearanceListenerAttached = true;
        Appearance.addChangeListener(({ colorScheme }) => {
          const currentMode = get().themeMode;
          if (currentMode === 'system') {
            const nextDark = colorScheme === 'dark';
            set({
              isDark: nextDark,
              colors: nextDark ? darkPalette : lightPalette,
            });
          }
        });
      }
    } catch {
      // Fallback về giá trị mặc định nếu đọc storage lỗi
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    triggerHaptic();
    const isDark = resolveIsDark(mode);
    set({
      themeMode: mode,
      isDark,
      colors: isDark ? darkPalette : lightPalette,
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Bỏ qua lỗi lưu trữ cục bộ
    }
  },

  toggleTheme: async () => {
    triggerHaptic();
    const currentIsDark = get().isDark;
    const nextMode: ThemeMode = currentIsDark ? 'light' : 'dark';
    const nextIsDark = !currentIsDark;

    set({
      themeMode: nextMode,
      isDark: nextIsDark,
      colors: nextIsDark ? darkPalette : lightPalette,
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // Bỏ qua lỗi lưu trữ cục bộ
    }
  },
}));

/**
 * Hook tiện ích đồng bộ màu và trạng thái Theme toàn ứng dụng
 */
export function useTheme() {
  const themeMode = useThemeStore((state) => state.themeMode);
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return {
    themeMode,
    isDark,
    colors,
    setThemeMode,
    toggleTheme,
  };
}
