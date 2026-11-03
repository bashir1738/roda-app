import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { TxStateView } from './TxStateView';
import { useClaim } from '../hooks/useClaim';
import { Icon } from './Icon';

type PayoutTarget =
  | { type: 'circle'; circleId: number; availableUSDC: bigint; label: string }
  | { type: 'vault';  vaultId: number;  availableUSDC: bigint; label: string };

interface PayoutSheetProps {
  target: PayoutTarget;
  visible: boolean;
  onClose: () => void;
}

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PayoutSheet({ target, visible, onClose }: PayoutSheetProps) {
  const { claim, txState, txHash, error, reset } = useClaim();

  const handleClaim = async () => {
    if (target.type === 'circle') {
      await claim({ type: 'circle', circleId: target.circleId });
    } else {
      await claim({ type: 'vault', vaultId: target.vaultId });
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-white dark:bg-[#121212]">
        {/* Drag handle */}
        <View className="w-9 h-1 rounded-full bg-border self-center mt-3 mb-2" />

        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-border dark:border-white/10 bg-white dark:bg-[#121212]">
          <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
            <Icon name="close" size={22} color="#6B6B6B" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-charcoal dark:text-white font-bold text-base">Claim Payout</Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-xs">{target.label}</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerClassName="p-4 gap-5">
          {txState !== 'idle' ? (
            <TxStateView
              txState={txState}
              txHash={txHash}
              error={error}
              successMessage="Payout claimed!"
              onReset={handleClose}
            />
          ) : (
            <>
              {/* Available USDC */}
              <View className="bg-primary/5 border border-primary/15 rounded-2xl p-5 items-center">
                <Text className="text-muted dark:text-[#A1A1AA] text-xs uppercase tracking-widest mb-1">Available</Text>
                <Text className="text-primary text-3xl font-black">${fmtUSDC(target.availableUSDC)}</Text>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs mt-1">USDC</Text>
              </View>

              <View className="flex-row items-center gap-2 justify-center">
                <Icon name="swap-horizontal-outline" size={15} color="#10B981" />
                <Text className="text-muted dark:text-[#A1A1AA] text-sm">
                  Transfers to your wallet — no swap needed
                </Text>
              </View>

              {/* Confirm button */}
              <TouchableOpacity
                className="bg-primary rounded-full py-4 items-center flex-row justify-center gap-2"
                onPress={handleClaim}
                accessibilityLabel="Confirm payout"
              >
                <Icon name="cash" size={20} color="white" />
                <Text className="text-white font-bold text-base">
                  Confirm Payout →
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
