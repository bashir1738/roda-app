import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Share, RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionItem, type TxType } from '../../components/TransactionItem';
import { useWallet } from '../../providers/WalletContext';
function fmtAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { useBalance } from '../../hooks/useBalance';
import { useTokenPrices } from '../../hooks/useTokenPrices';
import { SendSheet } from '../../components/SendSheet';
import { NearMark } from '../../components/NearMark';
import { useColorScheme } from 'nativewind';
import { Icon, IconName } from '../../components/Icon';

type Filter = 'All' | 'Payouts' | 'Contributions' | 'Vaults';
const FILTERS: Filter[] = ['All', 'Payouts', 'Contributions', 'Vaults'];
const FILTER_TYPES: Record<Filter, TxType[]> = {
  All:           ['payout', 'contribution', 'deposit', 'interest', 'claim', 'circle_create', 'circle_join', 'faucet'],
  Payouts:       ['payout', 'claim'],
  Contributions: ['contribution', 'circle_create', 'circle_join'],
  Vaults:        ['deposit', 'interest'],
};
const FILTER_ICONS: Record<Filter, IconName> = {
  All:           'list-outline',
  Payouts:       'cash-outline',
  Contributions: 'arrow-up-circle-outline',
  Vaults:        'leaf-outline',
};

// ── Token definitions ────────────────────────────────────────────────────────

interface TokenDef {
  symbol: string;
  name: string;
  bg: string;
  fg: string;
  label: string;
}

const TOKENS: TokenDef[] = [
  { symbol: 'NEAR', name: 'NEAR',     bg: '#00C08B', fg: '#fff', label: 'N' },
  { symbol: 'USDC', name: 'USD Coin', bg: '#2775CA', fg: '#fff', label: '$' },
];

function AssetIcon({ token, size }: { token: TokenDef; size: number }) {
  const innerSize = Math.round(size * 0.58);
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: token.bg,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {token.symbol === 'NEAR' ? (
        <NearMark size={innerSize} color="#FFFFFF" />
      ) : (
        <Text style={{ color: token.fg, fontSize: Math.round(size * 0.38), fontWeight: '900' }}>{token.label}</Text>
      )}
    </View>
  );
}

function formatAmount(raw: bigint, decimals: number) {
  const n = Number(raw) / 10 ** decimals;
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals === 9 ? 5 : 2,
  });
}

function formatUsd(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── TokenRow ─────────────────────────────────────────────────────────────────

function TokenRow({
  token, amount, isLoading, isLast, priceUsd,
}: { token: TokenDef; amount: bigint; isLoading: boolean; isLast: boolean; priceUsd?: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const decimals = token.symbol === 'NEAR' ? 24 : 6;
  const formatted = isLoading ? '0.00' : formatAmount(amount, decimals);

  const textPrimary = isDark ? '#FFFFFF' : '#303030';
  const textMuted   = isDark ? '#8E8E93' : '#6B6B6B';
  const border      = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 18,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: border,
      }}
    >
      {/* Token icon */}
      <AssetIcon token={token} size={48} />

      {/* Name + symbol */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '600' }}>{token.name}</Text>
        <Text style={{ color: textMuted, fontSize: 12, marginTop: 1 }}>
          {token.symbol}
          {priceUsd !== undefined ? ` · ${formatUsd(priceUsd)}` : ''}
          {' · Testnet'}
        </Text>
      </View>

      {/* Balance */}
      <View style={{ alignItems: 'flex-end' }}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#421F6D" />
        ) : (
          <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '700' }}>{formatted}</Text>
        )}
        <Text style={{ color: textMuted, fontSize: 11, marginTop: 1 }}>
          {priceUsd !== undefined
            ? formatUsd((Number(amount) / 10 ** decimals) * priceUsd)
            : token.symbol}
        </Text>
      </View>
    </View>
  );
}

// ── Assets section (ListHeader) ───────────────────────────────────────────────

