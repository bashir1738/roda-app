import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from 'nativewind';

import { useWallet } from '../../providers/WalletContext';
import { isMagicEnabled } from '../../lib/magic';
import { PrivateKeyModal } from '../../components/PrivateKeyModal';
import { getNotificationsEnabled, setNotificationsEnabled } from '../../hooks/useNotifications';
import { useDisplayName } from '../../hooks/useDisplayName';
import { ClaimNameButton } from '../../components/ClaimNameButton';
import { Icon, type IconName } from '../../components/Icon';

function fmtAddr(addr: string) {
  if (!addr) return '';
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

interface SettingRowProps {
  icon: IconName;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  isDark: boolean;
}

function SettingRow({
  icon,
  iconBg,
  iconColor = '#00C08B',
  title,
  subtitle,
  right,
  onPress,
  isLast = false,
  isDark,
}: SettingRowProps) {
  const defaultBg = isDark ? 'rgba(0,192,139,0.12)' : 'rgba(0,192,139,0.1)';
  const borderCol = isDark ? 'rgba(255,255,255,0.06)' : '#F0ECE4';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#8E8E93' : '#6B6B6B';

  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderCol },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg ?? defaultBg }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowTextCol}>
        <Text style={[styles.rowTitle, { color: textPrimary }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.rowSubtitle, { color: textMuted }]}>{subtitle}</Text>}
      </View>
      {right ?? (
        onPress ? (
          <Icon name="chevron-forward" size={16} color={isDark ? '#636366' : '#C7C7CC'} />
        ) : null
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default function ProfileTab() {
  const { address, isConnected, disconnect, connect, walletKind, email } = useWallet();
  const { onChainName, localName } = useDisplayName(address);
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifEnabled).catch(() => {});
  }, []);

  const toggleNotifications = async (value: boolean) => {
    const enabled = await setNotificationsEnabled(value);
    setNotifEnabled(enabled);
    if (value && !enabled) {
      Alert.alert(
        'Notifications Unavailable',
        'Enable notifications in device Settings to receive circle reminders and payout alerts.',
      );
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await Clipboard.setStringAsync(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const openExplorer = () => {
    if (!address) return;
    const url = `https://testnet.nearblocks.io/address/${address}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot open link', 'Please visit testnet.nearblocks.io directly.');
    });
  };

  const confirmDisconnect = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            disconnect();
          },
        },
      ],
    );
  };

  const bg = isDark ? '#111111' : '#FDFBF7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#8E8E93' : '#6B6B6B';

  const displayName = onChainName ? `@${onChainName}` : localName ? `@${localName}` : null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={[styles.topBarTitle, { color: textPrimary }]}>Profile</Text>
      </View>

      {!isConnected ? (
        <View style={styles.signedOutContainer}>
          <View style={styles.signedOutIconCircle}>
            <Icon name="person-outline" size={38} color="#00C08B" />
          </View>
          <Text style={[styles.signedOutTitle, { color: textPrimary }]}>Welcome to Roda</Text>
          <Text style={[styles.signedOutSub, { color: textMuted }]}>
            Connect your NEAR wallet to view your profile, manage savings circles, and customize your settings.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={connect}
            activeOpacity={0.85}
          >
            <Text style={styles.signInButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Profile Card */}
          <View
            style={[
              styles.profileHeroCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.profileHeroRow}>
              <View style={styles.avatarCircle}>
                <Icon name="person" size={26} color="#00C08B" />
              </View>

              <View style={styles.profileInfoCol}>
                <View style={styles.nameRow}>
                  <Text style={[styles.profileNameText, { color: textPrimary }]} numberOfLines={1}>
                    {displayName ?? 'Smart Account'}
                  </Text>
                  {!!onChainName && (
                    <View style={styles.verifiedBadge}>
                      <Icon name="checkmark-circle" size={15} color="#00C08B" />
                    </View>
                  )}
                </View>

                <Text style={[styles.profileSubText, { color: textMuted }]}>
                  {email ??
                    (walletKind === 'meteor'
                      ? 'Meteor Wallet'
                      : walletKind === 'mynearwallet'
                      ? 'MyNearWallet'
                      : walletKind === 'here'
                      ? 'HERE Wallet'
                      : walletKind === 'device'
                      ? 'In-App NEAR Wallet'
                      : 'NEAR Account')}
                </Text>
              </View>
            </View>

            {address && (
              <TouchableOpacity
                onPress={copyAddress}
                activeOpacity={0.7}
                style={[
                  styles.addressPill,
                  {
                    backgroundColor: isDark ? '#141416' : '#F7F6F2',
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Icon
                  name={copied ? 'checkmark-circle' : 'wallet-outline'}
                  size={13}
                  color={copied ? '#00C08B' : textMuted}
                />
                <Text
                  style={[
                    styles.addressPillText,
                    { color: copied ? '#00C08B' : textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {copied ? 'Address Copied!' : fmtAddr(address)}
                </Text>
                <Icon
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={13}
                  color={copied ? '#00C08B' : textMuted}
                />
              </TouchableOpacity>
            )}

            <ClaimNameButton />
          </View>

          {/* Settings Group */}
          <Text style={[styles.sectionLabel, { color: textMuted }]}>SETTINGS</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <SettingRow
              isDark={isDark}
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              right={
                <Switch
                  value={isDark}
                  onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
                  trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#00C08B' }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <SettingRow
              isDark={isDark}
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Circle reminders and payout alerts"
              right={
                <Switch
                  value={notifEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#00C08B' }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            {(walletKind === 'device' || (walletKind === 'magic' && isMagicEnabled)) && (
              <SettingRow
                isDark={isDark}
                icon="key-outline"
                title="Export Private Key"
                subtitle="Backup your secret recovery key"
                onPress={() => setKeyModalVisible(true)}
              />
            )}

            <SettingRow
              isDark={isDark}
              icon="open-outline"
              title="View on Explorer"
              subtitle="nearblocks.io testnet"
              onPress={openExplorer}
              isLast
            />
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={confirmDisconnect}
            activeOpacity={0.8}
            style={[
              styles.signOutButton,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2',
              },
            ]}
          >
            <View style={styles.signOutIconCircle}>
              <Icon name="log-out-outline" size={17} color="#EF4444" />
            </View>
            <Text style={styles.signOutText}>Sign Out</Text>
            <Icon name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: textMuted }]}>
              Roda · NEAR Protocol Testnet
            </Text>
          </View>
        </ScrollView>
      )}

      <PrivateKeyModal
        visible={keyModalVisible}
        address={address}
        onClose={() => setKeyModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  topBarTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },
  profileHeroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  profileHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,192,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  profileSubText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  addressPillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextCol: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  signOutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signOutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  signedOutContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  signedOutIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0,192,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signedOutTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  signedOutSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  signInButton: {
    backgroundColor: '#00C08B',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 100,
    shadowColor: '#00C08B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 32,
  },
  signInButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
