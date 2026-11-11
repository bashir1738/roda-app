import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useWallet } from '../providers/WalletContext';
import { getStoredEmail } from '../lib/wallet';
import { type NearWalletProvider } from '../lib/nearWalletConnect';
import { describeError, friendlyError, isUserRejection } from '../lib/sendTx';
import { Icon } from './Icon';
import { InlineErrorBanner } from './InlineErrorBanner';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function LoginSheet() {
  const {
    loginVisible,
    connect,
    closeLogin,
    loginWithEmail,
    connectNearWallet,
    isLoggingIn,
    backupCode,
    verifyBackupCode,
  } = useWallet();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState('');

  useEffect(() => {
    if (!loginVisible) return;
    getStoredEmail()
      .then((stored) => {
        if (stored) setEmail(stored);
      })
      .catch(() => {});
  }, [loginVisible]);

  const onClose = () => {
    setEmail('');
    setError(null);
    setConnectingProvider(null);
    closeLogin();
  };

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !valid) return;
    setError(null);
    Keyboard.dismiss();
    // Dismiss the modal immediately so Magic's OTP interface is clear and ready on screen
    closeLogin();
    try {
      await loginWithEmail(trimmed);
    } catch (e: any) {
      if (!isUserRejection(e) && !/cancel|closed/i.test(String(e?.message || e))) {
        const d = describeError(e);
        Alert.alert(d.title, d.message, [
          { text: d.actionLabel || 'Try Again', onPress: () => connect() },
        ]);
      }
    }
  };

  const onConnectWallet = async (provider: NearWalletProvider = 'meteor') => {
    setError(null);
    setConnectingProvider(provider);
    try {
      await connectNearWallet(provider);
      closeLogin();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setConnectingProvider(null);
    }
  };

  const onVerifyBackupCode = async () => {
    setError(null);
    if (!(await verifyBackupCode(recoveryInput))) {
      setError("That backup code didn't match — double-check the characters and try again.");
    }
  };

  const valid = EMAIL_RE.test(email.trim());
  const busy = isLoggingIn || !!connectingProvider;

  return (
    <Modal
      visible={loginVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="bg-white dark:bg-[#111111] rounded-t-3xl px-6 pt-3 pb-8 max-h-[85vh]">
            {/* Grab Handle */}
            <View className="self-center w-10 h-1 rounded-full bg-charcoal/15 dark:bg-white/25 mb-4" />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="items-center mb-5">
              <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center mb-3">
                <Icon name="leaf" size={24} color="#000000" />
              </View>
              <Text className="text-charcoal dark:text-white text-2xl font-black text-center">
                Welcome to Roda
              </Text>
              <Text className="text-muted dark:text-[#A1A1AA] text-xs text-center mt-1 px-4 leading-relaxed">
                Create or sign in to your wallet with email, or connect Meteor wallet.
              </Text>
            </View>

            {/* Backup Code Screen */}
            {backupCode ? (
              <View className="gap-3 py-2">
                <Text className="text-charcoal dark:text-white text-base font-bold">
                  Save your one-time backup code
                </Text>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                  Store this code offline. Enter it below to complete email sign-in.
                </Text>
                <Text
                  selectable
                  className="text-charcoal dark:text-white text-2xl font-black tracking-[4px] text-center py-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-2xl border border-border dark:border-white/10"
                >
                  {backupCode}
                </Text>
                <TextInput
                  value={recoveryInput}
                  onChangeText={(v) => { setRecoveryInput(v); setError(null); }}
                  autoCapitalize="characters"
                  placeholder="Enter backup code"
                  placeholderTextColor={isDark ? '#A1A1AA' : '#6B6B6B'}
                  className="text-charcoal dark:text-white text-base bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-border dark:border-white/10 px-4 py-3.5 rounded-2xl"
                />
                {error ? (
                  <InlineErrorBanner error={error} category="validation" compact onDismiss={() => setError(null)} />
                ) : null}
                <TouchableOpacity
                  className="bg-primary rounded-full py-4 items-center mt-2"
                  onPress={onVerifyBackupCode}
                >
                  <Text className="text-black text-base font-bold">Verify and continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                {/* 1. Continue with Email (Magic Link) */}
                <View className="gap-2">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">
                    Email (Magic Link)
                  </Text>
                  <TextInput
                    className="text-charcoal dark:text-white text-base bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-[#BEEEDB] dark:border-white/15 px-4 py-3.5 rounded-2xl"
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
                  />
                  <TouchableOpacity
                    className="bg-primary rounded-full py-3.5 items-center justify-center flex-row gap-2 mt-1"
                    onPress={onSubmit}
                    disabled={!valid || busy}
                    style={{ opacity: !valid || busy ? 0.35 : 1 }}
                  >
                    <Icon name="mail-outline" size={18} color="#000000" />
                    <Text className="text-black text-base font-bold">
                      {isLoggingIn ? 'Waiting for OTP…' : 'Continue with Email'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {error ? (
                  <InlineErrorBanner error={error} compact onDismiss={() => setError(null)} />
                ) : null}

                {/* Divider */}
                <View className="flex-row items-center gap-3 my-2">
                  <View className="flex-1 h-[1px] bg-border dark:bg-white/10" />
                  <Text className="text-muted dark:text-[#8E8E93] text-[11px] font-bold uppercase">
                    or
                  </Text>
                  <View className="flex-1 h-[1px] bg-border dark:bg-white/10" />
                </View>

                {/* 2. Connect Meteor Wallet */}
                <TouchableOpacity
                  className="flex-row items-center justify-between p-3.5 rounded-2xl border border-border dark:border-white/10 bg-[#F8F9FA] dark:bg-[#1C1C1E]"
                  onPress={() => onConnectWallet('meteor')}
                  disabled={busy}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-charcoal/5 dark:bg-white/10 items-center justify-center">
                      <Icon name="planet-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View>
                      <Text className="text-charcoal dark:text-white font-bold text-sm">
                        Connect Meteor Wallet
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                        NEAR browser & mobile wallet
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={isDark ? '#8E8E93' : '#6B6B6B'} />
                </TouchableOpacity>

                {/* Not Now button */}
                <TouchableOpacity className="py-2.5 items-center mt-1" onPress={onClose}>
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-semibold">
                    Not now
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer */}
            <View className="items-center mt-3 pt-2 border-t border-border/40 dark:border-white/5">
              <Text className="text-muted dark:text-[#8E8E93] text-[11px] text-center leading-relaxed">
                Secured by NEAR Protocol • Testnet
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);
}
