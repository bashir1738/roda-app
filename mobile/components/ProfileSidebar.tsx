import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Animated, TouchableOpacity, Dimensions,
  TouchableWithoutFeedback, ScrollView, Switch, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../providers/WalletContext';
import { isMagicEnabled, revealMagicPrivateKey } from '../lib/magic';
import { getNotificationsEnabled, setNotificationsEnabled } from '../hooks/useNotifications';
import { useColorScheme } from 'nativewind';
import { Icon, IconName } from './Icon';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.86;

function SidebarRow({
  icon, iconBg, iconColor = '#421F6D', label, labelColor, right, isDark,
}: {
  icon: IconName;
  iconBg: string; iconColor?: string; label: string; labelColor?: string;
  right: React.ReactNode; isDark: boolean;
}) {
  const isAlert = !!labelColor;
  return (
    <View style={[styles.row, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC' }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: isAlert ? labelColor : (isDark ? '#FFFFFF' : '#303030') }]}>
        {label}
      </Text>
      {right}
    </View>
  );
}

function fmtAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ProfileSidebar({ visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  const { address, isConnected, disconnect, connect } = useWallet();
  const { walletKind } = useWallet();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [exportingKey, setExportingKey] = useState(false);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifEnabled).catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(SIDEBAR_WIDTH);
      overlayAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(overlayAnim, { toValue: 0.5, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SIDEBAR_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const toggleNotifications = async (value: boolean) => {
    const enabled = await setNotificationsEnabled(value);
    setNotifEnabled(enabled);
    if (value && !enabled) {
      Alert.alert('Notifications unavailable', 'Enable notifications in your device Settings and use a development build.');
    }
  };

  const confirmDisconnect = () => Alert.alert(
    'Sign out', 'You can sign back in anytime with the same social account.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { onClose(); setTimeout(disconnect, 300); } },
    ],
  );

  const exportPrivateKey = async () => {
    setExportingKey(true);
    try {
      await revealMagicPrivateKey();
    } catch (error) {
      console.error('Magic private-key export failed:', error);
    } finally {
      setExportingKey(false);
    }
  };

  if (!mounted) return null;

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBg = isDark ? '#2C2C2E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const sectionLabelColor = isDark ? '#8E8E93' : '#6B6B6B';
  const addrColor = isDark ? '#8E8E93' : '#6B6B6B';
  const closeBtnBg = isDark ? '#3A3A3C' : '#F0EBE0';
  const avatarBg = isDark ? '#3A3A3C' : '#F3F4F6';
  const headerBorderColor = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sidebar panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: headerBorderColor }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                <Icon name="person" size={20} color={isDark ? '#C084FC' : '#421F6D'} />
              </View>
              <Text style={[styles.addrText, { color: addrColor }]} numberOfLines={1}>
                {address ? fmtAddr(address) : 'Wallet'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: closeBtnBg }]}>
              <Icon name="close" size={18} color={isDark ? '#AEAEB2' : '#6B6B6B'} />
            </TouchableOpacity>
          </View>

          {!isConnected ? (
            <View style={styles.signedOut}>
              <View style={[styles.signedOutIcon, isDark && { backgroundColor: 'rgba(192,132,252,0.15)' }]}>
                <Icon name="person-outline" size={32} color={isDark ? '#C084FC' : '#421F6D'} />
              </View>
              <Text style={[styles.signedOutTitle, { color: isDark ? '#FFFFFF' : '#303030' }]}>You're signed out</Text>
              <Text style={[styles.signedOutSub, { color: isDark ? '#8E8E93' : '#6B6B6B' }]}>
                Sign in to manage your profile and settings.
              </Text>
              <TouchableOpacity style={styles.signInBtn} onPress={connect}>
                <Text style={styles.signInText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
              <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>Settings</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {/* Dark Mode Toggle */}
                <SidebarRow
                  isDark={isDark}
                  icon="moon-outline"
                  iconBg={isDark ? 'rgba(120,80,160,0.3)' : 'rgba(66,31,109,0.12)'}
                  iconColor={isDark ? '#C084FC' : '#421F6D'}
                  label="Dark Mode"
                  right={
                    <Switch
                      value={isDark}
                      onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
                      trackColor={{ false: '#D4C4E8', true: '#421F6D' }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />
                {/* Notifications */}
                <SidebarRow
                  isDark={isDark}
                  icon="notifications-outline"
                  iconBg={isDark ? 'rgba(120,80,160,0.3)' : 'rgba(66,31,109,0.12)'}
                  iconColor={isDark ? '#C084FC' : '#421F6D'}
                  label="Push Notifications"
                  right={
                    <Switch
                      value={notifEnabled}
                      onValueChange={toggleNotifications}
                      trackColor={{ false: isDark ? '#3A3A3C' : '#D4C4E8', true: '#421F6D' }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />
                {walletKind === 'magic' && isMagicEnabled && (
                  <TouchableOpacity onPress={exportPrivateKey} disabled={exportingKey}>
                    <SidebarRow
                      isDark={isDark}
                      icon="lock-closed-outline"
                      iconBg={isDark ? 'rgba(192,132,252,0.18)' : 'rgba(66,31,109,0.12)'}
                      iconColor={isDark ? '#C084FC' : '#421F6D'}
                      label={exportingKey ? 'Verifying…' : 'Export Private Key'}
                      right={<Icon name="chevron-forward" size={16} color={isDark ? '#AEAEB2' : '#6B6B6B'} />}
                    />
                  </TouchableOpacity>
                )}
                {/* Sign out */}
                <TouchableOpacity onPress={confirmDisconnect}>
                  <SidebarRow
                    isDark={isDark}
                    icon="log-out-outline"
                    iconBg={isDark ? 'rgba(249,115,22,0.15)' : 'rgba(193,68,14,0.10)'}
                    iconColor={isDark ? '#F97316' : '#C1440E'}
                    label="Sign out"
                    labelColor={isDark ? '#F97316' : '#C1440E'}
                    right={<Icon name="chevron-forward" size={16} color={isDark ? '#F97316' : '#C1440E'} />}
                  />
                </TouchableOpacity>
              </View>

         
            </ScrollView>
          )}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

export function ProfileButton({ onPress }: { onPress: () => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.profileBtn, { backgroundColor: isDark ? '#3A3A3C' : '#F3F4F6' }]}
      accessibilityLabel="Open profile"
    >
      <Icon name="person" size={18} color={isDark ? '#C084FC' : '#421F6D'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
    shadowOffset: { width: -4, height: 0 }, elevation: 10,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  addrText: { fontSize: 11, fontFamily: 'monospace', marginTop: 1, flex: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: 20, marginBottom: 8, marginHorizontal: 20,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  signedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  signedOutIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(66,31,109,0.08)', alignItems: 'center', justifyContent: 'center' },
  signedOutTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  signedOutSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  signInBtn: { backgroundColor: '#421F6D', borderRadius: 100, paddingHorizontal: 32, paddingVertical: 14, marginTop: 4 },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  profileBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
});
