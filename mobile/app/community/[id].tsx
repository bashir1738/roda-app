import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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
  MAX_ENVELOPES,
  formatShares,
  formatUsdc,
} from '../../constants/roda';
import { decodeArgsBase64, describeProposalKind, type ProposalView } from '../../lib/sputnik';
import { openInTrezu } from '../../lib/trezu';
import { useWallet } from '../../providers/WalletContext';
import { useCommunity, useDaoTreasury, type EnvelopeData } from '../../hooks/useCommunities';
import { useConfirmLink, useRegisterDaoToken } from '../../hooks/useConfirmLink';
import { useBudgetDeposit } from '../../hooks/useBudgetDeposit';
import {
  useDaoBounties,
  useDaoBountyClaims,
  useDaoProposals,
} from '../../hooks/useDaoProposals';
import { useVote } from '../../hooks/useVote';
import { useAllocate } from '../../hooks/useAllocate';
import { useSpend } from '../../hooks/useSpend';
import { useBountyAction, useCreateProposal } from '../../hooks/useCreateProposal';
import { useRewardRuleProposals, useRewardRules } from '../../hooks/useRewardRules';
import { useMyShares, useOwnershipActions, useShareholders } from '../../hooks/useShares';
import { useRefresh } from '../../hooks/useRefresh';
import { TxStateView } from '../../components/TxStateView';
import { Icon } from '../../components/Icon';

type SectionTab = 'envelopes' | 'proposals' | 'rewards' | 'shares';

function fmtNear(yoctoStr: string): string {
  try {
    const val = Number(BigInt(yoctoStr || '0') / 10n ** 21n) / 1000;
    return val.toLocaleString('en-US', { maximumFractionDigits: 3 });
  } catch {
    return '0';
  }
}

function sumVotes(p: ProposalView) {
  let approve = 0;
  let reject = 0;
  let remove = 0;
  for (const v of Object.values(p.votes ?? {})) {
    if (v === 'Approve') approve += 1;
    else if (v === 'Reject') reject += 1;
    else if (v === 'Remove') remove += 1;
  }
  return { approve, reject, remove };
}

function formatCallPreview(p: ProposalView): string | null {
  if (typeof p.kind !== 'object' || p.kind === null || !('FunctionCall' in p.kind)) {
    return null;
  }
  const fc = (p.kind as { FunctionCall: { actions: { method_name: string; args: string }[] } })
    .FunctionCall;
  const first = fc.actions?.[0];
  if (!first) return null;
  const decoded = decodeArgsBase64(first.args);
  if (!decoded) return `${first.method_name}(…)`;
  return `${first.method_name}(${Object.entries(decoded)
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(', ')})`;
}

