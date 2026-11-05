import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { utils } from 'near-api-js';
import { useColorScheme } from 'nativewind';

import { TransactionItem, type TxType } from '../../components/TransactionItem';
import { useWallet } from '../../providers/WalletContext';
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { useBalance } from '../../hooks/useBalance';
import { useTokenPrices } from '../../hooks/useTokenPrices';
import { SendSheet } from '../../components/SendSheet';
import { NearMark } from '../../components/NearMark';
import { Icon, type IconName } from '../../components/Icon';

type Filter = 'All' | 'Payouts' | 'Contributions' | 'Vaults';
const FILTERS: Filter[] = ['All', 'Payouts', 'Contributions', 'Vaults'];
const FILTER_TYPES: Record<Filter, TxType[]> = {
  All: ['payout', 'contribution', 'deposit', 'interest', 'claim', 'circle_create', 'circle_join', 'faucet'],
  Payouts: ['payout', 'claim'],
  Contributions: ['contribution', 'circle_create', 'circle_join'],
  Vaults: ['deposit', 'interest'],
};

const FILTER_ICONS: Record<Filter, IconName> = {
  All: 'list-outline',
  Payouts: 'cash-outline',
  Contributions: 'arrow-up-circle-outline',
  Vaults: 'leaf-outline',
};

