import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { viewContract } from '../lib/contract';
import { isValidCircleCode } from '../lib/circleCode';
import { useJoinCircle } from '../hooks/useJoinCircle';
import { useWallet } from '../providers/WalletContext';
import { TxStateView } from './TxStateView';
import { Icon } from './Icon';

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

interface CirclePreview {
  name: string;
  maxMembers: number;
  memberCount: number;
  contributionAmount: bigint;
  /** 0 = active, 1 = completed. */
  statusRaw: number;
  members: string[];
}

export function JoinByIdModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { address } = useWallet();
  const [idInput, setIdInput] = useState('');
  const [circleId, setCircleId] = useState<number | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [joined, setJoined] = useState(false);

  const { joinCircle, txState, txHash, isPending, error: joinError, reset } = useJoinCircle();

  const parsedId = circleId !== null ? circleId : -1;

  const { data: circleInfo, isLoading: infoLoading } = useQuery<CirclePreview | null>({
    queryKey: ['circle', parsedId],
    enabled: parsedId >= 0,
    staleTime: 30_000,
    queryFn: async () => {
      const info: any = await viewContract('get_circle', { circle_code: Math.max(0, parsedId) });
      if (!info) return null;
      return {
        name: info.name ?? '',
        maxMembers: Number(info.max_members),
        memberCount: Number(info.member_count),
        contributionAmount: BigInt(info.contribution_amount ?? 0),
        statusRaw: info.status === 'Completed' ? 1 : 0,
        members: info.members ?? [],
      };
    },
  });

  useEffect(() => {
    if (txState === 'success') setJoined(true);
  }, [txState]);

  const lookup = () => {
    const raw = idInput.trim();
    const n = parseInt(raw, 10);
    if (!/^\d{6}$/.test(raw) || !isValidCircleCode(n)) {
      setLookupError('Enter the 6-digit circle code (100000-999999).');
      return;
    }
    setLookupError('');
    setJoined(false);
    setCircleId(n);
  };

  const hasCircle = !!circleInfo;
  const name = circleInfo?.name ?? '';
  const maxMembers = circleInfo?.maxMembers ?? 0;
  const memberCount = circleInfo?.memberCount ?? 0;
  const contributionAmount = circleInfo?.contributionAmount ?? 0n;
  const isAlreadyMember = !!address && !!circleInfo?.members?.includes(address);
  const isRecruiting = circleInfo?.statusRaw === 0 && memberCount < maxMembers;
  const isFull = hasCircle && memberCount >= maxMembers;

  const handleJoin = () => {
    if (circleId === null) return;
    joinCircle(circleId);
  };

  const handleClose = () => {
    setIdInput('');
    setCircleId(null);
    setLookupError('');
    setJoined(false);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-white dark:bg-[#111111] px-5 pt-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-charcoal dark:text-white text-xl font-bold">Join a Circle</Text>
          <TouchableOpacity onPress={handleClose}>
            <Icon name="close" size={22} color="#6B6B6B" />
          </TouchableOpacity>
        </View>

        {/* Code input */}
        <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
          Circle Code
        </Text>
        <View className="flex-row gap-2 mb-1">
          <TextInput
            className="flex-1 bg-white dark:bg-[#1C1C1E] border rounded-2xl px-4 py-3 text-charcoal dark:text-white text-base font-semibold"
            style={{ borderColor: lookupError ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.15)' : '#BEEEDB') }}
            placeholder="e.g. 483920"
            placeholderTextColor={isDark ? '#A1A1AA' : '#9CA3AF'}
            keyboardType="number-pad"
            maxLength={6}
            value={idInput}
            onChangeText={(t) => { setIdInput(t); setLookupError(''); setCircleId(null); setJoined(false); }}
            returnKeyType="search"
            onSubmitEditing={lookup}
          />
          <TouchableOpacity
            className="bg-primary rounded-2xl px-5 items-center justify-center"
            onPress={lookup}
            disabled={!idInput.trim() || infoLoading}
            style={{ opacity: !idInput.trim() ? 0.4 : 1 }}
          >
            {infoLoading
              ? <ActivityIndicator size="small" color="#000000" />
              : <Text className="text-black font-bold">Look up</Text>}
          </TouchableOpacity>
        </View>
        {lookupError ? (
          <Text className="text-red-500 text-xs mb-4">{lookupError}</Text>
        ) : (
          <Text className="text-muted dark:text-[#A1A1AA] text-xs mb-6">
            Ask the circle creator to share their Circle code with you.
          </Text>
        )}

        {/* Lookup: id set but no circle there */}
        {!hasCircle && !infoLoading && circleId !== null && !joined && (
          <View className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/60 rounded-3xl p-4 flex-row items-center gap-3 mb-6">
            <Icon name="search-outline" size={20} color="#EA580C" />
            <Text className="text-orange-800 dark:text-orange-200 text-sm flex-1">
              No circle found with code {circleId}.
            </Text>
          </View>
        )}

        {/* Circle preview */}
        {hasCircle && !infoLoading && (
          <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-5 mb-6">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1">
                <Text className="text-charcoal dark:text-white text-lg font-bold">{name}</Text>
                <Text className="text-muted dark:text-[#A1A1AA] text-sm mt-0.5">
                  {memberCount} / {maxMembers} members
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: isRecruiting && !isFull
                    ? (isDark ? 'rgba(0,192,139,0.15)' : '#F0FDF4')
                    : (isDark ? 'rgba(234,88,12,0.15)' : '#FFF7ED'),
                  borderWidth: 1,
                  borderColor: isRecruiting && !isFull
                    ? (isDark ? 'rgba(0,192,139,0.3)' : 'transparent')
                    : (isDark ? 'rgba(234,88,12,0.3)' : 'transparent'),
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isRecruiting && !isFull ? '#00C08B' : '#EA580C' }}
                >
                  {isFull ? 'Full' : isRecruiting ? 'Open' : 'Active'}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs">Contribution</Text>
                <Text className="text-charcoal dark:text-white font-bold text-sm">
                  ${fmtUSDC(contributionAmount)} USDC
                </Text>
              </View>
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs">Spots left</Text>
                <Text className="text-charcoal dark:text-white font-bold text-sm">
                  {Math.max(0, maxMembers - memberCount)}
                </Text>
              </View>
            </View>

            {/* Slot bar */}
            <View className="flex-row gap-1 mt-4">
              {Array.from({ length: maxMembers }).map((_, i) => (
                <View
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ backgroundColor: i < memberCount ? '#00C08B' : 'rgba(255,255,255,0.12)' }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Tx feedback */}
        {txState !== 'idle' && !joined && (
          <TxStateView
            txState={txState}
            txHash={txHash}
            error={joinError}
            successMessage={`You've joined ${name}!`}
            onReset={reset}
          />
        )}

        {/* Success */}
        {joined && (
          <View className="bg-green-50 dark:bg-[#00C08B]/15 border border-green-200 dark:border-[#00C08B]/30 rounded-3xl p-4 items-center gap-2 mb-4">
            <Icon name="checkmark-circle" size={32} color="#00C08B" />
            <Text className="text-green-800 dark:text-white font-bold">You've joined {name}!</Text>
            <Text className="text-green-700 dark:text-[#A1A1AA] text-sm text-center">
              Head back to your circles to see it.
            </Text>
          </View>
        )}

        {/* Already a member */}
        {hasCircle && isAlreadyMember && !joined && (
          <View className="bg-primary/10 dark:bg-[#00C08B]/15 border border-primary/20 dark:border-[#00C08B]/30 rounded-3xl p-4 flex-row items-center gap-3">
            <Icon name="checkmark-circle-outline" size={20} color="#00C08B" />
            <Text className="text-primary dark:text-[#00C08B] text-sm font-semibold flex-1">
              You are already a member of this circle.
            </Text>
          </View>
        )}

        {/* Join button */}
        {hasCircle && isRecruiting && !isFull && !isAlreadyMember && !joined && txState === 'idle' && (
          <TouchableOpacity
            className="bg-primary rounded-full py-4 items-center flex-row justify-center gap-2"
            onPress={handleJoin}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <ActivityIndicator color="#000000" />
                <Text className="text-black font-bold">Confirm in wallet…</Text>
              </>
            ) : (
              <>
                <Icon name="people-outline" size={18} color="#000000" />
                <Text className="text-black font-bold text-base">Join Circle</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {hasCircle && (isFull || !isRecruiting) && !isAlreadyMember && !joined && (
          <View className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-3xl p-4 flex-row items-center gap-3">
            <Icon name="information-circle-outline" size={20} color="#EA580C" />
            <Text className="text-orange-800 text-sm flex-1">
              {isFull ? 'This circle is full.' : 'This circle is no longer recruiting.'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
