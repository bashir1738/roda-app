import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  Linking,
  BackHandler,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from 'nativewind';

import { useWallet } from '../providers/WalletContext';
import { isMagicEnabled } from '../lib/magic';
import { PrivateKeyModal } from './PrivateKeyModal';
import { getNotificationsEnabled, setNotificationsEnabled } from '../hooks/useNotifications';
import { useDisplayName } from '../hooks/useDisplayName';
import { ClaimNameButton } from './ClaimNameButton';
import { ReputationCard } from './ReputationBadge';
import { Icon, type IconName } from './Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function fmtAddr(addr: string) {
  if (!addr) return '';
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

interface SidebarRowProps {
  icon: IconName;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  isDark: boolean;
}

function SidebarRow({
  icon,
  iconBg,
  iconColor = '#00C08B',
  title,
  subtitle,
  titleColor,
  right,
  onPress,
  isLast = false,
  isDark,
}: SidebarRowProps) {
  const defaultBg = isDark ? 'rgba(0,192,139,0.12)' : 'rgba(0,192,139,0.1)';
  const borderCol = isDark ? 'rgba(255,255,255,0.06)' : '#F0ECE4';
  const textPrimary = titleColor ?? (isDark ? '#FFFFFF' : '#000000');
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

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ProfileSidebar({ visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isClosingRef = useRef(false);

  const {
    address,
    isConnected,
    disconnect,
    connect,
    connectNearWallet,
    walletKind,
    externalKeyScope,
    email,
  } = useWallet();
  const { onChainName, localName } = useDisplayName(address);
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Android hardware / gesture back listener
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (keyModalVisible) {
        setKeyModalVisible(false);
        return true;
      }
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, keyModalVisible, onClose]);

  // Touch Swipe Back Responder (iOS edge swipe + direct horizontal drag on Android/iOS)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const { pageX, pageY } = evt.nativeEvent;

        // Must be swiping right
        if (dx <= 6) return false;

        // Left edge swipe (classic iOS swipe back)
        if (pageX <= 50 && Math.abs(dx) > Math.abs(dy)) {
          return true;
        }

        // Top bar header swipe
        if (pageY <= 110 && Math.abs(dx) > Math.abs(dy)) {
          return true;
        }

        // General horizontal right swipe
        return dx > 16 && Math.abs(dx) > Math.abs(dy) * 1.5;
      },

      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const { pageX, pageY } = evt.nativeEvent;

        if (dx <= 6) return false;

        // Left edge swipe (capture before ScrollView disallows intercept)
        if (pageX <= 50 && Math.abs(dx) > Math.abs(dy)) {
          return true;
        }

        // Top bar header swipe
        if (pageY <= 110 && Math.abs(dx) > Math.abs(dy)) {
          return true;
        }

        // General horizontal right swipe
        return dx > 16 && Math.abs(dx) > Math.abs(dy) * 1.5;
      },

      onPanResponderGrant: () => {
        slideAnim.stopAnimation();
      },

      onPanResponderMove: (evt, gestureState) => {
        const newX = Math.max(0, gestureState.dx);
        slideAnim.setValue(newX);
        const progress = Math.max(0, Math.min(1, 1 - newX / SCREEN_WIDTH));
        overlayAnim.setValue(0.5 * progress);
      },

      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        const shouldDismiss = dx > SCREEN_WIDTH * 0.22 || vx > 0.35;

        if (shouldDismiss) {
          const remaining = SCREEN_WIDTH - Math.max(0, dx);
          const velocity = Math.max(0.6, Math.abs(vx));
          const duration = Math.min(200, Math.max(90, remaining / velocity));

          isClosingRef.current = true;
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: SCREEN_WIDTH,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(overlayAnim, {
              toValue: 0,
              duration,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onCloseRef.current();
            setMounted(false);
            isClosingRef.current = false;
          });
        } else {
          // Snap back open
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 12,
            }),
            Animated.timing(overlayAnim, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },

      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }),
          Animated.timing(overlayAnim, {
            toValue: 0.5,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      },

      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  useEffect(() => {
    getNotificationsEnabled().then(setNotifEnabled).catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(SCREEN_WIDTH);
      overlayAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }),
        Animated.timing(overlayAnim, { toValue: 0.5, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      if (isClosingRef.current) return;
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const toggleNotifications = async (value: boolean) => {
    const enabled = await setNotificationsEnabled(value);
    setNotifEnabled(enabled);
    if (value && !enabled) {
      Alert.alert(
        'Turn On Notifications in Settings',
        'Allow Roda notifications in your device Settings so we can gently remind you before circle rounds and payouts.',
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
      Alert.alert(
        'Open Explorer in Browser',
        "We couldn't launch the block explorer from here — visit testnet.nearblocks.io directly in your browser.",
      );
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
            onClose();
            setTimeout(disconnect, 250);
          },
        },
      ],
    );
  };

  if (!mounted) return null;

  // Colors
  const bg = isDark ? '#111111' : '#FDFBF7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#8E8E93' : '#6B6B6B';
  const backBtnBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const backBtnBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';

  const displayName = onChainName ? `@${onChainName}` : localName ? `@${localName}` : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed backdrop (shown during slide transition) */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000000', opacity: overlayAnim },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Full-Page Panel */}
      <Animated.View
        style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]} edges={['top', 'bottom']}>
          {/* Top Bar Header */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={[
                styles.backBtn,
                { backgroundColor: backBtnBg, borderColor: backBtnBorder },
              ]}
              accessibilityLabel="Back"
            >
              <Icon name="arrow-back" size={18} color={textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.topBarTitle, { color: textPrimary }]}>Profile</Text>

            {/* Spacer to keep title centered */}
            <View style={styles.backBtnPlaceholder} />
          </View>

          {!isConnected ? (
            /* Signed Out View */
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
                onPress={() => {
                  onClose();
                  connect();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.signInButtonText}>Connect Wallet</Text>
              </TouchableOpacity>

              {/* Theme toggle available when signed out */}
              <View
                style={[
                  styles.card,
                  styles.signedOutThemeCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <SidebarRow
                  isDark={isDark}
                  icon="moon-outline"
                  title="Dark Mode"
                  isLast
                  right={
                    <Switch
                      value={isDark}
                      onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
                      trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#00C08B' }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />
              </View>
            </View>
          ) : (
            /* Signed In Full Page Content */
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ── User Profile Hero Card ── */}
              <View
                style={[
                  styles.profileHeroCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <View style={styles.profileHeroRow}>
                  {/* Avatar */}
                  <View style={styles.avatarCircle}>
                    <Icon name="person" size={24} color="#00C08B" />
                  </View>

                  {/* Profile Info */}
                  <View style={styles.profileInfoCol}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[styles.profileNameText, { color: textPrimary }]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {email || displayName || (walletKind === 'meteor' ? 'Meteor Wallet' : 'NEAR Account')}
                      </Text>
                      {!!onChainName && (
                        <View style={styles.verifiedBadge}>
                          <Icon name="checkmark-circle" size={15} color="#00C08B" />
                        </View>
                      )}
                    </View>

                    {displayName && email && (
                      <Text style={[styles.profileSubText, { color: textMuted }]}>
                        {displayName}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Address Pill */}
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

                {/* Claim Name Banner (shown only if local name exists and not on-chain) */}
                <ClaimNameButton />
              </View>

              <ReputationCard account={address} />

              {walletKind === 'meteor' && externalKeyScope === 'contract' && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    connectNearWallet('meteor', 'full').catch(() => {});
                  }}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB',
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
                    borderWidth: 1,
                    borderRadius: 20,
                    padding: 14,
                    marginBottom: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Icon name="warning-outline" size={20} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '700' }}>
                      Upgrade Meteor Key for Community DAOs
                    </Text>
                    <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                      Reconnect Meteor with multi-contract signing to create & vote in Sputnik DAOs.
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color="#F59E0B" />
                </TouchableOpacity>
              )}

              {/* ── Settings (Only What Is Needed) ── */}
              <Text style={[styles.sectionLabel, { color: textMuted }]}>SETTINGS</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {/* 1. Dark Mode */}
                <SidebarRow
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

                {/* 2. Notifications */}
                <SidebarRow
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

                {/* 3. Export Private Key (device/magic wallet) */}
                {(walletKind === 'device' || (walletKind === 'magic' && isMagicEnabled)) && (
                  <SidebarRow
                    isDark={isDark}
                    icon="key-outline"
                    title="Export Private Key"
                    subtitle="Backup your secret recovery key"
                    onPress={() => setKeyModalVisible(true)}
                  />
                )}

                {/* 4. View on Explorer */}
                <SidebarRow
                  isDark={isDark}
                  icon="open-outline"
                  title="View on Explorer"
                  subtitle="nearblocks.io testnet"
                  onPress={openExplorer}
                  isLast
                />
              </View>

              {/* ── Sign Out Button ── */}
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

              {/* Subtle Footer */}
              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: textMuted }]}>
                  Roda · NEAR Protocol Testnet
                </Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Animated.View>

      {/* Private Key Modal */}
      <PrivateKeyModal
        visible={keyModalVisible}
        address={address}
        onClose={() => setKeyModalVisible(false)}
      />
    </View>
  );
}

export function ProfileButton({ onPress }: { onPress: () => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.profileBtn,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC',
        },
      ]}
      accessibilityLabel="Open profile"
    >
      <Icon name="person" size={17} color="#00C08B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 16,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backBtnPlaceholder: {
    width: 38,
    height: 38,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },

  // Profile Hero Card
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
    fontSize: 16,
    fontWeight: '700',
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

  // Section Headers
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

  // Sign out button
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

  // Footer
  footerContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Signed out screen
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
  signedOutThemeCard: {
    width: '100%',
  },

  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
});
