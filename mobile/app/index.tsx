import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useWallet } from '../providers/WalletContext';
import { Icon } from '../components/Icon';
import { getStoredEmail } from '../lib/wallet';

const ONBOARDING_COMPLETE_KEY = 'roda_onboarding_complete';

// Branded launch screen — shows the Roda logo + wordmark (Satoshi) before
// handing off to onboarding (or the app, if a wallet is already connected).
export default function Splash() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [onboardingComplete, setOnboardingComplete] = React.useState<boolean | null>(null);
  const [storedEmail, setStoredEmail] = React.useState<string | null | undefined>(undefined);

  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordTranslate = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY),
      getStoredEmail(),
    ])
      .then(([onboardingValue, email]) => {
        setOnboardingComplete(onboardingValue === '1');
        setStoredEmail(email);
      })
      .catch(() => {
        setOnboardingComplete(false);
        setStoredEmail(null);
      });
  }, []);

  useEffect(() => {
    if (onboardingComplete === null || storedEmail === undefined) return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(wordTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      router.replace(isConnected || (onboardingComplete && !!storedEmail) ? '/(tabs)' : '/onboarding');
    }, 2100);
    return () => clearTimeout(t);
  }, [isConnected, onboardingComplete, storedEmail]);

  return (
    <View className="flex-1 bg-primary items-center justify-center">
      

      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }} className="items-center">
        {/* Logo mark */}
        <View
          className="w-24 h-24 rounded-3xl bg-accent items-center justify-center mb-6"
          style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}
        >
          <Icon name="leaf" size={50} color="#421F6D" />
        </View>
      </Animated.View>

      {/* Wordmark */}
      <Animated.Text
        style={{ opacity: wordOpacity, transform: [{ translateY: wordTranslate }] }}
        className="text-surface text-5xl font-black tracking-tight"
      >
        Roda
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={{ opacity: taglineOpacity }} className="text-surface/60 text-sm font-medium mt-2">
        Rotating savings, reimagined
      </Animated.Text>

      {/* Footer mark */}
      <Animated.View style={{ opacity: taglineOpacity }} className="absolute bottom-12 items-center">
        <Text className="text-surface/40 text-xs font-medium">Powered by NEAR</Text>
      </Animated.View>
    </View>
  );
}
