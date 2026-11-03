import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionItem, type TxType } from '../../components/TransactionItem';
import { useWallet } from '../../providers/WalletContext';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
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

export default function HistoryTab() {
  const { isConnected, address } = useWallet();
  const { openSidebar } = useProfileSidebar();
  const [active, setActive] = useState<Filter>('All');
  const { txs } = useTransactionHistory(address);

  const filtered = useMemo(
    () => txs.filter((tx) => FILTER_TYPES[active].includes(tx.type)),
    [txs, active],
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={['top']}>
      {/* Header */}
      <View className="bg-white dark:bg-[#121212] px-5 pt-3 pb-6">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-charcoal dark:text-white text-[28px] font-extrabold tracking-tight mt-2">History</Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-sm mt-1">
              {isConnected ? `${filtered.length} transactions` : 'Your on-chain activity'}
            </Text>
          </View>
          <ProfileButton onPress={openSidebar} />
        </View>
      </View>

      <View className="flex-1 bg-white dark:bg-[#121212] rounded-t-3xl overflow-hidden">
      {/* Filter chips */}
      <View className="flex-row gap-2 px-4 py-3 pt-4">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
              active === f ? 'bg-primary border-primary' : 'bg-white border-border'
            }`}
            onPress={() => setActive(f)}
            accessibilityLabel={`Filter: ${f}`}
          >
            <Icon name={FILTER_ICONS[f]} size={13} color={active === f ? '#EDD2F8' : '#6B6B6B'} />
            <Text className={`text-xs font-semibold ${active === f ? 'text-surface' : 'text-muted'}`}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isConnected ? (
        <EmptyState
          icon="wallet-outline"
          title="Connect your wallet"
          subtitle="Your transaction history will appear here once connected."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(tx) => tx.id}
          renderItem={({ item }) => <TransactionItem tx={item} />}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
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
    </SafeAreaView>
  );
}

function EmptyState({
  icon, title, subtitle,
}: { icon: IconName; title: string; subtitle: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-10">
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
        <Icon name={icon} size={30} color="#421F6D" />
      </View>
      <Text className="text-charcoal dark:text-white font-bold text-base">{title}</Text>
      <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center">{subtitle}</Text>
    </View>
  );
}
