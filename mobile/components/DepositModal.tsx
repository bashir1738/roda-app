import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { VAULT_TIERS, type VaultTier } from '../hooks/useVaults';
import { useDeposit } from '../hooks/useDeposit';
import { TxStateView } from './TxStateView';
import { USDC_FACTOR } from '../constants/roda';
import { Icon } from './Icon';

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toFixed(2);
}

export function DepositModal({ tier, visible, onClose }: {
  tier: VaultTier; visible: boolean; onClose: () => void;
}) {
  const t = VAULT_TIERS[tier];
  const { deposit, txState, txHash, error, reset, isPending } = useDeposit();
  const [rawAmt, setRawAmt] = useState('');

  const amountIn = rawAmt ? BigInt(Math.floor(parseFloat(rawAmt) * USDC_FACTOR)) : 0n;
  const principal = Number(rawAmt && !isNaN(parseFloat(rawAmt)) ? parseFloat(rawAmt) : 0);
  const meetsMin = principal >= t.minUSDC && amountIn > 0n;
  const quickFills = t.minUSDC > 0
    ? [t.minUSDC, t.minUSDC * 2, t.minUSDC * 5]
    : [10, 25, 50];

  const handleClose = () => { reset(); setRawAmt(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-[#FDFBF7] dark:bg-[#121212]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-5 pb-3 border-b border-border/50 dark:border-white/5 bg-white dark:bg-[#121212]">
          <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
            <Text className="text-muted dark:text-[#A1A1AA] text-base">Cancel</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Icon name={t.icon as any} size={20} color="#421F6D" />
            <Text className="text-charcoal dark:text-white font-bold text-xl">{tier} Vault</Text>
          </View>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerClassName="p-4 gap-4">
          {txState !== 'idle' ? (
            <TxStateView txState={txState} txHash={txHash} error={error}
              successMessage={`${tier} vault funded — your USDC is saved onchain.`}
              onReset={handleClose} />
          ) : (
            <>
              {/* Amount input */}
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
                  You deposit
                </Text>
                <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl px-4 py-4">
                  <TextInput
                    className="text-charcoal dark:text-white font-extrabold text-3xl "
                    placeholder={t.minUSDC > 0 ? `Min ${t.minUSDC} USDC` : 'Amount in USDC'}
                    placeholderTextColor="#6B6B6B"
                    value={rawAmt}
                    onChangeText={setRawAmt}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Quick fill */}
              <View className="flex-row gap-2">
                {quickFills.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    className="flex-1 bg-white dark:bg-[#121212] border border-border dark:border-white/10 rounded-2xl py-2.5 items-center"
                    onPress={() => setRawAmt(String(m))}
                  >
                    <Text className="text-charcoal dark:text-white font-semibold text-sm">
                      {t.minUSDC > 0 && i === 0 ? 'Min' : `$${m}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Lock warning */}
              {t.lockDays > 0 && (
                <View className="flex-row gap-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/60 rounded-2xl p-3">
                  <Text className="flex-1 text-charcoal dark:text-amber-50 text-sm">
                    Funds locked for <Text className="font-bold">{t.lockDays} days</Text>.
                    Withdrawals not possible before maturity.
                  </Text>
                </View>
              )}

              {/* Tier info */}
              <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl p-4 gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted dark:text-[#A1A1AA] text-sm">Minimum</Text>
                  <Text className="text-charcoal dark:text-white font-semibold text-sm">
                    {t.minUSDC > 0 ? `$${t.minUSDC} USDC` : 'No minimum'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted dark:text-[#A1A1AA] text-sm">Lock period</Text>
                  <Text className="text-charcoal dark:text-white font-semibold text-sm">
                    {t.lockDays > 0 ? `${t.lockDays} days` : 'None — withdraw anytime'}
                  </Text>
                </View>
                {amountIn > 0n && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted dark:text-[#A1A1AA] text-sm">You save</Text>
                    <Text className="text-charcoal dark:text-white font-bold text-sm">
                      ${fmtUSDC(amountIn)} USDC
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${
                  meetsMin ? 'bg-primary' : 'bg-primary/30'
                }`}
                onPress={() => deposit({ tier: t.tier, amountIn })}
                disabled={!meetsMin || isPending}
                accessibilityLabel="Sign and send deposit"
              >
                <Icon name="wallet" size={18} color={meetsMin ? 'white' : 'rgba(255,255,255,0.5)'} />
                <Text className={`font-bold text-base ${meetsMin ? 'text-white' : 'text-white/50'}`}>
                  {!meetsMin
                    ? t.minUSDC > 0
                      ? `Min ${t.minUSDC} USDC`
                      : 'Enter an amount'
                    : 'Sign & Send →'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
