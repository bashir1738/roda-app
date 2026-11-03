import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Icon, IconName } from './Icon';

export type TxType = 'payout' | 'contribution' | 'deposit' | 'interest' | 'claim' | 'circle_create' | 'circle_join' | 'faucet';

export interface Transaction {
  id: string;
  type: TxType;
  label: string;
  subLabel?: string;
  date: Date;
  amountUSDC: bigint;
  txHash?: string;
}

type IoniconsName = IconName;

const TYPE_META: Record<TxType, { icon: IoniconsName; incoming: boolean; isGreen: boolean }> = {
  payout:        { icon: 'cash-outline',           incoming: true,  isGreen: true  },
  contribution:  { icon: 'card-outline',           incoming: false, isGreen: false },
  deposit:       { icon: 'wallet-outline',          incoming: false, isGreen: false },
  interest:      { icon: 'trending-up-outline',     incoming: true,  isGreen: true  },
  claim:         { icon: 'gift-outline',            incoming: true,  isGreen: true  },
  circle_create: { icon: 'people-circle-outline',   incoming: false, isGreen: false },
  circle_join:   { icon: 'enter-outline',           incoming: false, isGreen: false },
  faucet:        { icon: 'water-outline',            incoming: true,  isGreen: true  },
};

function fmtUSDC(v: bigint) {
  return (Number(v < 0n ? -v : v) / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TransactionItem({ tx }: { tx: Transaction }) {
  const meta = TYPE_META[tx.type];
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Icon badge background — green for income, neutral for outgoing (dark-aware)
  const iconBg = meta.isGreen
    ? 'rgba(74, 222, 128, 0.15)'
    : (isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6');
  const iconColor = meta.isGreen
    ? '#22c55e'
    : (isDark ? '#AEAEB2' : '#16141a');

  return (
    <View
      className="flex-row items-center px-5 py-3"
      accessibilityLabel={`${tx.label} ${fmtUSDC(tx.amountUSDC)} USDC`}
    >
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
        style={{ backgroundColor: iconBg }}
      >
        <Icon name={meta.icon} size={20} color={iconColor} />
      </View>

      <View className="flex-1">
        <Text className="text-charcoal dark:text-white font-bold text-base" numberOfLines={1}>
          {tx.label}
        </Text>
        <Text className="text-muted dark:text-[#A1A1AA] text-xs mt-0.5">
          {tx.subLabel ? `${tx.subLabel} · ` : ''}{fmtDate(tx.date)}
        </Text>
      </View>

      <View className="items-end gap-0.5">
        {tx.amountUSDC > 0n ? (
          <Text className={`font-extrabold text-base ${meta.incoming ? 'text-[#22c55e]' : 'text-charcoal dark:text-white'}`}>
            {meta.incoming ? '+' : '-'}${fmtUSDC(tx.amountUSDC)}
          </Text>
        ) : (
          <Text className="text-muted dark:text-[#A1A1AA] text-xs font-medium">on-chain</Text>
        )}
        {tx.txHash && (
          <View className="flex-row items-center gap-1">
            <Icon name="link-outline" size={12} color={isDark ? '#8E8E93' : '#6B6B6B'} />
          </View>
        )}
      </View>
    </View>
  );
}
