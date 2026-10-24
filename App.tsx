import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from './navigation/RootNavigator';
import { useThemeStore } from './store/themeStore';

export default function App() {
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Navigation theme đồng bộ với hệ thống theme FitLog
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} animated />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
