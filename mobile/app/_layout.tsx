// Must be the very first import — crypto/Buffer polyfills for React Native,
// before any network client code evaluates.
import '../polyfills';
import '../global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { LogBox, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { applyGlobalFont } from '../lib/applyFonts';
import { getMagic, isMagicEnabled } from '../lib/magic';
import { QueryProvider } from '../providers/QueryProvider';
import { WalletProvider } from '../providers/WalletContext';
import { LoginSheet } from '../components/LoginSheet';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { ProfileSidebarProvider, useProfileSidebar } from '../contexts/ProfileSidebarContext';
import { useColorScheme } from 'nativewind';
import { useNotifications } from '../hooks/useNotifications';
import { useUsdcMint } from '../hooks/useUsdcMint';

// Force Satoshi on all text app-wide (runs once at module load).
applyGlobalFont();

// RN 0.86 deprecation notice fired by third-party navigation/modal animations
// (expo-router stack card, react-native-modal) — cosmetic only.
LogBox.ignoreLogs(['InteractionManager has been deprecated']);

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

SplashScreen.preventAutoHideAsync();

/**
 * Magic's OTP/login UI host — required for the email sign-in flow.
 *
 * Deferred until after mount: Magic's client constructor subscribes to
 * `window`, so building it during Expo Router's static server render
 * (`web.output: "static"`) crashes the dev server with
 * "ReferenceError: window is not defined".
 */
function MagicRelayer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!isMagicEnabled || !mounted) return null;
  const Relayer = getMagic().Relayer;
  return <Relayer />;
}

function AppContent() {
  useNotifications();
  // Warm the config-backed USDC mint before any screen reads balances.
  useUsdcMint();

  const { colorScheme, setColorScheme } = useColorScheme();
  const { sidebarVisible, closeSidebar } = useProfileSidebar();

  // Sync NativeWind with the system color scheme on iOS.
  // Without this, the 'dark' class won't be applied unless manually set.
  React.useEffect(() => {
    const { Appearance } = require('react-native');
    const systemScheme = Appearance.getColorScheme();
    if (systemScheme) setColorScheme(systemScheme);
    const sub = Appearance.addChangeListener(({ colorScheme: s }: { colorScheme: 'light' | 'dark' | null }) => {
      if (s) setColorScheme(s);
    });
    return () => sub.remove();
  }, []);

  const isDark = colorScheme === 'dark';

  return (
    <View
      className={isDark ? 'dark flex-1 bg-[#111111]' : 'flex-1 bg-[#FDFBF7]'}
      style={{ flex: 1, backgroundColor: isDark ? '#111111' : '#FDFBF7' }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#111111' : '#FDFBF7' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <LoginSheet />
      <MagicRelayer />
      <ProfileSidebar visible={sidebarVisible} onClose={closeSidebar} />
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.ttf'),
    'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'),
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <WalletProvider>
          <ProfileSidebarProvider>
            <AppContent />
          </ProfileSidebarProvider>
        </WalletProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