function AssetsHeader({
  near, usdc, balancesLoading, active, setActive,
}: {
  near: bigint;
  usdc: bigint;
  balancesLoading: boolean;
  active: Filter;
  setActive: (f: Filter) => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#FFFFFF' : '#16141a';
  const textMuted   = isDark ? '#8E8E93' : '#6B6B6B';
  const cardBg      = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const chipActiveBg   = isDark ? '#C084FC' : '#16141a';
  const chipInactiveBg = isDark ? '#2C2C2E' : '#F3F4F6';
  const chipActiveBorder   = isDark ? '#C084FC' : '#16141a';
  const chipInactiveBorder = isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';

  const { data: prices } = useTokenPrices();

  return (
    <>
      {/* Token list */}
      <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 4, backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden', shadowColor: '#421F6D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
          <Icon name="layers-outline" size={13} color={textMuted} />
          <Text style={{ color: textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
            Assets
          </Text>
        </View>
        {TOKENS.map((t, i) => (
          <TokenRow
            key={t.symbol}
            token={t}
            amount={t.symbol === 'NEAR' ? near : usdc}
            isLoading={balancesLoading}
            isLast={i === TOKENS.length - 1}
            priceUsd={prices?.usdc}
          />
        ))}
      </View>

      {/* Activity section header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 16, fontWeight: 'bold' }}>Recent Activity</Text>
      </View>

      {/* Filter chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100,
              borderWidth: 1,
              backgroundColor: active === f ? chipActiveBg : chipInactiveBg,
              borderColor: active === f ? chipActiveBorder : chipInactiveBorder,
            }}
            onPress={() => setActive(f)}
          >
            <Icon name={FILTER_ICONS[f]} size={12} color={active === f ? '#FFFFFF' : textMuted} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: active === f ? '#FFFFFF' : textMuted }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function WalletTab() {
  const { isConnected, address, walletKind, connect } = useWallet();
  const { openSidebar } = useProfileSidebar();
  const [active, setActive] = useState<Filter>('All');
  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);

  const { txs, refresh: refreshTxs } = useTransactionHistory(address);
  const { near, usdc, isLoading: balancesLoading, refetch: refetchBalances } = useBalance();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshTxs(), refetchBalances()]);
    setRefreshing(false);
  };

  const filtered = useMemo(
    () => txs.filter((tx) => FILTER_TYPES[active].includes(tx.type)),
    [txs, active],
  );

  const copyAddress = () => {
    if (!address) return;
    Share.share({ message: address }).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={['top']}>
      {/* Header */}
      <View className="bg-white dark:bg-[#121212] px-5 pt-3 pb-6">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-charcoal dark:text-white text-3xl font-bold tracking-tight mt-2">Wallet</Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-sm mt-1">
              {isConnected
                ? walletKind === 'mwa'
                  ? 'Meteor wallet assets and activity'
                  : 'Your on-chain activity'
                : 'Connect to get started'}
            </Text>
          </View>
          <ProfileButton onPress={openSidebar} />
        </View>

        {isConnected && address && (
          <>
            <TouchableOpacity
              onPress={copyAddress}
              className="flex-row items-center gap-4 mt-4 bg-white dark:bg-[#1C1C1E] border border-border/50 dark:border-white/5 rounded-full px-4 py-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}
              accessibilityLabel="Copy wallet address"
            >
              <View className="w-10 h-10 rounded-full bg-border/50 dark:bg-white items-center justify-center">
                <Icon name="wallet-outline" size={16} color="#16141a" />
              </View>
              <Text className="flex-1 text-charcoal dark:text-white font-bold text-sm font-mono" numberOfLines={1}>
                {fmtAddr(address)}
              </Text>
              <Icon
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color={copied ? '#4ADE80' : '#6B6B6B'}
              />
            </TouchableOpacity>

            {/* Quick actions */}
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                onPress={() => setShowSend(true)}
                className="flex-1 flex-row items-center justify-center gap-2 bg-primary rounded-full py-4 shadow-sm"
              >
                <Icon name="arrow-up-outline" size={16} color="#421F6D" />
                <Text className="text-white font-bold text-sm">Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={copyAddress}
                className="flex-1 flex-row items-center justify-center gap-2 bg-primary rounded-full py-4 shadow-sm"
              >
                <Icon name={copied ? 'checkmark' : 'arrow-down-outline'} size={16} color={copied ? '#4ADE80' : '#421F6D'} />
                <Text className={copied ? 'text-green-400 font-bold text-sm' : 'text-white font-bold text-sm'}>
                  {copied ? 'Copied!' : 'Receive'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View className="flex-1 bg-white dark:bg-[#121212] overflow-hidden">
        {!isConnected ? (
          <EmptyState
            icon="wallet-outline"
            title="Connect your wallet"
            subtitle="Sign in to see your balances and transaction history."
            action={{ label: 'Sign in', onPress: connect }}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(tx) => tx.id}
            renderItem={({ item }) => <TransactionItem tx={item} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#421F6D" colors={['#421F6D']} />
            }
            ListHeaderComponent={
              <AssetsHeader
                near={near}
                usdc={usdc}
                balancesLoading={balancesLoading}
                active={active}
                setActive={setActive}
              />
            }
            contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
            ListEmptyComponent={
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                subtitle="Contributions, payouts and vault activity will show up here."
              />
            }
          />
        )}
      </View>

      <SendSheet visible={showSend} onClose={() => setShowSend(false)} />
    </SafeAreaView>
  );
}

function EmptyState({
  icon, title, subtitle, action,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-10 py-10">
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
        <Icon name={icon} size={30} color="#421F6D" />
      </View>
      <Text className="text-charcoal dark:text-white font-bold text-xl">{title}</Text>
      <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center">{subtitle}</Text>
      {action && (
        <TouchableOpacity className="bg-primary rounded-full px-6 py-3 mt-1" onPress={action.onPress}>
          <Text className="text-white font-bold">{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
