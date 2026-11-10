import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

import {
  formatShares,
  formatUsdc,
  isValidAddress,
  usdcToRaw,
} from '../../../constants/roda';
import { useCommunity, useDaoTreasury } from '../../../hooks/useCommunities';
import { useAllocate } from '../../../hooks/useAllocate';
import { useSpend } from '../../../hooks/useSpend';
import { useCreateProposal } from '../../../hooks/useCreateProposal';
import { useRewardRuleProposals, type RewardTrigger } from '../../../hooks/useRewardRules';
import { useOwnershipActions } from '../../../hooks/useShares';
import { TxStateView } from '../../../components/TxStateView';
import { Icon } from '../../../components/Icon';

type ProposalMode =
  | 'spend'
  | 'allocate'
  | 'transfer'
  | 'vote'
  | 'bounty'
  | 'reward'
  | 'shares';

const MODES: { id: ProposalMode; label: string }[] = [
  { id: 'spend', label: 'Envelope Spend' },
  { id: 'allocate', label: 'Allocate Pool' },
  { id: 'transfer', label: 'Ops Transfer' },
  { id: 'vote', label: 'Poll' },
  { id: 'bounty', label: 'Bounty' },
  { id: 'reward', label: 'Auto-Reward' },
  { id: 'shares', label: 'Grant Shares' },
];

function fmtNear(yoctoStr: string): string {
  try {
    const val = Number(BigInt(yoctoStr || '0') / 10n ** 21n) / 1000;
    return val.toLocaleString('en-US', { maximumFractionDigits: 3 });
  } catch {
    return '0';
  }
}

