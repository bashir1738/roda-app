import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { TxStateView } from './TxStateView';
import type { TxState } from '../providers/WalletContext';
import { Icon } from './Icon';

const FREQUENCIES = [
  { label: '10 minutes', value: 10 * 60    },
  { label: 'Weekly',     value: 7 * 86400  },
  { label: 'Bi-weekly', value: 14 * 86400 },
  { label: 'Monthly',   value: 30 * 86400 },
];
const MIN_MEMBERS = 2;
const MAX_MEMBERS = 12;

interface Props {
  visible: boolean;
  onClose: () => void;
  txState?: TxState;
  txHash?: string | null;
  txError?: string | null;
  /** 6-digit code assigned to the new circle (available once txState is success). */
  circleCode?: number | null;
  onCreate: (p: {
    name: string;
    maxMembers: number;
    contributionUSDC: number;
    frequencySeconds: number;
  }) => Promise<void>;
}

export function CreateCircleWizard({ visible, onClose, txState, txHash, txError, circleCode, onCreate }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [freqIdx, setFreqIdx] = useState(0);
  const [members, setMembers] = useState(MIN_MEMBERS);
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setStep(0); setName(''); setAmount('');
    setFreqIdx(0); setMembers(MIN_MEMBERS); setCreating(false);
  };
  const close = () => { reset(); onClose(); };

  const canNext = [name.trim().length > 0, parseFloat(amount) > 0, true][step];

  const create = async () => {
    setCreating(true);
    try {
      await onCreate({
        name: name.trim(),
        maxMembers: members,
        contributionUSDC: parseFloat(amount),
        frequencySeconds: FREQUENCIES[freqIdx].value,
      });
    } catch {
      setCreating(false);
    }
  };

  const freq = FREQUENCIES[freqIdx];
  const pot = parseFloat(amount || '0') * members;
  const isTxActive = txState && txState !== 'idle';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View className="flex-1 bg-[#FDFBF7] dark:bg-[#121212]">

        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-5 pb-3 border-b border-border/50 dark:border-white/5 bg-white dark:bg-[#121212]">
          <TouchableOpacity onPress={close}>
            <Text className="text-muted dark:text-[#A1A1AA]">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-charcoal dark:text-white font-bold">Create Circle</Text>
          <View style={{ width: 55 }} />
        </View>

        {isTxActive ? (
          /* Transaction state overlay */
          <ScrollView contentContainerClassName="flex-1 px-4 py-8">
            <TxStateView
              txState={txState}
              txHash={txHash}
              error={txError}
              successMessage="Circle created — share your code so others can join."
              onReset={close}
            />
            {txState === 'success' && circleCode != null && (
              <View className="items-center gap-1 mt-1">
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">
                  Circle code
                </Text>
                <View className="bg-primary/10 dark:bg-[#2A1B3D] border border-primary/20 dark:border-[#7C3AED] rounded-2xl px-6 py-3">
                  <Text className="text-primary dark:text-[#E8B4FF] font-black text-4xl tracking-[0.2em]">
                    {circleCode}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <>
            {/* Step indicator */}
            <View className="flex-row gap-1.5 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`}
                />
              ))}
            </View>
            <Text className="text-muted dark:text-[#A1A1AA] text-xs px-4 mb-3">Step {step + 1} of 3</Text>

            <ScrollView contentContainerClassName="px-4 pb-8">

              {/* Step 1 — Name */}
              {step === 0 && (
                <View className="gap-5">
                  <Text className="text-charcoal dark:text-white text-xl font-bold">Name your circle</Text>
                  <TextInput
                    className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl px-4 py-4 text-charcoal dark:text-white text-base"
                    placeholder="e.g. Lagos Tech Builders"
                    placeholderTextColor="#6B6B6B"
                    value={name}
                    onChangeText={setName}
                    maxLength={40}
                    autoFocus
                  />
                  <View className="bg-primary/5 border border-primary/15 rounded-2xl p-3 flex-row gap-2">
                    <Icon name="information-circle-outline" size={16} color="#421F6D" />
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs flex-1 leading-5">
                      Choose a name your group will recognise — you can't change it after creation.
                    </Text>
                  </View>
                </View>
              )}

              {/* Step 2 — Amount & frequency */}
              {step === 1 && (
                <View className="gap-5">
                  <Text className="text-charcoal dark:text-white text-xl font-bold">Contribution & schedule</Text>

                  <View>
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
                      Amount per round (USDC)
                    </Text>
                    <TextInput
                      className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl px-4 py-4 text-charcoal dark:text-white font-extrabold text-3xl"
                      placeholder="100"
                      placeholderTextColor="#71717A"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                    />
                  </View>

                  <View>
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
                      Frequency
                    </Text>
                    {FREQUENCIES.map((f, i) => (
                      <TouchableOpacity
                        key={f.value}
                        className={`flex-row items-center gap-3 px-4 py-3.5 rounded-2xl border mb-2 ${
                          freqIdx === i
                            ? 'border-primary dark:border-[#C084FC] bg-primary/5 dark:bg-[#2A1B3D]'
                            : 'border-border bg-white dark:bg-[#1C1C1E] dark:border-white/10'
                        }`}
                        onPress={() => setFreqIdx(i)}
                      >
                        <Icon
                          name="calendar-outline"
                          size={18}
                          color={freqIdx === i ? '#C084FC' : '#A1A1AA'}
                        />
                        <Text className={`font-semibold flex-1 ${
                          freqIdx === i ? 'text-primary dark:text-white' : 'text-charcoal dark:text-white'
                        }`}>
                          {f.label}
                        </Text>
                        {freqIdx === i && (
                          <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                            <Icon name="checkmark" size={12} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Step 3 — Members & summary */}
              {step === 2 && (
                <View className="gap-5">
                  <Text className="text-charcoal dark:text-white text-xl font-bold">Circle size</Text>

                  <View className="bg-primary/5 border border-primary/15 rounded-3xl p-4">
                    <View className="flex-row items-center justify-center gap-6 mb-2">
                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-white dark:bg-white/10 items-center justify-center"
                        onPress={() => setMembers((count) => Math.max(MIN_MEMBERS, count - 1))}
                        disabled={members === MIN_MEMBERS}
                        accessibilityLabel="Decrease member count"
                        style={{ opacity: members === MIN_MEMBERS ? 0.4 : 1 }}
                      >
                        <Text className="text-primary dark:text-[#C084FC] text-2xl font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="text-charcoal dark:text-white text-3xl font-bold">
                        {members} Members
                      </Text>
                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-white dark:bg-white/10 items-center justify-center"
                        onPress={() => setMembers((count) => Math.min(MAX_MEMBERS, count + 1))}
                        disabled={members === MAX_MEMBERS}
                        accessibilityLabel="Increase member count"
                        style={{ opacity: members === MAX_MEMBERS ? 0.4 : 1 }}
                      >
                        <Text className="text-primary dark:text-[#C084FC] text-2xl font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center">
                      Choose between {MIN_MEMBERS} and {MAX_MEMBERS} members. Contributions begin when the circle is full.
                    </Text>
                  </View>

                  <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-4 gap-1">
                    {[
                      { label: 'Circle name',   value: name },
                      { label: 'Members',       value: `${members}` },
                      { label: 'Per round',     value: `${amount || 0} USDC` },
                      { label: 'Frequency',     value: freq.label },
                      { label: 'Pot per round', value: `${pot.toFixed(0)} USDC`, bold: true },
                      { label: 'Total rounds',  value: `${members}` },
                    ].map((row) => (
                      <View
                        key={row.label}
                        className="flex-row justify-between py-2.5 border-b border-border dark:border-white/10/50 last:border-0"
                      >
                        <Text className="text-muted dark:text-[#A1A1AA] text-sm">{row.label}</Text>
                        <Text
                          className={`text-sm ${
                            row.bold
                              ? 'text-primary dark:text-[#C084FC] font-bold text-base'
                              : 'text-charcoal dark:text-white font-semibold'
                          }`}
                        >
                          {row.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            </ScrollView>

            {/* Navigation */}
            <View className="px-4 pb-8 pt-3 border-t border-border dark:border-white/10 gap-2">
              {step < 2 ? (
                <TouchableOpacity
                  className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${
                    canNext ? 'bg-primary' : 'bg-primary/30 dark:bg-[#2A1B3D]'
                  }`}
                  onPress={() => canNext && setStep((s) => s + 1)}
                  disabled={!canNext}
                >
                  <Text className={`font-bold text-base ${
                    canNext ? 'text-white' : 'text-white/50 dark:text-[#C4A8D8]'
                  }`}>
                    Next
                  </Text>
                  <Icon
                    name="arrow-forward"
                    size={18}
                    color={canNext ? 'white' : '#C4A8D8'}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${
                    creating ? 'bg-primary/50' : 'bg-primary'
                  }`}
                  onPress={create}
                  disabled={creating}
                >
                  <Icon name="checkmark-circle-outline" size={18} color="white" />
                  <Text className="text-white font-bold text-base">
                    {creating ? 'Waiting for wallet…' : 'Create Circle'}
                  </Text>
                </TouchableOpacity>
              )}
              {step > 0 && !creating && (
                <TouchableOpacity className="py-3 items-center" onPress={() => setStep((s) => s - 1)}>
                  <Text className="text-muted dark:text-[#A1A1AA] text-sm">Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

      </View>
    </Modal>
  );
}
