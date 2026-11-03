import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useWallet } from '../../providers/WalletContext';
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { useColorScheme } from 'nativewind';
import { Icon, IconName } from '../../components/Icon';
import { getNotificationsEnabled, setNotificationsEnabled } from '../../hooks/useNotifications';

function fmtAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

function SettingRow({
  icon, iconBg, iconColor = '#421F6D', label, labelColor = '#303030', right, isDark = false,
}: {
  icon: IconName;
  iconBg: string; iconColor?: string; label: string; labelColor?: string;
  right: React.ReactNode; isDark?: boolean;
}) {
  return (
    <View className="flex-row items-center px-5 py-4 border-b border-[#EDE6DC] dark:border-white/8">
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: iconBg }}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Text className={`flex-1 text-sm font-semibold ${labelColor === '#303030' ? 'text-charcoal dark:text-white' : ''}`} style={labelColor !== '#303030' ? { color: labelColor } : undefined}>{label}</Text>
      {right}
    </View>
  );
}

export default function ProfileTab() {
  const { address, isConnected, disconnect, connect, email } = useWallet();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { openSidebar } = useProfileSidebar();
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifEnabled).catch(() => {});
  }, []);

  const toggleNotifications = async (value: boolean) => {
    const enabled = await setNotificationsEnabled(value);
    setNotifEnabled(enabled);
    if (!value) return;
    if (!enabled) Alert.alert('Notifications unavailable', 'Enable notifications in your device Settings and use a development build.');
  };

  const confirmDisconnect = () => Alert.alert(
    'Sign out', 'You can sign back in anytime with the same email.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => { void disconnect(); } }],
  );

  if (!isConnected) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={['top']}>
        <View className="flex-row justify-end px-5 pt-3">
          <ProfileButton onPress={openSidebar} />
        </View>
        <View className="flex-1 items-center justify-center gap-4 px-10">
          <View className="w-20 h-20 rounded-full bg-primary/10 dark:bg-[rgba(192,132,252,0.15)] items-center justify-center">
            <Icon name="person-outline" size={36} color={isDark ? '#C084FC' : '#421F6D'} />
          </View>
          <Text className="text-charcoal dark:text-white text-xl font-black text-center">You're signed out</Text>
          <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center leading-relaxed">
            Sign in with your email to see your profile and manage settings.
          </Text>
          <TouchableOpacity className="bg-primary rounded-full px-8 py-3.5 mt-2" onPress={connect}>
            <Text className="text-white font-bold">Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={['top']}>
      <View className="flex-row justify-end px-5 pt-3">
        <ProfileButton onPress={openSidebar} />
      </View>
      <ScrollView className="flex-1 bg-white dark:bg-[#121212]" contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View className="bg-white dark:bg-[#121212] px-5 pt-6 pb-14 items-center">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: isDark ? '#3A3A3C' : '#F3F4F6' }}>
            <Icon name="person" size={38} color={isDark ? '#C084FC' : '#421F6D'} />
          </View>
          {email ? (
            <Text
              className="text-charcoal dark:text-white text-base font-bold text-center"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {email}
            </Text>
          ) : null}
          <Text className="text-muted dark:text-[#A1A1AA] text-sm font-mono mt-1 opacity-70">
            {address ? fmtAddr(address) : ''}
          </Text>
        </View>

        {/* Settings card */}
        <View className="mx-4 -mt-8 bg-white dark:bg-[#121212] rounded-3xl overflow-hidden"
          style={{ shadowColor: '#421F6D', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>

          <SettingRow
            icon="moon-outline"
            iconBg={isDark ? 'rgba(192,132,252,0.15)' : 'rgba(66,31,109,0.12)'}
            iconColor={isDark ? '#C084FC' : '#421F6D'}
            label="Dark Mode"
            right={<Switch value={colorScheme === 'dark'} onValueChange={(val) => setColorScheme(val ? 'dark' : 'light')} />}
          />
          <SettingRow
            icon="notifications-outline"
            iconBg={isDark ? 'rgba(192,132,252,0.15)' : 'rgba(66,31,109,0.12)'}
            iconColor={isDark ? '#C084FC' : '#421F6D'}
            label="Push Notifications"
            right={
              <Switch
                value={notifEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#D4C4E8', true: '#421F6D' }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <TouchableOpacity onPress={confirmDisconnect}>
            <SettingRow
              icon="log-out-outline"
              iconBg={isDark ? 'rgba(249,115,22,0.15)' : 'rgba(193,68,14,0.10)'}
              iconColor={isDark ? '#F97316' : '#C1440E'}
              label="Sign out"
              labelColor={isDark ? '#F97316' : '#C1440E'}
              right={<Icon name="chevron-forward" size={16} color={isDark ? '#F97316' : '#C1440E'} />}
            />
          </TouchableOpacity>
        </View>

        {/* Network */}
        <View className="mx-4 mt-4 bg-white dark:bg-[#121212] rounded-3xl px-5 py-4"
          style={{ shadowColor: '#421F6D', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text className="text-muted dark:text-[#A1A1AA] text-xs uppercase tracking-widest mb-3">Network</Text>
          <View className="flex-row items-center gap-2.5">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="text-charcoal dark:text-white text-sm font-semibold">NEAR Testnet</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
