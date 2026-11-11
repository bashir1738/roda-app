import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Vibration, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../contexts/AuthContext';
import { PinPad, PIN_LENGTH } from '../../components/PinPad';
import { Icon } from '../../components/Icon';

type Step = 'enter' | 'confirm' | 'done';

export default function PinSetup() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { setupPin } = useAuth();

  const [step, setStep] = useState<Step>('enter');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const firstRef = useRef('');
  const secondRef = useRef('');
  const stepRef = useRef<Step>('enter');

  const shake = () => {
    Vibration.vibrate(200);
    setMismatch(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onKey = (key: string) => {
    if (mismatch) setMismatch(false);
    if (stepRef.current === 'enter') {
      const cur = firstRef.current;
      const val = key === '⌫' ? cur.slice(0, -1) : cur.length < PIN_LENGTH ? cur + key : cur;
      firstRef.current = val;
      setFirst(val);
      if (val.length === PIN_LENGTH) {
        stepRef.current = 'confirm';
        setTimeout(() => setStep('confirm'), 150);
      }
    } else {
      const cur = secondRef.current;
      const val = key === '⌫' ? cur.slice(0, -1) : cur.length < PIN_LENGTH ? cur + key : cur;
      secondRef.current = val;
      setSecond(val);
      if (val.length === PIN_LENGTH) {
        if (val === firstRef.current) {
          setupPin(firstRef.current).then(() => {
            setStep('done');
            setTimeout(() => router.replace('/(tabs)'), 1200);
          });
        } else {
          shake();
          setTimeout(() => { secondRef.current = ''; setSecond(''); }, 500);
        }
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#111111]" edges={['top', 'bottom']}>
      

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        {step !== 'done' && (
          <>
            <View style={{
              width: 64, height: 64, borderRadius: 22,
              backgroundColor: isDark ? 'rgba(0,192,139,0.15)' : '#E6F9F3',
              alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            }}>
              <Icon name="lock-closed-outline" size={30} color="#00C08B" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#FFFFFF' : '#303030', marginBottom: 8 }}>
              {step === 'enter' ? 'Create your PIN' : 'Confirm your PIN'}
            </Text>
            <Text style={{ fontSize: 14, color: mismatch ? '#D96B43' : (isDark ? '#A1A1AA' : '#6B6B6B'), textAlign: 'center', marginBottom: 36, lineHeight: 20 }}>
              {mismatch
                ? "Those PINs didn't match — enter your 4 digits once more."
                : step === 'enter'
                  ? 'Choose a 4-digit PIN to secure your account.'
                  : 'Enter the same PIN again to confirm.'}
            </Text>
            <PinPad
              length={PIN_LENGTH}
              value={step === 'enter' ? first : second}
              onKey={onKey}
              error={mismatch}
              shakeAnim={shakeAnim}
            />
          </>
        )}

        {step === 'done' && (
          <>
            <View
              style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: isDark ? 'rgba(0,192,139,0.15)' : '#F0FDF4',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(0,192,139,0.3)' : '#BBF7D0',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Icon name="checkmark" size={44} color={isDark ? '#00C08B' : '#16A34A'} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: isDark ? '#FFFFFF' : '#303030', marginBottom: 8 }}>
              All set!
            </Text>
            <Text style={{ fontSize: 15, color: isDark ? '#A1A1AA' : '#6B6B6B', textAlign: 'center', marginBottom: 36 }}>
              Your PIN is secure. You'll use it to authorize transactions.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
