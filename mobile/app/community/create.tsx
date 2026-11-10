import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

import {
  MAX_ENVELOPES,
  SPUTNIK_DAO_SUFFIX,
  isValidAddress,
} from '../../constants/roda';
import { sanitizeDaoSlug } from '../../lib/sputnik';
import { useWallet } from '../../providers/WalletContext';
import {
  useCreateCommunity,
  type CreateCommunityStage,
} from '../../hooks/useCreateCommunity';
import { useCommunityMinRepGate, useReputation } from '../../hooks/useReputation';
import { TxStateView } from '../../components/TxStateView';
import { Icon } from '../../components/Icon';

const STAGE_LABELS: Record<CreateCommunityStage, string> = {
  idle: 'Ready',
  deploying_dao: '1/4 · Deploying Sputnik DAO via factory…',
  registering_token: '2/4 · Registering DAO for USDC storage…',
  staging_community: '3/4 · Staging community & envelopes on Roda…',
  proposing_link: '4/4 · Submitting confirm_link proposal to DAO…',
  done: 'Complete!',
};

export default function CreateCommunityScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { address, isConnected, connect, walletKind, externalKeyScope, connectNearWallet } =
    useWallet();

  const {
    createCommunity,
    stage,
    createdCommunityId,
    createdDaoId,
    txState,
    txHash,
    error,
    isPending,
    reset,
  } = useCreateCommunity();
  const { data: repData } = useReputation();
  const { data: minCreateRep = 0 } = useCommunityMinRepGate();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'create' | 'link'>('create');
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [existingDaoId, setExistingDaoId] = useState('');
  const [council, setCouncil] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [thresholdNum, setThresholdNum] = useState(1);
  const [envelopes, setEnvelopes] = useState<string[]>(['Operations', 'Programs', 'Grants']);
  const [proposeLinkNow, setProposeLinkNow] = useState(true);

  useEffect(() => {
    if (address && council.length === 0) {
      setCouncil([address]);
      setThresholdNum(1);
    }
  }, [address, council.length]);

  const myScore = repData?.score ?? 0;
  const repBlocked = minCreateRep > 0 && myScore < minCreateRep;

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 3 && trimmedName.length <= 48;
  const normalizedExistingDao = existingDaoId.trim().toLowerCase();
  const isExistingDaoValid =
    normalizedExistingDao.length > 0 && isValidAddress(normalizedExistingDao);
  const previewDaoId =
    mode === 'create'
      ? `${sanitizeDaoSlug(trimmedName || 'community')}.${SPUTNIK_DAO_SUFFIX}`
      : normalizedExistingDao;

  const cleanEnvelopes = envelopes.map((e) => e.trim()).filter(Boolean);
  const step0Valid =
    isNameValid && (mode === 'create' || isExistingDaoValid);
  const step1Valid =
    mode === 'link' ||
    (council.length > 0 && council.every((a) => isValidAddress(a)));
  const step2Valid =
    cleanEnvelopes.length >= 1 &&
    cleanEnvelopes.length <= MAX_ENVELOPES &&
    cleanEnvelopes.every((e) => e.length <= 32);

  const canNext = [step0Valid, step1Valid, step2Valid][step];

  const addCouncilMember = () => {
    const candidate = newMember.trim().toLowerCase();
    if (!candidate || !isValidAddress(candidate)) return;
    if (council.includes(candidate)) {
      setNewMember('');
      return;
    }
    const next = [...council, candidate];
    setCouncil(next);
    setThresholdNum(Math.min(next.length, Math.max(1, Math.floor(next.length / 2) + 1)));
    setNewMember('');
  };

  const removeCouncilMember = (member: string) => {
    if (council.length <= 1) return;
    const next = council.filter((m) => m !== member);
    setCouncil(next);
    setThresholdNum((t) => Math.min(t, next.length));
  };

  const handleCreate = async () => {
    await createCommunity({
      mode,
      name: trimmedName,
      purpose: purpose.trim() || undefined,
      existingDaoId: mode === 'link' ? normalizedExistingDao : undefined,
      council,
      thresholdNum,
      thresholdDen: council.length,
      envelopes: cleanEnvelopes,
      proposeLinkImmediately: proposeLinkNow,
    });
  };

  const isTxActive = txState !== 'idle';

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
        <Text className="text-charcoal dark:text-white font-bold text-base">
          Create Community
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {!isConnected ? (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <Icon name="wallet-outline" size={44} color="#00C08B" />
          <Text className="text-charcoal dark:text-white font-bold text-xl text-center">
            Connect Wallet First
          </Text>
          <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center">
            Connect your NEAR account to deploy a Sputnik DAO and register a community on Roda.
          </Text>
          <TouchableOpacity className="bg-primary rounded-full px-8 py-3.5" onPress={connect}>
            <Text className="text-black font-bold">Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : isTxActive ? (
        <ScrollView contentContainerClassName="flex-1 px-5 py-8 justify-center">
          <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-5 mb-4">
            <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1">
              Progress
            </Text>
            <Text className="text-charcoal dark:text-white font-bold text-sm">
              {STAGE_LABELS[stage]}
            </Text>
            {createdDaoId && (
              <Text className="text-primary dark:text-[#00C08B] text-xs font-mono mt-2">
                DAO: {createdDaoId}
              </Text>
            )}
          </View>

          <TxStateView
            txState={txState}
            txHash={txHash}
            error={error}
            successMessage={
              createdCommunityId != null
                ? `Community #${createdCommunityId} staged!`
                : 'Community created!'
            }
            onReset={() => {
              if (txState === 'success' && createdCommunityId != null) {
                router.replace({
                  pathname: '/community/[id]',
                  params: { id: String(createdCommunityId) },
                });
              } else {
                reset();
              }
            }}
          />

          {txState === 'success' && (
            <View className="bg-primary/10 dark:bg-[#00C08B]/15 border border-primary/20 dark:border-[#00C08B]/30 rounded-2xl p-4 mt-4 gap-3">
              <Text className="text-charcoal dark:text-white text-xs leading-5 text-center">
                {proposeLinkNow
                  ? 'A confirm_link proposal was submitted to your Sputnik DAO. Vote Approve inside the community dashboard to activate budget escrow.'
                  : 'Open the community dashboard to submit and approve the confirm_link proposal on your DAO.'}
              </Text>
              {createdCommunityId != null && (
                <TouchableOpacity
                  className="bg-primary rounded-full py-3.5 items-center"
                  onPress={() =>
                    router.replace({
                      pathname: '/community/[id]',
                      params: { id: String(createdCommunityId) },
                    })
                  }
                >
                  <Text className="text-black font-bold">Open Community Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Step Indicator */}
          <View className="flex-row gap-1.5 px-4 pt-4 pb-2">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-border dark:bg-white/10'
                }`}
              />
            ))}
          </View>
          <Text className="text-muted dark:text-[#A1A1AA] text-xs px-4 mb-2">
            Step {step + 1} of 3
          </Text>

          <ScrollView className="flex-1 px-4" contentContainerClassName="pb-8 pt-2">
            {repBlocked && (
              <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/60 rounded-2xl p-3.5 mb-4 flex-row gap-2.5 items-center">
                <Icon name="shield-checkmark-outline" size={20} color="#F59E0B" />
                <Text className="flex-1 text-amber-800 dark:text-amber-200 text-xs leading-5">
                  Community creation currently requires Reputation {minCreateRep}+ (yours is{' '}
                  {myScore}).
                </Text>
              </View>
            )}

            {walletKind === 'meteor' && externalKeyScope === 'contract' && (
              <TouchableOpacity
                onPress={() => connectNearWallet('meteor', 'full').catch(() => {})}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/60 rounded-2xl p-3.5 mb-4 flex-row gap-2.5 items-center"
              >
                <Icon name="warning-outline" size={18} color="#F59E0B" />
                <Text className="flex-1 text-amber-800 dark:text-amber-200 text-xs">
                  Deploying a Sputnik DAO requires multi-contract signing. Tap to upgrade your Meteor key.
                </Text>
              </TouchableOpacity>
            )}

            {/* Step 0: Identity & DAO Mode */}
            {step === 0 && (
              <View className="gap-4">
                <Text className="text-charcoal dark:text-white text-xl font-bold">
                  Community & DAO Setup
                </Text>

                {/* Mode switch */}
                <View className="flex-row bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl p-1">
                  {([
                    { id: 'create', label: 'New Sputnik DAO' },
                    { id: 'link', label: 'Link Existing DAO' },
                  ] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setMode(opt.id)}
                      className={`flex-1 py-2.5 rounded-xl items-center ${
                        mode === opt.id ? 'bg-primary' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          mode === opt.id ? 'text-black' : 'text-muted dark:text-[#A1A1AA]'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View>
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                    Community Name
                  </Text>
                  <TextInput
                    className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3.5 text-charcoal dark:text-white text-base"
                    placeholder="e.g. Lagos Builders Collective"
                    placeholderTextColor="#71717A"
                    value={name}
                    onChangeText={setName}
                    maxLength={48}
                  />
                  {trimmedName.length > 0 && trimmedName.length < 3 && (
                    <Text className="text-red-500 text-xs mt-1">
                      Must be 3–48 characters.
                    </Text>
                  )}
                </View>

                {mode === 'create' ? (
                  <>
                    <View>
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                        DAO Purpose (Optional)
                      </Text>
                      <TextInput
                        className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm"
                        placeholder="Community ops treasury, shared grants & ROSCA bonuses"
                        placeholderTextColor="#71717A"
                        value={purpose}
                        onChangeText={setPurpose}
                        multiline
                      />
                    </View>

                    <View className="bg-primary/5 dark:bg-[#00C08B]/10 border border-primary/20 rounded-2xl p-3.5 gap-1">
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs font-semibold">
                        Sputnik DAO Address Preview
                      </Text>
                      <Text className="text-primary dark:text-[#00C08B] font-mono text-xs font-bold">
                        {previewDaoId}
                      </Text>
                      <Text className="text-muted dark:text-[#A1A1AA] text-[11px] leading-4 mt-1">
                        Factory deployment attaches ~6 NEAR storage deposit for the DAO subaccount.
                      </Text>
                    </View>
                  </>
                ) : (
                  <View>
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                      Existing Sputnik DAO Account ID
                    </Text>
                    <TextInput
                      className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3.5 text-charcoal dark:text-white text-sm font-mono"
                      placeholder={`e.g. mydao.${SPUTNIK_DAO_SUFFIX}`}
                      placeholderTextColor="#71717A"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={existingDaoId}
                      onChangeText={setExistingDaoId}
                    />
                    {existingDaoId.trim().length > 0 && !isExistingDaoValid && (
                      <Text className="text-red-500 text-xs mt-1">
                        Enter a valid NEAR account ID.
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Step 1: Council & Quorum */}
            {step === 1 && (
              <View className="gap-4">
                <Text className="text-charcoal dark:text-white text-xl font-bold">
                  {mode === 'create' ? 'DAO Council & Voting' : 'DAO Linking Verification'}
                </Text>

                {mode === 'create' ? (
                  <>
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs leading-5">
                      Council members propose and vote on Roda budget allocations, envelope spends, reward rules, and Sputnik ops transfers.
                    </Text>

                    <View className="flex-row gap-2">
                      <TextInput
                        className="flex-1 bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-mono"
                        placeholder="member.testnet"
                        placeholderTextColor="#71717A"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={newMember}
                        onChangeText={setNewMember}
                        onSubmitEditing={addCouncilMember}
                      />
                      <TouchableOpacity
                        className="bg-primary rounded-2xl px-4 items-center justify-center"
                        onPress={addCouncilMember}
                      >
                        <Text className="text-black font-bold text-sm">Add</Text>
                      </TouchableOpacity>
                    </View>

                    <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-4 gap-2">
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1">
                        Council ({council.length})
                      </Text>
                      {council.map((m) => (
                        <View
                          key={m}
                          className="flex-row items-center justify-between py-2 border-b border-border/40 dark:border-white/5 last:border-0"
                        >
                          <Text
                            className="text-charcoal dark:text-white text-xs font-mono flex-1 pr-2"
                            numberOfLines={1}
                          >
                            {m} {m === address ? '(You)' : ''}
                          </Text>
                          {council.length > 1 && (
                            <TouchableOpacity onPress={() => removeCouncilMember(m)}>
                              <Icon name="close-circle" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>

                    <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-4">
                      <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-3">
                        Approval Threshold
                      </Text>
                      <View className="flex-row items-center justify-center gap-6">
                        <TouchableOpacity
                          className="w-10 h-10 rounded-full bg-border/20 dark:bg-white/10 items-center justify-center"
                          onPress={() => setThresholdNum((t) => Math.max(1, t - 1))}
                        >
                          <Text className="text-primary font-bold text-xl">-</Text>
                        </TouchableOpacity>
                        <Text className="text-charcoal dark:text-white font-black text-xl">
                          {thresholdNum} of {council.length}
                        </Text>
                        <TouchableOpacity
                          className="w-10 h-10 rounded-full bg-border/20 dark:bg-white/10 items-center justify-center"
                          onPress={() =>
                            setThresholdNum((t) => Math.min(council.length, t + 1))
                          }
                        >
                          <Text className="text-primary font-bold text-xl">+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                ) : (
                  <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-5 gap-3">
                    <Text className="text-charcoal dark:text-white font-bold text-sm">
                      Two-Step Sputnik Consent
                    </Text>
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs leading-5">
                      1. Roda stages the community in pending state mapped to{' '}
                      <Text className="font-mono font-bold">{previewDaoId}</Text>.{'\n'}
                      2. Your DAO council approves a <Text className="font-mono">confirm_link</Text>{' '}
                      FunctionCall proposal so Roda verifies the DAO genuinely governs this escrow.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Envelopes & Review */}
            {step === 2 && (
              <View className="gap-4">
                <Text className="text-charcoal dark:text-white text-xl font-bold">
                  Budget Envelopes (up to {MAX_ENVELOPES})
                </Text>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs leading-5">
                  Envelopes impose hard spending caps on Roda escrow funds. Members can deposit USDC directly to an envelope or the shared pool.
                </Text>

                <View className="gap-2.5">
                  {envelopes.map((env, idx) => (
                    <View key={idx} className="flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-medium"
                        placeholder={`Envelope #${idx + 1}`}
                        placeholderTextColor="#71717A"
                        maxLength={32}
                        value={env}
                        onChangeText={(txt) =>
                          setEnvelopes((prev) => prev.map((v, i) => (i === idx ? txt : v)))
                        }
                      />
                      {envelopes.length > 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            setEnvelopes((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-2"
                        >
                          <Icon name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {envelopes.length < MAX_ENVELOPES && (
                  <TouchableOpacity
                    onPress={() => setEnvelopes((prev) => [...prev, ''])}
                    className="flex-row items-center justify-center gap-1.5 py-3 border border-dashed border-primary/50 rounded-2xl"
                  >
                    <Icon name="add-circle-outline" size={18} color="#00C08B" />
                    <Text className="text-primary dark:text-[#00C08B] font-bold text-sm">
                      Add Envelope
                    </Text>
                  </TouchableOpacity>
                )}

                <View className="flex-row items-center justify-between bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-charcoal dark:text-white font-semibold text-sm">
                      Auto-propose confirm_link
                    </Text>
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs">
                      Submit the link proposal right after staging
                    </Text>
                  </View>
                  <Switch
                    value={proposeLinkNow}
                    onValueChange={setProposeLinkNow}
                    trackColor={{ false: '#3A3A3C', true: '#00C08B' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-4 gap-2">
                  <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">
                    Review
                  </Text>
                  <View className="flex-row justify-between">
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs">Name</Text>
                    <Text className="text-charcoal dark:text-white text-xs font-bold">
                      {trimmedName}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs">DAO</Text>
                    <Text className="text-primary dark:text-[#00C08B] text-xs font-mono font-bold">
                      {previewDaoId}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted dark:text-[#A1A1AA] text-xs">Envelopes</Text>
                    <Text className="text-charcoal dark:text-white text-xs font-bold">
                      {cleanEnvelopes.length}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View className="px-4 pb-6 pt-3 border-t border-border/50 dark:border-white/10 gap-2">
            {step < 2 ? (
              <TouchableOpacity
                className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${
                  canNext ? 'bg-primary' : 'bg-primary/25 dark:bg-[#00C08B]/20'
                }`}
                disabled={!canNext}
                onPress={() => canNext && setStep((s) => s + 1)}
              >
                <Text
                  className={`font-bold text-base ${
                    canNext ? 'text-black' : 'text-black/40 dark:text-[#00C08B]/50'
                  }`}
                >
                  Next
                </Text>
                <Icon
                  name="arrow-forward"
                  size={18}
                  color={canNext ? '#000000' : '#00C08B'}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${
                  !step2Valid || repBlocked || isPending
                    ? 'bg-primary/35'
                    : 'bg-primary'
                }`}
                disabled={!step2Valid || repBlocked || isPending}
                onPress={handleCreate}
              >
                <Icon name="checkmark-circle-outline" size={18} color="#000000" />
                <Text className="text-black font-bold text-base">
                  {mode === 'create'
                    ? 'Deploy DAO & Create Community'
                    : 'Create & Stage Community'}
                </Text>
              </TouchableOpacity>
            )}

            {step > 0 && !isPending && (
              <TouchableOpacity
                className="py-2.5 items-center"
                onPress={() => setStep((s) => s - 1)}
              >
                <Text className="text-muted dark:text-[#A1A1AA] text-sm font-semibold">
                  Back
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