export default function CommunityDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const communityId = params.id ? Number(params.id) : NaN;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { address } = useWallet();
  const { refreshing, refresh } = useRefresh();

  const { data: community, isLoading } = useCommunity(communityId);
  const { data: treasury } = useDaoTreasury(community?.daoId);
  const { data: proposals = [], isLoading: propsLoading } = useDaoProposals(community?.daoId);
  const { data: bounties = [] } = useDaoBounties(community?.daoId);
  const { data: bountyClaims = [] } = useDaoBountyClaims(community?.daoId);
  const { data: rewardRules = [] } = useRewardRules(communityId);
  const { data: shareholders = [] } = useShareholders(communityId);
  const { data: myShares } = useMyShares(communityId);

  const confirmLink = useConfirmLink();
  const registerToken = useRegisterDaoToken();
  const budgetDeposit = useBudgetDeposit();
  const vote = useVote();
  const allocate = useAllocate();
  const spend = useSpend();
  const proposal = useCreateProposal();
  const bountyAction = useBountyAction();
  const rewardProps = useRewardRuleProposals();
  const ownership = useOwnershipActions();

  const [tab, setTab] = useState<SectionTab>('envelopes');

  // Modals
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTargetEnvId, setDepositTargetEnvId] = useState<number | null>(null);

  const [allocModalEnv, setAllocModalEnv] = useState<EnvelopeData | null>(null);
  const [allocAmount, setAllocAmount] = useState('');

  const [addEnvModalOpen, setAddEnvModalOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  const [editEnvModal, setEditEnvModal] = useState<EnvelopeData | null>(null);
  const [editEnvName, setEditEnvName] = useState('');

  const activeHook = useMemo(() => {
    const candidates = [
      { label: 'Proposal action confirmed!', hook: confirmLink },
      { label: 'DAO registered for USDC!', hook: registerToken },
      { label: 'Budget USDC deposited!', hook: budgetDeposit },
      { label: 'Vote recorded on Sputnik DAO!', hook: vote },
      { label: 'Allocation proposal submitted!', hook: allocate },
      { label: 'Envelope proposal submitted!', hook: spend },
      { label: 'Proposal submitted to DAO!', hook: proposal },
      { label: 'Bounty action confirmed!', hook: bountyAction },
      { label: 'Reward rule proposal submitted!', hook: rewardProps },
      { label: 'Ownership action confirmed!', hook: ownership },
    ];
    return candidates.find((c) => c.hook.txState !== 'idle') ?? null;
  }, [
    confirmLink,
    registerToken,
    budgetDeposit,
    vote,
    allocate,
    spend,
    proposal,
    bountyAction,
    rewardProps,
    ownership,
  ]);

  const dismissTxOverlay = () => {
    confirmLink.reset();
    registerToken.reset();
    budgetDeposit.reset();
    vote.reset();
    allocate.reset();
    spend.reset();
    proposal.reset();
    bountyAction.reset();
    rewardProps.reset();
    ownership.reset();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FDFBF7] dark:bg-[#111111] items-center justify-center">
        <ActivityIndicator size="large" color="#00C08B" />
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView className="flex-1 bg-[#FDFBF7] dark:bg-[#111111] px-6 items-center justify-center gap-4">
        <Icon name="alert-circle-outline" size={44} color="#EA580C" />
        <Text className="text-charcoal dark:text-white font-bold text-xl">
          Community not found
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-full px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-black font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const activeEnvelopes = community.envelopes.filter((e) => e.active);
  const mySharesBig = myShares?.shares ?? 0n;
  const ownershipPct =
    community.totalShares > 0n
      ? ((Number(mySharesBig) / Number(community.totalShares)) * 100).toFixed(1)
      : '0.0';

  const openPropose = (
    mode?: 'spend' | 'allocate' | 'transfer' | 'vote' | 'bounty' | 'reward' | 'shares',
    envelopeId?: number,
  ) => {
    router.push({
      pathname: '/community/[id]/propose',
      params: {
        id: String(community.id),
        ...(mode ? { mode } : {}),
        ...(envelopeId != null ? { envelopeId: String(envelopeId) } : {}),
      },
    });
  };

  const confirmDissolve = () => {
    if (activeEnvelopes.length > 0) {
      Alert.alert(
        'Active Envelopes Open',
        `On-chain dissolve_community requires closing all ${activeEnvelopes.length} active envelope(s) first so unspent allocations unlock to the pool.`,
        [{ text: 'Got it' }],
      );
      return;
    }
    Alert.alert(
      'Propose Dissolving Community?',
      'Submitting a dissolve_community proposal converts the remaining pool balance into a pro-rata claimable surplus for all shareholders once approved by the DAO.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Proposal',
          style: 'destructive',
          onPress: () => ownership.proposeDissolve(community.daoId, community.id),
        },
      ],
    );
  };

  const myClaimSet = new Set(bountyClaims.map((c) => c.bounty_id));

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7] dark:bg-[#111111]" edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/40 dark:border-white/5 bg-white dark:bg-[#111111]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-border/20 dark:bg-white/10 items-center justify-center"
        >
          <Icon name="arrow-back" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>

        <View className="flex-1 px-3">
          <Text
            className="text-charcoal dark:text-white font-bold text-base text-center"
            numberOfLines={1}
          >
            {community.name}
          </Text>
          <Text
            className="text-muted dark:text-[#A1A1AA] text-[11px] font-mono text-center"
            numberOfLines={1}
          >
            #{community.id} · {community.daoId}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => openInTrezu(community.daoId)}
          className="flex-row items-center gap-1 bg-primary/10 dark:bg-[#00C08B]/15 border border-primary/25 rounded-full px-3 py-1.5"
        >
          <Text className="text-primary dark:text-[#00C08B] text-[11px] font-bold">Trezu</Text>
          <Icon name="open-outline" size={12} color="#00C08B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 pb-16 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#00C08B"
            colors={['#00C08B']}
          />
        }
      >
        {/* Status / Link Pending Guided Card */}
        {!community.linked && !community.dissolved && (
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-3xl p-4 gap-3">
            <View className="flex-row items-center gap-2">
              <Icon name="link-outline" size={18} color="#F59E0B" />
              <Text className="text-amber-900 dark:text-amber-200 font-bold text-sm">
                DAO Link Pending Activation
              </Text>
            </View>
            <Text className="text-amber-800 dark:text-amber-200/90 text-xs leading-5">
              This community is staged, but escrow deposits and budget spending unlock once{' '}
              <Text className="font-mono font-bold">{community.daoId}</Text> passes a{' '}
              <Text className="font-mono">confirm_link</Text> proposal.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {treasury && !treasury.ftRegistered && (
                <TouchableOpacity
                  onPress={() => registerToken.registerDaoToken(community.daoId)}
                  className="bg-white dark:bg-[#1C1C1E] border border-amber-300 rounded-full px-3.5 py-2"
                >
                  <Text className="text-amber-900 dark:text-amber-200 text-xs font-bold">
                    1. Register DAO USDC
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  confirmLink.proposeConfirmLink(community.daoId, community.id, community.name)
                }
                className="bg-primary rounded-full px-4 py-2"
              >
                <Text className="text-black text-xs font-bold">Propose confirm_link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTab('proposals')}
                className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-full px-3.5 py-2"
              >
                <Text className="text-charcoal dark:text-white text-xs font-bold">
                  Vote in Proposals →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dissolved Claim Surplus Banner */}
        {community.dissolved && (
          <View className="bg-primary/10 dark:bg-[#00C08B]/15 border border-primary/30 rounded-3xl p-4 gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-charcoal dark:text-white font-bold text-sm">
                Community Dissolved — Surplus Distribution
              </Text>
              <Text className="text-primary dark:text-[#00C08B] font-black text-sm">
                ${formatUsdc(community.dissolveSurplus)} left
              </Text>
            </View>
            <Text className="text-muted dark:text-[#A1A1AA] text-xs">
              Your shares: {formatShares(mySharesBig)} ({ownershipPct}%) · Claimable: $
              {formatUsdc(myShares?.claimable ?? 0n)} USDC
            </Text>
            {myShares && myShares.claimable > 0n && !myShares.claimed ? (
              <TouchableOpacity
                onPress={() => ownership.claimSurplus(community.id)}
                className="bg-primary rounded-full py-3 items-center mt-1"
              >
                <Text className="text-black font-bold text-sm">
                  Claim ${formatUsdc(myShares.claimable)} USDC Surplus
                </Text>
              </TouchableOpacity>
            ) : myShares?.claimed ? (
              <Text className="text-primary dark:text-[#00C08B] text-xs font-bold">
                ✓ You have already claimed your surplus distribution.
              </Text>
            ) : null}
          </View>
        )}

        {/* Split Custody Treasury Row */}
        <View className="flex-row gap-3">
          {/* Sputnik Ops Treasury */}
          <View className="flex-1 bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 justify-between gap-3">
            <View>
              <Text className="text-muted dark:text-[#A1A1AA] text-[11px] font-bold uppercase tracking-wider">
                DAO Ops Treasury
              </Text>
              <Text className="text-charcoal dark:text-white font-black text-xl mt-1">
                ${formatUsdc(BigInt(treasury?.usdcRaw ?? '0'))}
              </Text>
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-medium mt-0.5">
                {fmtNear(treasury?.nearYocto ?? '0')} NEAR · Trezu ready
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-1.5">
              <TouchableOpacity
                onPress={() => openPropose('transfer')}
                className="bg-border/25 dark:bg-white/10 rounded-full px-3 py-1.5"
              >
                <Text className="text-charcoal dark:text-white text-[11px] font-bold">
                  Transfer
                </Text>
              </TouchableOpacity>
              {treasury && !treasury.ftRegistered && (
                <TouchableOpacity
                  onPress={() => registerToken.registerDaoToken(community.daoId)}
                  className="bg-amber-500/20 rounded-full px-3 py-1.5"
                >
                  <Text className="text-amber-600 dark:text-amber-300 text-[11px] font-bold">
                    Enable USDC
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Roda Budget Escrow */}
          <View className="flex-1 bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 justify-between gap-3">
            <View>
              <Text className="text-muted dark:text-[#A1A1AA] text-[11px] font-bold uppercase tracking-wider">
                Budget Escrow
              </Text>
              <Text className="text-primary dark:text-[#00C08B] font-black text-xl mt-1">
                ${formatUsdc(community.poolUnallocated + community.totalAllocatedRemaining)}
              </Text>
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-medium mt-0.5">
                Pool ${formatUsdc(community.poolUnallocated)} · Envs $
                {formatUsdc(community.totalAllocatedRemaining)}
              </Text>
            </View>
            <TouchableOpacity
              disabled={!community.linked || community.dissolved}
              onPress={() => {
                setDepositAmount('');
                setDepositTargetEnvId(null);
                setDepositModalOpen(true);
              }}
              className={`rounded-full px-3 py-1.5 self-start ${
                community.linked && !community.dissolved ? 'bg-primary' : 'bg-primary/25'
              }`}
            >
              <Text className="text-black text-[11px] font-bold">+ Deposit USDC</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Navigation */}
        <View className="flex-row bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-2xl p-1">
          {([
            { id: 'envelopes', label: 'Envelopes' },
            { id: 'proposals', label: `Votes (${proposals.filter((p) => p.status === 'InProgress').length})` },
            { id: 'rewards', label: 'Rewards' },
            { id: 'shares', label: 'Shares' },
          ] as const).map((item) => {
            const active = tab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setTab(item.id)}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  active ? 'bg-primary' : 'bg-transparent'
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-xs font-bold ${
                    active ? 'text-black' : 'text-muted dark:text-[#A1A1AA]'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: ENVELOPES */}
        {tab === 'envelopes' && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-charcoal dark:text-white font-bold text-base">
                Budget Envelopes ({community.envelopes.length}/{MAX_ENVELOPES})
              </Text>
              {community.linked &&
                !community.dissolved &&
                community.envelopes.length < MAX_ENVELOPES && (
                  <TouchableOpacity
                    onPress={() => {
                      setNewEnvName('');
                      setAddEnvModalOpen(true);
                    }}
                    className="flex-row items-center gap-1"
                  >
                    <Icon name="add-circle-outline" size={16} color="#00C08B" />
                    <Text className="text-primary dark:text-[#00C08B] text-xs font-bold">
                      Add Envelope
                    </Text>
                  </TouchableOpacity>
                )}
            </View>

            {community.envelopes.map((env) => {
              const pct =
                env.allocated > 0n
                  ? Math.min(100, Number((env.spent * 100n) / env.allocated))
                  : 0;

              return (
                <View
                  key={env.id}
                  className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 gap-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1 pr-2">
                      <Text className="text-charcoal dark:text-white font-bold text-base">
                        {env.name}
                      </Text>
                      {!env.active && (
                        <View className="bg-border/30 dark:bg-white/10 px-2 py-0.5 rounded-full">
                          <Text className="text-muted dark:text-[#A1A1AA] text-[10px] font-bold">
                            Closed
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-primary dark:text-[#00C08B] font-black text-base">
                      ${formatUsdc(env.remaining)} left
                    </Text>
                  </View>

                  <View>
                    <View className="h-2 rounded-full bg-border/30 dark:bg-white/10 overflow-hidden">
                      <View
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: env.active ? '#00C08B' : '#8E8E93',
                        }}
                      />
                    </View>
                    <View className="flex-row justify-between mt-1.5">
                      <Text className="text-muted dark:text-[#A1A1AA] text-[11px]">
                        Spent ${formatUsdc(env.spent)}
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-[11px]">
                        Cap ${formatUsdc(env.allocated)}
                      </Text>
                    </View>
                  </View>

                  {community.linked && !community.dissolved && (
                    <View className="flex-row flex-wrap gap-2">
                      {env.active && (
                        <>
                          <TouchableOpacity
                            onPress={() => {
                              setAllocModalEnv(env);
                              setAllocAmount('');
                            }}
                            className="bg-border/20 dark:bg-white/10 rounded-full px-3 py-1.5"
                          >
                            <Text className="text-charcoal dark:text-white text-xs font-bold">
                              Allocate
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => openPropose('spend', env.id)}
                            className="bg-primary rounded-full px-3.5 py-1.5"
                          >
                            <Text className="text-black text-xs font-bold">Propose Spend</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity
                        onPress={() => {
                          setEditEnvModal(env);
                          setEditEnvName(env.name);
                        }}
                        className="border border-border dark:border-white/15 rounded-full px-3 py-1.5"
                      >
                        <Text className="text-muted dark:text-[#A1A1AA] text-xs font-semibold">
                          Edit / {env.active ? 'Close' : 'Reopen'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 2: PROPOSALS */}
        {tab === 'proposals' && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-charcoal dark:text-white font-bold text-base">
                Sputnik DAO Proposals
              </Text>
              <TouchableOpacity
                onPress={() => openPropose('spend')}
                className="bg-primary rounded-full px-3.5 py-1.5 flex-row items-center gap-1"
              >
                <Icon name="add" size={14} color="#000000" />
                <Text className="text-black text-xs font-bold">New Proposal</Text>
              </TouchableOpacity>
            </View>

            {propsLoading ? (
              <ActivityIndicator size="small" color="#00C08B" className="py-8" />
            ) : proposals.length === 0 ? (
              <View className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-6 items-center gap-2">
                <Icon name="document-text-outline" size={32} color="#00C08B" />
                <Text className="text-charcoal dark:text-white font-bold text-sm">
                  No proposals yet
                </Text>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs text-center">
                  Create a Spend, Allocate, Transfer, Bounty, or Governance Poll proposal.
                </Text>
              </View>
            ) : (
              proposals.map((p) => {
                const info = describeProposalKind(p.kind);
                const tallies = sumVotes(p);
                const myVote = address ? p.votes?.[address] : undefined;
                const callPreview = formatCallPreview(p);
                const statusColor =
                  p.status === 'Approved'
                    ? '#00C08B'
                    : p.status === 'InProgress'
                      ? '#3B82F6'
                      : '#EF4444';

                return (
                  <View
                    key={p.id}
                    className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 gap-2.5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-muted dark:text-[#A1A1AA] font-mono text-xs font-bold">
                          #{p.id}
                        </Text>
                        <View className="bg-primary/10 dark:bg-[#00C08B]/15 px-2.5 py-0.5 rounded-full">
                          <Text className="text-primary dark:text-[#00C08B] text-[10px] font-bold">
                            {info.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>
                        {p.status}
                      </Text>
                    </View>

                    <Text className="text-charcoal dark:text-white font-semibold text-sm">
                      {p.description || info.summary}
                    </Text>

                    <Text className="text-muted dark:text-[#A1A1AA] text-xs" numberOfLines={2}>
                      {callPreview ?? info.summary}
                    </Text>

                    <View className="flex-row items-center justify-between pt-1">
                      <Text className="text-muted dark:text-[#A1A1AA] text-[11px]">
                        ✓ {tallies.approve} · ✕ {tallies.reject} · By {p.proposer}
                      </Text>
                      {myVote && (
                        <Text className="text-primary dark:text-[#00C08B] text-[11px] font-bold">
                          Voted: {myVote}
                        </Text>
                      )}
                    </View>

                    {p.status === 'InProgress' && !myVote && (
                      <View className="flex-row gap-2 pt-1">
                        <TouchableOpacity
                          onPress={() => vote.vote(community.daoId, p.id, 'VoteApprove')}
                          className="flex-1 bg-primary rounded-full py-2.5 flex-row items-center justify-center gap-1"
                        >
                          <Icon name="thumbs-up-outline" size={14} color="#000000" />
                          <Text className="text-black text-xs font-bold">Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => vote.vote(community.daoId, p.id, 'VoteReject')}
                          className="flex-1 bg-red-500/15 border border-red-500/30 rounded-full py-2.5 flex-row items-center justify-center gap-1"
                        >
                          <Icon name="thumbs-down-outline" size={14} color="#EF4444" />
                          <Text className="text-red-500 text-xs font-bold">Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 3: REWARDS (Track A Bounties + Track B Auto Rules) */}
        {tab === 'rewards' && (
          <View className="gap-5">
            {/* Track A: Sputnik Native Bounties */}
            <View className="gap-2.5">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-charcoal dark:text-white font-bold text-base">
                  DAO Bounties ({bounties.length})
                </Text>
                <TouchableOpacity
                  onPress={() => openPropose('bounty')}
                  className="flex-row items-center gap-1"
                >
                  <Icon name="add-circle-outline" size={16} color="#00C08B" />
                  <Text className="text-primary dark:text-[#00C08B] text-xs font-bold">
                    Propose Bounty
                  </Text>
                </TouchableOpacity>
              </View>

              {bounties.length === 0 ? (
                <View className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs text-center">
                    No active Sputnik bounties on {community.daoId}.
                  </Text>
                </View>
              ) : (
                bounties.map((b) => {
                  const claimedByMe = myClaimSet.has(b.id);
                  const days = Math.max(
                    1,
                    Math.round(Number(BigInt(b.max_deadline || '0') / 86_400_000_000_000n)),
                  );
                  return (
                    <View
                      key={b.id}
                      className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 gap-2.5"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-muted dark:text-[#A1A1AA] font-mono text-xs">
                          Bounty #{b.id}
                        </Text>
                        <Text className="text-primary dark:text-[#00C08B] font-black text-base">
                          ${formatUsdc(BigInt(b.amount))} USDC
                        </Text>
                      </View>
                      <Text className="text-charcoal dark:text-white font-semibold text-sm">
                        {b.description}
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                        {b.times} slots remaining · {days}d deadline
                      </Text>
                      <View className="flex-row flex-wrap gap-2 pt-1">
                        {claimedByMe && address ? (
                          <>
                            <TouchableOpacity
                              onPress={() =>
                                proposal.proposeBountyDone(
                                  community.daoId,
                                  b.id,
                                  address,
                                  `Bounty #${b.id} completed by ${address}`,
                                )
                              }
                              className="bg-primary rounded-full px-3.5 py-2"
                            >
                              <Text className="text-black text-xs font-bold">
                                Submit Completion
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => bountyAction.giveup(community.daoId, b.id)}
                              className="border border-red-400/50 rounded-full px-3 py-2"
                            >
                              <Text className="text-red-500 text-xs font-bold">Give Up</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          b.times > 0 && (
                            <TouchableOpacity
                              onPress={() =>
                                bountyAction.claim(community.daoId, b.id, b.max_deadline)
                              }
                              className="bg-primary rounded-full px-4 py-2"
                            >
                              <Text className="text-black text-xs font-bold">Claim Bounty</Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Track B: Roda Programmable Auto-Reward Rules */}
            <View className="gap-2.5">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-charcoal dark:text-white font-bold text-base">
                  Auto-Reward Rules ({rewardRules.length})
                </Text>
                {community.linked && !community.dissolved && (
                  <TouchableOpacity
                    onPress={() => openPropose('reward')}
                    className="flex-row items-center gap-1"
                  >
                    <Icon name="flash-outline" size={16} color="#00C08B" />
                    <Text className="text-primary dark:text-[#00C08B] text-xs font-bold">
                      New Auto-Rule
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {rewardRules.length === 0 ? (
                <View className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs text-center">
                    No automated circle/streak reward rules configured yet.
                  </Text>
                </View>
              ) : (
                rewardRules.map((rule) => {
                  const env = community.envelopes.find((e) => e.id === rule.sourceEnvelope);
                  const triggerLabel =
                    rule.trigger.kind === 'circle_round_completed'
                      ? 'On Circle Payout'
                      : `${rule.trigger.min_contributions}+ Contributions Streak`;

                  return (
                    <View
                      key={rule.id}
                      className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 gap-2"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-charcoal dark:text-white font-bold text-sm">
                          Rule #{rule.id} · {triggerLabel}
                        </Text>
                        <Text className="text-primary dark:text-[#00C08B] font-black text-sm">
                          +${formatUsdc(rule.amount)}
                        </Text>
                      </View>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                        Source: {env?.name ?? `Env #${rule.sourceEnvelope}`} ·{' '}
                        {rule.circleCode != null ? `Circle #${rule.circleCode}` : 'Any circle'}
                      </Text>
                      <View className="flex-row items-center justify-between pt-1">
                        <Text className="text-muted dark:text-[#A1A1AA] text-[11px]">
                          {rule.payoutsCount} payouts · ${formatUsdc(rule.totalPaid)} distributed
                        </Text>
                        {community.linked && !community.dissolved && (
                          <TouchableOpacity
                            onPress={() =>
                              rewardProps.proposeToggleRule(
                                community.daoId,
                                community.id,
                                rule.id,
                                !rule.active,
                              )
                            }
                            className="border border-border dark:border-white/15 rounded-full px-3 py-1"
                          >
                            <Text className="text-charcoal dark:text-white text-[11px] font-bold">
                              {rule.active ? 'Propose Pause' : 'Propose Enable'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* TAB 4: COLLECTIVE SHARES */}
        {tab === 'shares' && (
          <View className="gap-4">
            <View className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 gap-3">
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs">Your Shares</Text>
                  <Text className="text-primary dark:text-[#00C08B] font-black text-2xl mt-0.5">
                    {formatShares(mySharesBig)}
                  </Text>
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                    {ownershipPct}% of community
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs">Total Supply</Text>
                  <Text className="text-charcoal dark:text-white font-bold text-xl mt-0.5">
                    {formatShares(community.totalShares)}
                  </Text>
                </View>
              </View>

              {community.linked && !community.dissolved && (
                <View className="flex-row gap-2 pt-1">
                  <TouchableOpacity
                    onPress={() => openPropose('shares')}
                    className="flex-1 bg-primary rounded-full py-2.5 items-center"
                  >
                    <Text className="text-black text-xs font-bold">Propose Grant Shares</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmDissolve}
                    className="border border-red-500/40 bg-red-500/10 rounded-full px-4 py-2.5 items-center"
                  >
                    <Text className="text-red-500 text-xs font-bold">Dissolve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View className="bg-white dark:bg-[#1C1C1E] border border-border/60 dark:border-white/10 rounded-3xl p-4 gap-2">
              <Text className="text-charcoal dark:text-white font-bold text-sm mb-1">
                Shareholders ({shareholders.length})
              </Text>
              {shareholders.length === 0 ? (
                <Text className="text-muted dark:text-[#A1A1AA] text-xs py-2">
                  Shares mint 1:1 when members deposit USDC into Roda budgets or via DAO grants.
                </Text>
              ) : (
                shareholders.map((s) => {
                  const pct =
                    community.totalShares > 0n
                      ? ((Number(s.shares) / Number(community.totalShares)) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <View
                      key={s.account}
                      className="flex-row items-center justify-between py-2 border-b border-border/40 dark:border-white/5 last:border-0"
                    >
                      <Text className="text-charcoal dark:text-white text-xs font-mono flex-1 pr-2">
                        {s.account} {s.account === address ? '(You)' : ''}
                      </Text>
                      <Text className="text-primary dark:text-[#00C08B] text-xs font-bold">
                        {formatShares(s.shares)} ({pct}%)
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={depositModalOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setDepositModalOpen(false)}
      >
        <View className="flex-1 bg-[#FDFBF7] dark:bg-[#111111] px-5 pt-6 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-charcoal dark:text-white text-xl font-bold">
              Deposit Budget USDC
            </Text>
            <TouchableOpacity onPress={() => setDepositModalOpen(false)}>
              <Icon name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          <Text className="text-muted dark:text-[#A1A1AA] text-xs leading-5">
            Deposits fund Roda budget escrow directly and mint 1:1 collective ownership shares.
          </Text>

          <TextInput
            className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-4 text-charcoal dark:text-white text-2xl font-extrabold"
            placeholder="0.00 USDC"
            placeholderTextColor="#71717A"
            keyboardType="decimal-pad"
            value={depositAmount}
            onChangeText={setDepositAmount}
          />

          <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">
            Target Allocation
          </Text>
          <View className="gap-2">
            <TouchableOpacity
              onPress={() => setDepositTargetEnvId(null)}
              className={`px-4 py-3 rounded-2xl border ${
                depositTargetEnvId === null
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-white dark:bg-[#1C1C1E] dark:border-white/10'
              }`}
            >
              <Text className="text-charcoal dark:text-white text-sm font-bold">
                Unallocated Pool (Council allocates later)
              </Text>
            </TouchableOpacity>
            {activeEnvelopes.map((env) => (
              <TouchableOpacity
                key={env.id}
                onPress={() => setDepositTargetEnvId(env.id)}
                className={`px-4 py-3 rounded-2xl border ${
                  depositTargetEnvId === env.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-white dark:bg-[#1C1C1E] dark:border-white/10'
                }`}
              >
                <Text className="text-charcoal dark:text-white text-sm font-bold">
                  Direct to: {env.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={!(parseFloat(depositAmount) > 0)}
            onPress={() => {
              const num = parseFloat(depositAmount);
              if (!(num > 0)) return;
              setDepositModalOpen(false);
              budgetDeposit.depositBudget({
                communityId: community.id,
                envelopeId: depositTargetEnvId,
                amountUSDC: num,
              });
            }}
            className={`rounded-full py-4 items-center mt-2 ${
              parseFloat(depositAmount) > 0 ? 'bg-primary' : 'bg-primary/30'
            }`}
          >
            <Text className="text-black font-bold text-base">Deposit USDC</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Allocate Modal */}
      <Modal
        visible={!!allocModalEnv}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setAllocModalEnv(null)}
      >
        <View className="flex-1 bg-[#FDFBF7] dark:bg-[#111111] px-5 pt-6 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-charcoal dark:text-white text-xl font-bold">
              Propose Allocation
            </Text>
            <TouchableOpacity onPress={() => setAllocModalEnv(null)}>
              <Icon name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>
          <Text className="text-muted dark:text-[#A1A1AA] text-xs">
            Envelope: <Text className="font-bold">{allocModalEnv?.name}</Text> · Unallocated pool:
            ${formatUsdc(community.poolUnallocated)} USDC
          </Text>
          <TextInput
            className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-4 text-charcoal dark:text-white text-2xl font-extrabold"
            placeholder="0.00 USDC"
            placeholderTextColor="#71717A"
            keyboardType="decimal-pad"
            value={allocAmount}
            onChangeText={setAllocAmount}
          />
          <TouchableOpacity
            disabled={!(parseFloat(allocAmount) > 0)}
            onPress={() => {
              const num = parseFloat(allocAmount);
              if (!(num > 0) || !allocModalEnv) return;
              const target = allocModalEnv;
              setAllocModalEnv(null);
              allocate.proposeAllocate({
                daoId: community.daoId,
                communityId: community.id,
                envelopeId: target.id,
                envelopeName: target.name,
                amountUSDC: num,
              });
            }}
            className={`rounded-full py-4 items-center ${
              parseFloat(allocAmount) > 0 ? 'bg-primary' : 'bg-primary/30'
            }`}
          >
            <Text className="text-black font-bold text-base">Submit Allocate Proposal</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Add Envelope Modal */}
      <Modal
        visible={addEnvModalOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setAddEnvModalOpen(false)}
      >
        <View className="flex-1 bg-[#FDFBF7] dark:bg-[#111111] px-5 pt-6 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-charcoal dark:text-white text-xl font-bold">
              Propose New Envelope
            </Text>
            <TouchableOpacity onPress={() => setAddEnvModalOpen(false)}>
              <Icon name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3.5 text-charcoal dark:text-white text-base"
            placeholder="e.g. Community Events"
            placeholderTextColor="#71717A"
            maxLength={32}
            value={newEnvName}
            onChangeText={setNewEnvName}
          />
          <TouchableOpacity
            disabled={!newEnvName.trim()}
            onPress={() => {
              const n = newEnvName.trim();
              if (!n) return;
              setAddEnvModalOpen(false);
              spend.proposeAddEnvelope(community.daoId, community.id, n);
            }}
            className={`rounded-full py-4 items-center ${
              newEnvName.trim() ? 'bg-primary' : 'bg-primary/30'
            }`}
          >
            <Text className="text-black font-bold text-base">Propose Add Envelope</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit / Close Envelope Modal */}
      <Modal
        visible={!!editEnvModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setEditEnvModal(null)}
      >
        <View className="flex-1 bg-[#FDFBF7] dark:bg-[#111111] px-5 pt-6 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-charcoal dark:text-white text-xl font-bold">
              Manage Envelope #{editEnvModal?.id}
            </Text>
            <TouchableOpacity onPress={() => setEditEnvModal(null)}>
              <Icon name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3.5 text-charcoal dark:text-white text-base"
            placeholder="Envelope name"
            placeholderTextColor="#71717A"
            maxLength={32}
            value={editEnvName}
            onChangeText={setEditEnvName}
          />
          <TouchableOpacity
            disabled={!editEnvName.trim()}
            onPress={() => {
              const target = editEnvModal;
              const n = editEnvName.trim();
              if (!target || !n) return;
              setEditEnvModal(null);
              spend.proposeSetEnvelope(community.daoId, community.id, target.id, {
                name: n,
                description: `Rename envelope #${target.id} to "${n}"`,
              });
            }}
            className="bg-primary rounded-full py-4 items-center"
          >
            <Text className="text-black font-bold text-base">Propose Rename</Text>
          </TouchableOpacity>
          {editEnvModal && (
            <TouchableOpacity
              onPress={() => {
                const target = editEnvModal;
                setEditEnvModal(null);
                spend.proposeSetEnvelope(community.daoId, community.id, target.id, {
                  active: !target.active,
                  description: target.active
                    ? `Close envelope #${target.id} & return unspent funds to pool`
                    : `Reopen envelope #${target.id}`,
                });
              }}
              className="border border-border dark:border-white/20 rounded-full py-3.5 items-center"
            >
              <Text className="text-charcoal dark:text-white font-bold text-sm">
                {editEnvModal.active
                  ? 'Propose Close Envelope (Unlock Unspent to Pool)'
                  : 'Propose Reopen Envelope'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Active Tx Feedback Overlay Modal */}
      <Modal
        visible={!!activeHook}
        transparent
        animationType="fade"
        onRequestClose={dismissTxOverlay}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View className="w-full bg-white dark:bg-[#1C1C1E] rounded-3xl p-4">
            {activeHook && (
              <TxStateView
                txState={activeHook.hook.txState}
                txHash={activeHook.hook.txHash}
                error={activeHook.hook.error}
                successMessage={activeHook.label}
                onReset={dismissTxOverlay}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