function fmtAddr(addr: string) {
  if (!addr) return '';
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatUsd(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCrypto(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ── Header & Assets ListHeaderComponent ─────────────────────────────────────

interface ListHeaderProps {
  address?: string;
  near: bigint;
  usdc: bigint;
  prices?: { near: number; usdc: number };
  balancesLoading: boolean;
  copied: boolean;
  onCopy: () => void;
  onSend: () => void;
  activeFilter: Filter;
  onSelectFilter: (f: Filter) => void;
}

function WalletHeader({
  address,
  near,
  usdc,
  prices,
  balancesLoading,
  copied,
  onCopy,
  onSend,
  activeFilter,
  onSelectFilter,
}: ListHeaderProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [balanceHidden, setBalanceHidden] = useState(false);

  // Calculations
  const nearPrice = prices?.near ?? 4.5;
  const usdcPrice = prices?.usdc ?? 1.0;

  // Format NEAR amount accurately using near-api-js formatNearAmount
  const nearFormattedStr = utils.format.formatNearAmount(near.toString(), 2) || '0.00';
  const nearNum = Number(near) / 1e24;
  const nearUsd = nearNum * nearPrice;

  const usdcNum = Number(usdc) / 1e6;
  const usdcFormattedStr = formatCrypto(usdcNum, 2);
  const usdcUsd = usdcNum * usdcPrice;

  const totalUsd = nearUsd + usdcUsd;

  // Colors
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#8E8E93' : '#6B6B6B';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : '#F0ECE4';

  return (
    <View style={styles.headerContainer}>
      {/* ── Total Portfolio Value Hero Card ── */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelRow}>
            <Text style={[styles.heroLabel, { color: textMuted }]}>TOTAL PORTFOLIO</Text>
            <TouchableOpacity
              onPress={() => setBalanceHidden((h) => !h)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={balanceHidden ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Testnet pill */}
          <View
            style={[
              styles.networkBadge,
              { backgroundColor: isDark ? 'rgba(0,192,139,0.12)' : 'rgba(0,192,139,0.1)' },
            ]}
          >
            <View style={styles.networkDot} />
            <Text style={styles.networkText}>NEAR Testnet</Text>
          </View>
        </View>

        {/* Large Display Value */}
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceText, { color: textPrimary }]}>
            {balanceHidden ? '••••••••' : formatUsd(totalUsd)}
          </Text>
          {balancesLoading && (
            <ActivityIndicator size="small" color="#00C08B" style={styles.balanceLoader} />
          )}
        </View>

        {/* Account Address Pill */}
        {address && (
          <TouchableOpacity
            onPress={onCopy}
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
              size={14}
              color={copied ? '#00C08B' : textMuted}
            />
            <Text style={[styles.addressText, { color: copied ? '#00C08B' : textPrimary }]}>
              {copied ? 'Address Copied!' : fmtAddr(address)}
            </Text>
            <Icon
              name={copied ? 'checkmark' : 'copy-outline'}
              size={13}
              color={copied ? '#00C08B' : textMuted}
            />
          </TouchableOpacity>
        )}

        {/* Quick Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={onSend}
            activeOpacity={0.85}
            style={[styles.actionButton, styles.sendButton]}
          >
            <Icon name="arrow-up-outline" size={17} color="#000000" />
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCopy}
            activeOpacity={0.85}
            style={[
              styles.actionButton,
              styles.receiveButton,
              {
                backgroundColor: isDark ? '#262629' : '#F3F4F6',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
              },
            ]}
          >
            <Icon name={copied ? 'checkmark' : 'arrow-down-outline'} size={17} color="#00C08B" />
            <Text
              style={[
                styles.receiveButtonText,
                { color: copied ? '#00C08B' : textPrimary },
              ]}
            >
              {copied ? 'Copied' : 'Receive'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Assets Section ── */}
      <View
        style={[
          styles.assetsCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
        ]}
      >
        <View style={styles.assetsHeader}>
          <View style={styles.assetsHeaderLeft}>
            <Icon name="layers-outline" size={14} color={textMuted} />
            <Text style={[styles.assetsTitle, { color: textMuted }]}>ASSETS</Text>
          </View>
          <View
            style={[
              styles.assetCountBadge,
              { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' },
            ]}
          >
            <Text style={[styles.assetCountText, { color: textMuted }]}>2 Tokens</Text>
          </View>
        </View>

        {/* 1. NEAR Row */}
        <View style={styles.tokenRow}>
          <View style={[styles.tokenIconCircle, { backgroundColor: '#00C08B' }]}>
            <NearMark size={22} color="#000000" />
          </View>
          <View style={styles.tokenInfo}>
            <Text style={[styles.tokenName, { color: textPrimary }]}>NEAR</Text>
            <Text style={[styles.tokenSub, { color: textMuted }]}>
              NEAR Protocol · {formatUsd(nearPrice)}
            </Text>
          </View>
          <View style={styles.tokenBalanceCol}>
            <Text style={[styles.tokenBalanceText, { color: textPrimary }]}>
              {balanceHidden ? '••••' : `${nearFormattedStr} NEAR`}
            </Text>
            <Text style={[styles.tokenValuationText, { color: textMuted }]}>
              {balanceHidden ? '••••' : `~${formatUsd(nearUsd)}`}
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {/* 2. USDC Row */}
        <View style={styles.tokenRow}>
          <View style={[styles.tokenIconCircle, { backgroundColor: '#2775CA' }]}>
            <Text style={styles.usdcSymbolText}>$</Text>
          </View>
          <View style={styles.tokenInfo}>
            <Text style={[styles.tokenName, { color: textPrimary }]}>USD Coin</Text>
            <Text style={[styles.tokenSub, { color: textMuted }]}>
              USDC · {formatUsd(usdcPrice)}
            </Text>
          </View>
          <View style={styles.tokenBalanceCol}>
            <Text style={[styles.tokenBalanceText, { color: textPrimary }]}>
              {balanceHidden ? '••••' : `${usdcFormattedStr} USDC`}
            </Text>
            <Text style={[styles.tokenValuationText, { color: textMuted }]}>
              {balanceHidden ? '••••' : `~${formatUsd(usdcUsd)}`}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Recent Activity Section Header ── */}
      <View style={styles.activityHeader}>
        <Text style={[styles.activityTitle, { color: textPrimary }]}>Recent Activity</Text>
      </View>

      {/* Filter Chips in a single straight scrollable line */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTERS.map((f) => {
          const isSelected = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => onSelectFilter(f)}
              activeOpacity={0.75}
              style={[
                styles.filterChip,
                isSelected
                  ? styles.filterChipActive
                  : [
                      styles.filterChipInactive,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6',
                        borderColor: cardBorder,
                      },
                    ],
              ]}
            >
              <Icon
                name={FILTER_ICONS[f]}
                size={12}
                color={isSelected ? '#000000' : textMuted}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: isSelected ? '#000000' : textMuted },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Main WalletTab Component ────────────────────────────────────────────────

export default function WalletTab() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isConnected, address, walletKind, connect } = useWallet();
  const { openSidebar } = useProfileSidebar();

  const [active, setActive] = useState<Filter>('All');
  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { txs, refresh: refreshTxs } = useTransactionHistory(address);
  const { near, usdc, isLoading: balancesLoading, refetch: refetchBalances } = useBalance();
  const { data: prices } = useTokenPrices();

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshTxs(), refetchBalances()]);
    setRefreshing(false);
  };

  const filteredTxs = useMemo(
    () => txs.filter((tx) => FILTER_TYPES[active].includes(tx.type)),
    [txs, active],
  );

  const handleCopy = () => {
    if (!address) return;
    Share.share({ message: address }).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#A1A1AA' : '#6B6B6B';
  const screenBg = isDark ? '#111111' : '#FDFBF7';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: screenBg }]} edges={['top']}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { backgroundColor: screenBg }]}>
        <View>
          <Text style={[styles.screenTitle, { color: textPrimary }]}>Wallet</Text>
          <Text style={[styles.screenSubtitle, { color: textMuted }]}>
            {isConnected
              ? walletKind === 'meteor'
                ? 'Meteor Wallet'
                : 'Smart Account'
              : 'Connect to get started'}
          </Text>
        </View>
        <ProfileButton onPress={openSidebar} />
      </View>

      {/* ── Body ── */}
      {!isConnected ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="wallet-outline" size={32} color="#00C08B" />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>Connect your wallet</Text>
          <Text style={[styles.emptySubtitle, { color: textMuted }]}>
            Sign in to view your NEAR balances, send & receive assets, and track savings activity.
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={connect}
            activeOpacity={0.85}
          >
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTxs}
          keyExtractor={(tx) => tx.id}
          renderItem={({ item }) => <TransactionItem tx={item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#00C08B"
              colors={['#00C08B']}
            />
          }
          ListHeaderComponent={
            <WalletHeader
              address={address}
              near={near}
              usdc={usdc}
              prices={prices}
              balancesLoading={balancesLoading}
              copied={copied}
              onCopy={handleCopy}
              onSend={() => setShowSend(true)}
              activeFilter={active}
              onSelectFilter={setActive}
            />
          }
          contentContainerStyle={
            filteredTxs.length === 0 ? styles.listEmptyContainer : styles.listContentContainer
          }
          ListEmptyComponent={
            <View style={styles.emptyActivityContainer}>
              <View
                style={[
                  styles.emptyActivityIcon,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' },
                ]}
              >
                <Icon name="receipt-outline" size={24} color={textMuted} />
              </View>
              <Text style={[styles.emptyActivityTitle, { color: textPrimary }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptyActivitySubtitle, { color: textMuted }]}>
                Contributions, payouts, and transfers will show up here.
              </Text>
            </View>
          }
        />
      )}

      {/* Send modal sheet */}
      <SendSheet visible={showSend} onClose={() => setShowSend(false)} />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },

  // Hero Card
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C08B',
  },
  networkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C08B',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  balanceText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceLoader: {
    marginLeft: 4,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: 18,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 100,
  },
  sendButton: {
    backgroundColor: '#00C08B',
    shadowColor: '#00C08B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  receiveButton: {
    borderWidth: 1,
  },
  receiveButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Assets Card
  assetsCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  assetsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  assetCountBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  assetCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tokenIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  usdcSymbolText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tokenSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  tokenBalanceCol: {
    alignItems: 'flex-end',
  },
  tokenBalanceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tokenValuationText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },

  // Activity Section
  activityHeader: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterScrollView: {
    marginHorizontal: -16,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  filterChipActive: {
    backgroundColor: '#00C08B',
  },
  filterChipInactive: {
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // List layout
  listContentContainer: {
    paddingBottom: 28,
  },
  listEmptyContainer: {
    flex: 1,
    paddingBottom: 28,
  },
  emptyActivityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyActivityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyActivityTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyActivitySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },

  // Connect empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,192,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#00C08B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 100,
    shadowColor: '#00C08B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  connectButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
