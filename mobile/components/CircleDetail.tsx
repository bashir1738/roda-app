import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AjoPot } from './AjoPot';
import { TxStateView } from './TxStateView';
import { InviteModal } from './InviteModal';
import { useContribute } from '../hooks/useContribute';
import { useClaim } from '../hooks/useClaim';
import { useCircles } from '../hooks/useCircles';
import { useWallet } from '../providers/WalletContext';
import type { CircleData } from '../hooks/useCircles';
import { Icon } from './Icon';
import { resolveRecipient } from '../lib/recipient';

function fmtAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 0 });
}
function fmtPayoutTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
function fmtPayoutDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function MemberRow({ addr, position, isNext, isMe, hasPaid, displayName }: {
  addr: string; position: number; isNext: boolean; isMe: boolean;
  hasPaid: boolean; displayName?: string | null;
}) {
  const display = displayName ?? fmtAddr(addr);
  const label = isMe ? `${display} (You)` : display;

  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-border dark:border-white/10">
      <View className="w-10 h-10 rounded-full bg-primary/15 dark:bg-white/10 border border-primary/20 dark:border-white/20 items-center justify-center">
        <Text className="text-primary dark:text-[#00C08B] text-sm font-black">{position}</Text>
      </View>
      <View className="flex-1">
        <Text

          className={`text-sm font-semibold font-mono ${isMe ? 'text-primary dark:text-white' : 'text-charcoal dark:text-white'}`}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {hasPaid && (
          <View className="bg-green-100 dark:bg-green-900/30 rounded-lg px-2 py-1">
            <Icon name="checkmark" size={14} color="#16A34A" />
          </View>
        )}
        {isNext && (
          <View className="flex-row items-center gap-1 bg-accent px-2 py-0.5 rounded-lg">
            <Icon name="star" size={10} color="#00C08B" />
            <Text className="text-primary text-[11px] font-bold">Next</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function CircleDetail({ circle: passedCircle, visible, onClose }: {
  circle: CircleData; visible: boolean; onClose: () => void;
}) {
  const { address } = useWallet();
  const contribute = useContribute();
  const claim = useClaim();
  const [showInvite, setShowInvite] = useState(false);
  const [memberNames, setMemberNames] = useState<Record<string, string | null>>({});
  // Live copy from the circles query: refetches after every successful tx, so
  // pool/round stats update instead of freezing on the value passed in.
  const { circles } = useCircles();
  const circle = circles.find((c) => c.address === passedCircle.address) ?? passedCircle;

  useEffect(() => {
    let cancelled = false;
    Promise.all(circle.members.map(async (member) => {
      try {
        const resolved = await resolveRecipient(member);
        return [member, resolved.name ?? null] as const;
      } catch {
        return [member, null] as const;
      }
    })).then((entries) => {
      if (!cancelled) setMemberNames(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [circle.members]);

  const roundTarget = circle.contributionAmount * BigInt(Math.max(circle.members.length, 1));
  const fillPercent = roundTarget > 0n
    ? Math.min(100, Number((circle.poolBalance * 100n) / roundTarget))
    : 0;
  const isRecipient = circle.isMyTurn;
  const payoutReady = circle.payoutReady;
  const canContribute =
    circle.status === 1 &&
    circle.members.length >= circle.maxMembers &&
    !circle.payoutPending &&
    circle.myPosition >= 0 &&
    circle.myPaidRound !== circle.currentRound;
  const isCreator = !!address && circle.members[0] === address;
  const canInvite = isCreator && circle.status === 0 && circle.members.length < circle.maxMembers;
  const paidSet = new Set(circle.paid ?? []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white dark:bg-[#111111]">
        {/* Drag handle */}
        <View className="w-9 h-1 rounded-full bg-border self-center mt-3 mb-4" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="items-center px-6 pb-5">
            <Text className="text-charcoal dark:text-white text-xl font-black text-center">{circle.name}</Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-sm mt-1">
              {circle.members.length} members · Round {circle.currentRound}/{circle.totalRounds}
            </Text>
          </View>

          {/* Pot */}
          <View className="items-center py-5 bg-primary/5 rounded-2xl mx-4 mb-4">
            <AjoPot fillPercent={fillPercent} size={110} />
            <Text className="text-muted dark:text-[#A1A1AA] text-xs mt-2">{Math.round(fillPercent)}% funded this round</Text>
          </View>

          {/* Stats */}
          <View className="flex-row bg-white dark:bg-[#111111] border border-border dark:border-white/10 mx-4 rounded-2xl p-4 mb-4">
            {[
              { label: 'Pool Balance', value: `$${fmtUSDC(circle.poolBalance)}` },
              { label: 'Your Position', value: circle.myPosition >= 0 ? `#${circle.myPosition + 1}` : '–' },
              { label: 'Next Payout', value: circle.nextPayoutTimestamp ? fmtPayoutDate(circle.nextPayoutTimestamp) : 'On activation' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View className="w-px bg-border dark:bg-white/10" />}
                <View className="flex-1 items-center">
                  <Text className="text-charcoal dark:text-white font-bold text-base">{s.value}</Text>
                  <Text className="text-muted dark:text-[#A1A1AA] text-[11px] mt-1">{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Members */}
          <View className="px-4 mb-4">
            <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
              Members & Queue
            </Text>
            {circle.members.map((m, i) => (
              <MemberRow
                key={m}
                addr={m}
                position={i + 1}
                isNext={i === (circle.currentRound % (circle.members.length || 1))}
                isMe={!!address && m === address}
                hasPaid={paidSet.has(m)}
                displayName={memberNames[m]}
              />
            ))}
          </View>

          {/* Tx states */}
          {contribute.txState !== 'idle' && (
            <TxStateView txState={contribute.txState} txHash={contribute.txHash}
              error={contribute.error} successMessage="Contribution confirmed!"
              onReset={contribute.reset} />
          )}
          {claim.txState !== 'idle' && (
            <TxStateView txState={claim.txState} txHash={claim.txHash}
              error={claim.error} successMessage="Payout claimed!"
              onReset={claim.reset} />
          )}
        </ScrollView>

        {/* Footer */}
        <View className="px-4 pb-6 pt-3 border-t border-border dark:border-white/10 bg-white dark:bg-[#111111] gap-3">
          {canInvite && (
            <TouchableOpacity
              className="bg-primary/10 dark:bg-[#00C08B]/15 border border-primary/20 dark:border-[#00C08B]/30 rounded-xl py-3.5 items-center flex-row justify-center gap-2 mt-1"
              onPress={() => setShowInvite(true)}
              accessibilityLabel="Invite members"
            >
              <Icon name="person-add-outline" size={17} color="#00C08B" />
              <Text className="text-primary dark:text-[#00C08B] font-bold">Invite Members</Text>
            </TouchableOpacity>
          )}
          {isRecipient && claim.txState === 'idle' && (
            <>
              {!payoutReady && (
                <Text className="text-primary dark:text-[#00C08B] text-center text-sm font-semibold">
                  {circle.paidCount < circle.maxMembers
                    ? `Waiting for members to contribute (${circle.paidCount}/${circle.maxMembers})`
                    : `Available to claim on ${fmtPayoutTime(circle.nextPayoutTimestamp)}`}
                </Text>
              )}
              <TouchableOpacity
                className={`${payoutReady ? 'bg-primary' : 'bg-primary/25 dark:bg-[#00C08B]/20'} rounded-xl py-4 items-center justify-center mt-1`}
                onPress={() => {
                  if (payoutReady) claim.claim({ type: 'circle', circleId: circle.id });
                }}
                disabled={!payoutReady}
                accessibilityLabel="Claim payout"
                accessibilityState={{ disabled: !payoutReady }}
              >
                <Text className={`font-bold text-base text-center ${payoutReady ? 'text-black' : 'text-black/40 dark:text-[#00C08B]/50'}`}>Claim</Text>
              </TouchableOpacity>
            </>
          )}
          {circle.status === 1 && circle.myPosition >= 0 && circle.myPaidRound === circle.currentRound && !isRecipient && (
            <View className="bg-primary/5 dark:bg-[#00C08B]/10 border border-primary/15 dark:border-[#00C08B]/20 rounded-xl px-4 py-3 mt-1">
              <Text className="text-primary dark:text-[#00C08B] text-center text-sm font-semibold">
                ✓ You contributed for round {circle.currentRound + 1}. Waiting for next round.
              </Text>
            </View>
          )}
          {canContribute && contribute.txState === 'idle' && (
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center flex-row justify-center gap-2 mt-1"
              onPress={() => contribute.contribute({
                circleId: circle.id, amountIn: circle.contributionAmount,
              })}
              accessibilityLabel="Contribute"
            >
              <Icon name="arrow-up-circle" size={18} color="#000000" />
              <Text className="text-black font-bold text-base">
                Contribute ${fmtUSDC(circle.contributionAmount)} USDC
              </Text>
            </TouchableOpacity>
          )}
          {circle.status === 0 && (
            <View className="bg-primary/5 dark:bg-[#00C08B]/10 border border-primary/15 dark:border-[#00C08B]/20 rounded-xl px-4 py-3 mt-1">
              <Text className="text-primary dark:text-[#00C08B] text-center text-sm font-semibold">
                Waiting for members ({circle.members.length}/{circle.maxMembers}). Contributions start when the circle is full.
              </Text>
            </View>
          )}
          <TouchableOpacity
            className="border border-border dark:border-white/10 rounded-full py-3.5 items-center"
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <Text className="text-charcoal dark:text-white font-semibold">Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      <InviteModal visible={showInvite} circle={circle} onClose={() => setShowInvite(false)} />
    </Modal>
  );
}
