import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { useColorScheme } from 'nativewind';
import { useWallet } from '../providers/WalletContext';
import { getStoredEmail } from '../lib/wallet';
import { isMagicEnabled } from '../lib/magic';
import { type NearWalletProvider } from '../lib/nearWalletConnect';
import { friendlyError } from '../lib/sendTx';
import { Icon, type IconName } from './Icon';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function LoginSheet() {
  const {
    loginVisible,
    closeLogin,
    loginWithEmail,
    createDeviceWallet,
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
    setError(null);
    try {
      await loginWithEmail(email);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const onConnectWallet = async (provider: NearWalletProvider) => {
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

  const onCreateWallet = async () => {
    setError(null);
    setConnectingProvider('device');
    try {
      await createDeviceWallet();
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
      setError('That backup code is not valid.');
    }
  };

  const valid = EMAIL_RE.test(email.trim());
  const busy = isLoggingIn || !!connectingProvider;

  return (
    <Modal
      isVisible={loginVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.6}
      style={{ justifyContent: 'flex-end', margin: 0 }}
      useNativeDriver
      useNativeDriverForBackdrop
      avoidKeyboard
    >
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
                Connect your NEAR account via Magic email, in-app key, or external wallet.
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
                  onChangeText={setRecoveryInput}
                  autoCapitalize="characters"
                  placeholder="Enter backup code"
                  placeholderTextColor={isDark ? '#A1A1AA' : '#6B6B6B'}
                  className="text-charcoal dark:text-white text-base bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-border dark:border-white/10 px-4 py-3.5 rounded-2xl"
                />
                {error && <Text className="text-red-500 text-xs">{error}</Text>}
                <TouchableOpacity
                  className="bg-primary rounded-full py-4 items-center mt-2"
                  onPress={onVerifyBackupCode}
                >
                  <Text className="text-black text-base font-bold">Verify and continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                {/* 1. Email Sign-In (Magic) */}
                <View className="gap-2">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">
                    Continue with Email
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
                    className="bg-primary rounded-full py-3.5 items-center justify-center flex-row gap-2"
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

                {error && <Text className="text-red-500 text-xs px-1">{error}</Text>}

                {/* Divider */}
                <View className="flex-row items-center gap-3 my-2">
                  <View className="flex-1 h-[1px] bg-border dark:bg-white/10" />
                  <Text className="text-muted dark:text-[#8E8E93] text-[11px] font-bold uppercase">
                    or connect with
                  </Text>
                  <View className="flex-1 h-[1px] bg-border dark:bg-white/10" />
                </View>

                {/* 2. Create In-App NEAR Wallet */}
                <TouchableOpacity
                  className="flex-row items-center justify-between p-3.5 rounded-2xl border border-primary/30 dark:border-[#00C08B]/30 bg-primary/5 dark:bg-[#00C08B]/10"
                  onPress={onCreateWallet}
                  disabled={busy}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center">
                      <Icon name="key-outline" size={20} color="#00C08B" />
                    </View>
                    <View>
                      <Text className="text-charcoal dark:text-white font-bold text-sm">
                        Create In-App Wallet
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                        Instant self-custody NEAR keypair
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color="#00C08B" />
                </TouchableOpacity>

                {/* 3. MyNearWallet */}
                <TouchableOpacity
                  className="flex-row items-center justify-between p-3.5 rounded-2xl border border-border dark:border-white/10 bg-[#F8F9FA] dark:bg-[#1C1C1E]"
                  onPress={() => onConnectWallet('mynearwallet')}
                  disabled={busy}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-charcoal/5 dark:bg-white/10 items-center justify-center">
                      <Icon name="wallet-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View>
                      <Text className="text-charcoal dark:text-white font-bold text-sm">
                        MyNearWallet
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                        Community standard NEAR web wallet
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={isDark ? '#8E8E93' : '#6B6B6B'} />
                </TouchableOpacity>

                {/* 4. Meteor Wallet */}
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
                        Meteor Wallet
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                        NEAR browser & mobile wallet
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={isDark ? '#8E8E93' : '#6B6B6B'} />
                </TouchableOpacity>

                {/* 5. HERE Wallet */}
                <TouchableOpacity
                  className="flex-row items-center justify-between p-3.5 rounded-2xl border border-border dark:border-white/10 bg-[#F8F9FA] dark:bg-[#1C1C1E]"
                  onPress={() => onConnectWallet('here')}
                  disabled={busy}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-charcoal/5 dark:bg-white/10 items-center justify-center">
                      <Icon name="shield-checkmark-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View>
                      <Text className="text-charcoal dark:text-white font-bold text-sm">
                        HERE Wallet
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                        Mobile self-custody NEAR wallet
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={isDark ? '#8E8E93' : '#6B6B6B'} />
                </TouchableOpacity>

                {/* Not Now button */}
                <TouchableOpacity className="py-2 items-center" onPress={onClose}>
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
    </Modal>
  );
}
