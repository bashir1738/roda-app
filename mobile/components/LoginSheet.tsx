import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Platform,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import Modal from 'react-native-modal';
import { useColorScheme } from 'nativewind';
import { useWallet } from '../providers/WalletContext';
import { getStoredEmail } from '../lib/wallet';
import { friendlyError } from '../lib/sendTx';
import { Icon } from './Icon';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function LoginSheet() {
  const {
    loginVisible, closeLogin, loginWithEmail, createDeviceWallet, connectMwa,
    isLoggingIn, backupCode, verifyBackupCode,
  } = useWallet();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState('');

  useEffect(() => {
    if (!loginVisible) return;
    getStoredEmail().then((stored) => {
      if (stored) setEmail(stored);
    }).catch(() => {});
  }, [loginVisible]);

  const onClose = () => {
    setEmail('');
    setError(null);
    closeLogin();
  };

  const onSubmit = async () => {
    setError(null);
    try {
      await loginWithEmail(email);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const onMwaConnect = async () => {
    setError(null);
    try {
      await connectMwa();
      closeLogin();
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const onCreateWallet = async () => {
    setError(null);
    try {
      await createDeviceWallet();
      closeLogin();
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const onVerifyBackupCode = async () => {
    setError(null);
    if (!(await verifyBackupCode(recoveryInput))) {
      setError('That backup code is not valid.');
    }
  };

  const valid = EMAIL_RE.test(email.trim());

  return (
    <Modal
      isVisible={loginVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.55}
      style={{ justifyContent: 'flex-end', margin: 0 }}
      useNativeDriver
      useNativeDriverForBackdrop
      avoidKeyboard
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="bg-white dark:bg-[#111111] rounded-t-3xl px-6 pt-3 pb-10">
          <View className="self-center w-10 h-1 rounded-full bg-charcoal/15 dark:bg-white/25 mb-6" />

          <View className="items-center mb-7">
            <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center mb-4">
              <Icon name="leaf" size={28} color="#000000" />
            </View>
            <Text className="text-charcoal dark:text-white text-2xl font-black text-center">
              Welcome to Roda
            </Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center mt-2 leading-relaxed px-2">
              Continue with email, create an in-app wallet, or connect Meteor.
              Your signing key stays under your control.
            </Text>
          </View>

          {backupCode ? (
            <View className="gap-3">
              <Text className="text-charcoal dark:text-white text-base font-bold">
                Save your one-time backup code
              </Text>
              <Text className="text-muted dark:text-[#A1A1AA] text-sm">
                Store this code offline. Enter it below to finish email sign-in.
              </Text>
              <Text selectable className="text-charcoal dark:text-white text-2xl font-black tracking-[4px] text-center py-4">
                {backupCode}
              </Text>
              <TextInput
                value={recoveryInput}
                onChangeText={setRecoveryInput}
                autoCapitalize="characters"
                placeholder="Enter backup code"
                placeholderTextColor={isDark ? '#A1A1AA' : '#6B6B6B'}
                className="text-charcoal dark:text-white text-base bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-border dark:border-white/10 px-4 py-4 rounded-2xl"
              />
              {error && <Text className="text-red-500 text-sm">{error}</Text>}
              <TouchableOpacity className="bg-primary rounded-full py-4 items-center" onPress={onVerifyBackupCode}>
                <Text className="text-black text-base font-bold">Verify and continue</Text>
              </TouchableOpacity>
            </View>
          ) : <View className="gap-3">
            <TextInput
              className="text-charcoal dark:text-white text-base bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-[#BEEEDB] dark:border-white/15 px-4 py-4 rounded-2xl"
              placeholder="you@example.com"
              placeholderTextColor={isDark ? '#A1A1AA' : '#6B6B6B'}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
            />
            {error && (
              <Text className="text-red-500 text-sm px-1">{error}</Text>
            )}
            <TouchableOpacity
              className="bg-primary rounded-full py-4 items-center"
              onPress={onSubmit}
              disabled={!valid || isLoggingIn}
              style={{ opacity: !valid || isLoggingIn ? 0.3 : 1 }}
            >
              <Text className="text-black text-base font-bold">
                {isLoggingIn ? 'Waiting for code…' : 'Continue'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border border-primary/40 dark:border-[#00C08B]/40 bg-primary/5 dark:bg-[#00C08B]/10 rounded-full py-4 items-center"
              onPress={onCreateWallet}
              disabled={isLoggingIn}
            >
              <Text className="text-primary dark:text-[#00C08B] text-base font-bold">
                Create in-app wallet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border border-primary/40 dark:border-[#00C08B]/40 bg-primary/5 dark:bg-[#00C08B]/10 rounded-full py-4 items-center"
              onPress={onMwaConnect}
              disabled={isLoggingIn}
            >
              <Text className="text-primary dark:text-[#00C08B] text-base font-bold">
                Connect Meteor wallet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-3 items-center" onPress={onClose}>
              <Text className="text-muted dark:text-[#A1A1AA] text-sm">Not now</Text>
            </TouchableOpacity>
          </View>}

          <Text className="text-muted dark:text-[#A1A1AA]/70 text-[11px] text-center mt-5 leading-relaxed">
            Your keys stay under your control. Testnet funds only.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
