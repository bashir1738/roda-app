import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { TxState } from '../providers/WalletContext';
import { Icon } from './Icon';

interface Props {
  txState: TxState;
  txHash?: string | null;
  error?: string | null;
  successMessage?: string;
  onReset: () => void;
}

export function TxStateView({ txState, txHash, error, successMessage, onReset }: Props) {
  if (txState === 'idle') return null;

  return (
    <View className="items-center py-6 gap-3 px-4">
      {txState === 'signing' && (
        <>
          <Icon name="sync-outline" size={38} color="#421F6D" spin />
          <Text className="text-charcoal dark:text-white font-semibold text-base text-center">
            Waiting for wallet signature…
          </Text>
          <Text className="text-muted dark:text-[#A1A1AA] text-sm">Approve in your wallet</Text>
        </>
      )}

      {txState === 'confirming' && (
        <>
          <Icon name="sync-outline" size={38} color="#421F6D" spin />
          <Text className="text-charcoal dark:text-white font-semibold text-base text-center">
            Confirming on-chain…
          </Text>
          <Text className="text-muted dark:text-[#A1A1AA] text-sm">This takes ~15 seconds</Text>
        </>
      )}

      {txState === 'success' && (
        <>
          <View className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/25 border-2 border-green-200 dark:border-green-700 items-center justify-center">
            <Icon name="checkmark-circle" size={40} color="#4ADE80" pop />
          </View>
          <Text className="text-primary dark:text-[#E8B4FF] font-black text-lg text-center">
            {successMessage ?? 'Transaction confirmed!'}
          </Text>
          {txHash && (
            <View className="flex-row items-center gap-1.5 bg-white dark:bg-white/10 rounded-xl px-3 py-2">
              <Icon name="link-outline" size={13} color="#C4B5FD" />
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-mono">
                {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </Text>
            </View>
          )}
          <TouchableOpacity
            className="mt-1 bg-primary rounded-full px-8 py-3"
            onPress={onReset}
            accessibilityLabel="Close"
          >
            <Text className="text-white font-bold">Done</Text>
          </TouchableOpacity>
        </>
      )}

      {txState === 'error' && (
        <>
          <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/25 border-2 border-red-200 dark:border-red-700 items-center justify-center">
            <Icon name="close-circle" size={40} color="#C1440E" pop />
          </View>
          <Text className="text-alert font-semibold text-center px-4">
            {error ?? 'Transaction failed'}
          </Text>
          <TouchableOpacity
            className="bg-alert rounded-full px-8 py-3"
            onPress={onReset}
            accessibilityLabel="Try again"
          >
            <Text className="text-white font-bold">Try again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