export default function ProposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    mode?: string;
    envelopeId?: string;
  }>();
  const communityId = params.id ? Number(params.id) : NaN;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: community, isLoading } = useCommunity(communityId);
  const { data: treasury } = useDaoTreasury(community?.daoId);

  const spend = useSpend();
  const allocate = useAllocate();
  const proposal = useCreateProposal();
  const rewardProps = useRewardRuleProposals();
  const ownership = useOwnershipActions();

  const initialMode: ProposalMode = MODES.some((m) => m.id === params.mode)
    ? (params.mode as ProposalMode)
    : 'spend';
  const [mode, setMode] = useState<ProposalMode>(initialMode);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(
    params.envelopeId != null && !Number.isNaN(Number(params.envelopeId))
      ? Number(params.envelopeId)
      : null,
  );

  // Form states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [transferAsset, setTransferAsset] = useState<'USDC' | 'NEAR'>('USDC');
  const [bountyTimes, setBountyTimes] = useState('1');
  const [bountyDays, setBountyDays] = useState('7');
  const [triggerKind, setTriggerKind] = useState<'circle_round_completed' | 'streak'>(
    'circle_round_completed',
  );
  const [streakMin, setStreakMin] = useState('5');
  const [circleCodeInput, setCircleCodeInput] = useState('');
  const [minRepGate, setMinRepGate] = useState('0');

  const activeEnvelopes = (community?.envelopes ?? []).filter((e) => e.active);

  useEffect(() => {
    if (selectedEnvId === null && activeEnvelopes.length > 0) {
      setSelectedEnvId(activeEnvelopes[0].id);
    }
  }, [activeEnvelopes, selectedEnvId]);

  const activeTx =
    mode === 'spend'
      ? spend
      : mode === 'allocate'
        ? allocate
        : mode === 'reward'
          ? rewardProps
          : mode === 'shares'
            ? ownership
            : proposal;

  const resetAllTx = () => {
    spend.reset();
    allocate.reset();
    proposal.reset();
    rewardProps.reset();
    ownership.reset();
  };

  const selectedEnv =
    activeEnvelopes.find((e) => e.id === selectedEnvId) ?? activeEnvelopes[0] ?? null;

  const parsedNum = parseFloat(amount || '0');
  const rawUsdc = Number.isFinite(parsedNum) && parsedNum > 0 ? BigInt(usdcToRaw(parsedNum)) : 0n;

  const overEnvelopeCap =
    mode === 'spend' && selectedEnv != null && rawUsdc > selectedEnv.remaining;
  const overPoolCap =
    mode === 'allocate' && community != null && rawUsdc > community.poolUnallocated;

  const recipientNormalized = recipient.trim().toLowerCase();
  const recipientValid = isValidAddress(recipientNormalized);

  const canSubmit = (() => {
    if (!community) return false;
    switch (mode) {
      case 'spend':
        return (
          community.linked &&
          !community.dissolved &&
          !!selectedEnv &&
          recipientValid &&
          rawUsdc > 0n &&
          !overEnvelopeCap
        );
      case 'allocate':
        return (
          community.linked &&
          !community.dissolved &&
          !!selectedEnv &&
          rawUsdc > 0n &&
          !overPoolCap
        );
      case 'transfer':
        return recipientValid && Number.isFinite(parsedNum) && parsedNum > 0 && !!memo.trim();
      case 'vote':
        return memo.trim().length >= 3;
      case 'bounty':
        return (
          memo.trim().length >= 3 &&
          parsedNum > 0 &&
          parseInt(bountyTimes || '1', 10) >= 1 &&
          parseInt(bountyDays || '7', 10) >= 1
        );
      case 'reward': {
        const streakValid =
          triggerKind === 'circle_round_completed' ||
          parseInt(streakMin || '0', 10) >= 1;
        const codeTrim = circleCodeInput.trim();
        const codeValid = codeTrim === '' || /^\d{6}$/.test(codeTrim);
        return (
          community.linked &&
          !community.dissolved &&
          !!selectedEnv &&
          rawUsdc > 0n &&
          streakValid &&
          codeValid
        );
      }
      case 'shares':
        return (
          community.linked &&
          !community.dissolved &&
          recipientValid &&
          rawUsdc > 0n
        );
    }
  })();

  const handleSubmit = async () => {
    if (!community || !canSubmit) return;
    switch (mode) {
      case 'spend':
        await spend.proposeSpend({
          daoId: community.daoId,
          communityId: community.id,
          envelopeId: selectedEnv!.id,
          envelopeName: selectedEnv!.name,
          recipient: recipientNormalized,
          amountUSDC: parsedNum,
          memo,
        });
        break;
      case 'allocate':
        await allocate.proposeAllocate({
          daoId: community.daoId,
          communityId: community.id,
          envelopeId: selectedEnv!.id,
          envelopeName: selectedEnv!.name,
          amountUSDC: parsedNum,
          description: memo,
        });
        break;
      case 'transfer':
        await proposal.proposeTransfer(community.daoId, {
          asset: transferAsset,
          receiverId: recipientNormalized,
          amount: amount.trim(),
          description: memo.trim(),
        });
        break;
      case 'vote':
        await proposal.proposeVote(community.daoId, memo.trim());
        break;
      case 'bounty':
        await proposal.proposeAddBounty(community.daoId, {
          description: memo.trim(),
          amountUSDC: parsedNum,
          times: Math.max(1, parseInt(bountyTimes || '1', 10)),
          deadlineDays: Math.max(1, parseInt(bountyDays || '7', 10)),
        });
        break;
      case 'reward': {
        const trigger: RewardTrigger =
          triggerKind === 'circle_round_completed'
            ? { kind: 'circle_round_completed' }
            : { kind: 'streak', min_contributions: Math.max(1, parseInt(streakMin || '1', 10)) };
        const codeNum = circleCodeInput.trim() ? Number(circleCodeInput.trim()) : null;
        await rewardProps.proposeCreateRule(community.daoId, {
          communityId: community.id,
          sourceEnvelope: selectedEnv!.id,
          circleCode: codeNum,
          trigger,
          amountUSDC: parsedNum,
          description: memo.trim() || undefined,
        });
        break;
      }
      case 'shares':
        await ownership.proposeGrantShares(community.daoId, {
          communityId: community.id,
          recipient: recipientNormalized,
          shareUnits: parsedNum,
          minReputation: parseInt(minRepGate || '0', 10) || undefined,
          description: memo.trim() || undefined,
        });
        break;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7] dark:bg-[#111111]" edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/50 dark:border-white/5 bg-white dark:bg-[#111111]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-border/20 dark:bg-white/10 items-center justify-center"
        >
          <Icon name="arrow-back" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-charcoal dark:text-white font-bold text-base">
            New DAO Proposal
          </Text>
          {community && (
            <Text className="text-muted dark:text-[#A1A1AA] text-[11px] font-mono">
              {community.daoId}
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00C08B" />
        </View>
      ) : !community ? (
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Text className="text-charcoal dark:text-white font-bold text-lg">
            Community not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : activeTx.txState !== 'idle' ? (
        <View className="flex-1 justify-center px-5">
          <TxStateView
            txState={activeTx.txState}
            txHash={activeTx.txHash}
            error={activeTx.error}
            successMessage="Proposal submitted to Sputnik DAO!"
            onReset={() => {
              const wasSuccess = activeTx.txState === 'success';
              resetAllTx();
              if (wasSuccess) router.back();
            }}
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Mode selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="max-h-14 border-b border-border/40 dark:border-white/5"
            contentContainerClassName="px-4 py-2.5 gap-2 items-center"
          >
            {MODES.map((m) => {
              const selected = mode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => {
                    resetAllTx();
                    setMode(m.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    selected
                      ? 'bg-primary border-primary'
                      : 'bg-white dark:bg-[#1C1C1E] border-border dark:border-white/10'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selected ? 'text-black' : 'text-charcoal dark:text-white'
                    }`}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView className="flex-1 px-4" contentContainerClassName="py-4 pb-10 gap-4">
            {!community.linked &&
              (mode === 'spend' || mode === 'allocate' || mode === 'reward' || mode === 'shares') && (
                <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-3.5">
                  <Text className="text-amber-800 dark:text-amber-200 text-xs leading-5">
                    This community is not linked yet. Approve the <Text className="font-mono font-bold">confirm_link</Text> proposal in the community dashboard before executing Roda budget or ownership calls.
                  </Text>
                </View>
              )}

            {/* Envelope selector for spend / allocate / reward */}
            {(mode === 'spend' || mode === 'allocate' || mode === 'reward') && (
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
                  {mode === 'reward' ? 'Source Envelope' : 'Budget Envelope'}
                </Text>
                {activeEnvelopes.length === 0 ? (
                  <View className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-3.5">
                    <Text className="text-orange-700 dark:text-orange-200 text-xs">
                      No active envelopes available.
                    </Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {activeEnvelopes.map((env) => {
                      const active = selectedEnv?.id === env.id;
                      return (
                        <TouchableOpacity
                          key={env.id}
                          onPress={() => setSelectedEnvId(env.id)}
                          className={`flex-row items-center justify-between px-4 py-3 rounded-2xl border ${
                            active
                              ? 'border-primary bg-primary/10 dark:bg-[#00C08B]/15'
                              : 'border-border bg-white dark:bg-[#1C1C1E] dark:border-white/10'
                          }`}
                        >
                          <View>
                            <Text className="text-charcoal dark:text-white font-bold text-sm">
                              {env.name}
                            </Text>
                            <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                              Allocated ${formatUsdc(env.allocated)} · Spent ${formatUsdc(env.spent)}
                            </Text>
                          </View>
                          <Text className="text-primary dark:text-[#00C08B] font-bold text-sm">
                            ${formatUsdc(env.remaining)} left
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Asset switcher for DAO Transfer */}
            {mode === 'transfer' && (
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
                  DAO Ops Treasury Asset
                </Text>
                <View className="flex-row gap-2">
                  {(['USDC', 'NEAR'] as const).map((asset) => {
                    const selected = transferAsset === asset;
                    const bal =
                      asset === 'USDC'
                        ? `$${formatUsdc(BigInt(treasury?.usdcRaw ?? '0'))} USDC`
                        : `${fmtNear(treasury?.nearYocto ?? '0')} NEAR`;
                    return (
                      <TouchableOpacity
                        key={asset}
                        onPress={() => setTransferAsset(asset)}
                        className={`flex-1 rounded-2xl p-3 border ${
                          selected
                            ? 'border-primary bg-primary/10 dark:bg-[#00C08B]/15'
                            : 'border-border bg-white dark:bg-[#1C1C1E] dark:border-white/10'
                        }`}
                      >
                        <Text className="text-charcoal dark:text-white font-bold text-sm">
                          {asset}
                        </Text>
                        <Text className="text-muted dark:text-[#A1A1AA] text-xs mt-0.5">
                          Bal: {bal}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Pool Unallocated banner for allocate */}
            {mode === 'allocate' && (
              <View className="bg-primary/5 dark:bg-[#00C08B]/10 border border-primary/20 rounded-2xl px-4 py-3 flex-row justify-between items-center">
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-semibold">
                  Unallocated Pool Available
                </Text>
                <Text className="text-primary dark:text-[#00C08B] font-black text-base">
                  ${formatUsdc(community.poolUnallocated)} USDC
                </Text>
              </View>
            )}

            {/* Trigger picker for auto-rewards */}
            {mode === 'reward' && (
              <View className="gap-3">
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">
                  Reward Trigger
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { id: 'circle_round_completed' as const, label: 'Round Payout' },
                    { id: 'streak' as const, label: 'Streak Milestone' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setTriggerKind(opt.id)}
                      className={`flex-1 py-3 rounded-2xl border items-center ${
                        triggerKind === opt.id
                          ? 'border-primary bg-primary/10 dark:bg-[#00C08B]/15'
                          : 'border-border bg-white dark:bg-[#1C1C1E] dark:border-white/10'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          triggerKind === opt.id
                            ? 'text-primary dark:text-[#00C08B]'
                            : 'text-charcoal dark:text-white'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {triggerKind === 'streak' && (
                  <View>
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs font-semibold mb-1">
                      Minimum On-Time Contributions
                    </Text>
                    <TextInput
                      className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-bold"
                      keyboardType="number-pad"
                      value={streakMin}
                      onChangeText={setStreakMin}
                      placeholder="5"
                    />
                  </View>
                )}

                <View>
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-semibold mb-1">
                    Restrict to Circle Code (Optional, 6 digits)
                  </Text>
                  <TextInput
                    className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-mono"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={circleCodeInput}
                    onChangeText={setCircleCodeInput}
                    placeholder="Leave blank for any Roda circle"
                    placeholderTextColor="#71717A"
                  />
                </View>
              </View>
            )}

            {/* Recipient for spend / transfer / shares */}
            {(mode === 'spend' || mode === 'transfer' || mode === 'shares') && (
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                  Recipient Account ID
                </Text>
                <TextInput
                  className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3.5 text-charcoal dark:text-white text-sm font-mono"
                  placeholder="recipient.testnet"
                  placeholderTextColor="#71717A"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={recipient}
                  onChangeText={setRecipient}
                />
                {recipient.trim().length > 0 && !recipientValid && (
                  <Text className="text-red-500 text-xs mt-1">
                    Enter a valid NEAR account ID.
                  </Text>
                )}
              </View>
            )}

            {/* Amount input for everything except vote */}
            {mode !== 'vote' && (
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                  {mode === 'transfer'
                    ? `Amount (${transferAsset})`
                    : mode === 'shares'
                      ? 'Shares to Grant (1.00 = 1 unit)'
                      : 'Amount (USDC)'}
                </Text>
                <TextInput
                  className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3.5 text-charcoal dark:text-white text-xl font-extrabold"
                  placeholder="0.00"
                  placeholderTextColor="#71717A"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                {overEnvelopeCap && selectedEnv && (
                  <Text className="text-red-500 text-xs mt-1">
                    Exceeds remaining envelope budget (${formatUsdc(selectedEnv.remaining)} USDC).
                  </Text>
                )}
                {overPoolCap && (
                  <Text className="text-red-500 text-xs mt-1">
                    Exceeds unallocated pool (${formatUsdc(community.poolUnallocated)} USDC).
                  </Text>
                )}
                {mode === 'shares' && (
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs mt-1">
                    Current community supply: {formatShares(community.totalShares)} shares
                  </Text>
                )}
              </View>
            )}

            {/* Bounty extra fields */}
            {mode === 'bounty' && (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                    Max Claims
                  </Text>
                  <TextInput
                    className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-bold"
                    keyboardType="number-pad"
                    value={bountyTimes}
                    onChangeText={setBountyTimes}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                    Deadline (Days)
                  </Text>
                  <TextInput
                    className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-bold"
                    keyboardType="number-pad"
                    value={bountyDays}
                    onChangeText={setBountyDays}
                  />
                </View>
              </View>
            )}

            {/* Min rep gate for share grant */}
            {mode === 'shares' && (
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                  Recipient Min Reputation (Optional, 0 = none)
                </Text>
                <TextInput
                  className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-bold"
                  keyboardType="number-pad"
                  value={minRepGate}
                  onChangeText={setMinRepGate}
                />
              </View>
            )}

            {/* Memo / description */}
            <View>
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                {mode === 'vote'
                  ? 'Poll Question / Proposal Description'
                  : mode === 'bounty'
                    ? 'Bounty Deliverable Description'
                    : mode === 'transfer'
                      ? 'Proposal Description (Required)'
                      : 'Proposal Memo (Optional)'}
              </Text>
              <TextInput
                className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm"
                placeholder="Describe why this action benefits the community…"
                placeholderTextColor="#71717A"
                multiline
                numberOfLines={3}
                value={memo}
                onChangeText={setMemo}
              />
            </View>

            {/* Bond info */}
            <View className="bg-primary/5 dark:bg-white/5 border border-border/50 dark:border-white/10 rounded-2xl px-4 py-3 flex-row items-center gap-2.5">
              <Icon name="information-circle-outline" size={18} color="#00C08B" />
              <Text className="flex-1 text-muted dark:text-[#A1A1AA] text-xs leading-4">
                Submitting a Sputnik proposal attaches the DAO's proposal bond (~
                {fmtNear(treasury?.policy?.proposal_bond ?? '100000000000000000000000')}{' '}
                NEAR), refunded on approval or expiration.
              </Text>
            </View>
          </ScrollView>

          <View className="px-4 pb-6 pt-3 border-t border-border/50 dark:border-white/10">
            <TouchableOpacity
              className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${
                canSubmit && !activeTx.isPending
                  ? 'bg-primary'
                  : 'bg-primary/30 dark:bg-[#00C08B]/20'
              }`}
              disabled={!canSubmit || activeTx.isPending}
              onPress={handleSubmit}
            >
              <Icon name="document-text-outline" size={18} color="#000000" />
              <Text className="text-black font-bold text-base">
                Submit Proposal to DAO
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
