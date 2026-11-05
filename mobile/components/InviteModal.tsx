import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, Share, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { resolveRecipient } from '../lib/recipient';
function fmtAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
import type { CircleData } from '../hooks/useCircles';
import { Icon } from './Icon';

function storageKey(circleId: number) {
  return `roda_invites_${circleId}`;
}

async function loadInvites(circleId: number): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(circleId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveInvites(circleId: number, list: string[]) {
  await AsyncStorage.setItem(storageKey(circleId), JSON.stringify(list));
}

function InvitedRow({ addr, onRemove }: { addr: string; onRemove: () => void }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    resolveRecipient(addr)
      .then((resolved) => setName(resolved.name ?? null))
      .catch(() => {});
  }, [addr]);

  return (
    <View className="flex-row items-center gap-3 py-2.5 border-b border-border dark:border-white/10">
      <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
        <Icon name="person-outline" size={15} color="#00C08B" />
      </View>
      <View className="flex-1">
        <Text className="text-charcoal dark:text-white text-sm font-semibold font-mono" numberOfLines={1}>
          {name ?? fmtAddr(addr)}
        </Text>
      </View>
      <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
        <View className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-semibold">Pending</Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close-circle-outline" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

interface Props {
  visible: boolean;
  circle: CircleData;
  onClose: () => void;
}

export function InviteModal({ visible, circle, onClose }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [input, setInput]       = useState('');
  const [invites, setInvites]   = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    if (visible) loadInvites(circle.id).then(setInvites);
  }, [visible, circle.id]);

  const addInvite = useCallback(async () => {
    const value = input.trim();
    let addr: string;
    try {
      addr = (await resolveRecipient(value)).address.toBase58();
    } catch {
      setInputError('Enter a valid NEAR account ID');
      return;
    }
    if (circle.members.includes(addr)) {
      setInputError('This address is already a member');
      return;
    }
    if (invites.includes(addr)) {
      setInputError('Already in your invite list');
      return;
    }
    setInputError('');
    setLoading(true);
    const updated = [...invites, addr];
    await saveInvites(circle.id, updated);
    setInvites(updated);
    setInput('');
    setLoading(false);
  }, [input, invites, circle.members, circle.id]);

  const removeInvite = useCallback(async (addr: string) => {
    const updated = invites.filter((i) => i !== addr);
    await saveInvites(circle.id, updated);
    setInvites(updated);
  }, [invites, circle.id]);

  const shareInvite = async () => {
    try {
      await Share.share({
        message:
          `You've been invited to join my Roda savings circle!\n\n` +
          `Circle: ${circle.name}\n` +
          `Contribution: $${(Number(circle.contributionAmount) / 1_000_000).toFixed(0)} USDC per round\n` +
          `Members: ${circle.members.length}/${circle.maxMembers}\n\n` +
          `Circle code: ${circle.id}\n\n` +
          `Download the Roda app here:\nhttps://roda-lime.vercel.app/\n\n` +
          `Once installed, tap "Join" and enter the Circle code above.`,
      });
    } catch {}
  };

  const spotsLeft = circle.maxMembers - circle.members.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white dark:bg-[#111111]">
        <View className="w-9 h-1 rounded-full bg-border dark:bg-white/20 self-center mt-3 mb-1" />

        {/* Header */}
        <View className="px-5 py-4 border-b border-border dark:border-white/10 flex-row items-center justify-between">
          <View>
            <Text className="text-charcoal dark:text-white text-lg font-black">Invite Members</Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-sm mt-0.5">
              {circle.name} · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color="#6B6B6B" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pt-5 pb-10" showsVerticalScrollIndicator={false}>

          {/* Share card */}
          <TouchableOpacity
            className="bg-primary rounded-2xl p-4 mb-6 flex-row items-center gap-3"
            onPress={shareInvite}
            accessibilityLabel="Share invite"
          >
            <View className="w-10 h-10 rounded-full bg-white dark:bg-white/15 items-center justify-center">
              <Icon name="share-social-outline" size={20} color="#000000" />
            </View>
            <View className="flex-1">
              <Text className="text-black font-bold text-sm">Share Invite Link</Text>
              <Text className="text-black/70 text-xs mt-0.5">
                Circle code: {circle.id} · Share via WhatsApp, SMS, etc.
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(0,0,0,0.5)" />
          </TouchableOpacity>

          {/* Add by wallet address */}
          <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-3">
            Add by NEAR account ID
          </Text>
          <View className="flex-row gap-2 mb-1">
            <TextInput
              className="flex-1 bg-white dark:bg-[#1C1C1E] border rounded-xl px-4 py-3 text-charcoal dark:text-white text-sm font-mono"
              style={{ borderColor: inputError ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.15)' : '#BEEEDB') }}
              placeholder="account.testnet…"
              placeholderTextColor={isDark ? '#A1A1AA' : '#9CA3AF'}
              value={input}
              onChangeText={(t) => { setInput(t); setInputError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={addInvite}
            />
            <TouchableOpacity
              className="bg-primary rounded-xl px-4 items-center justify-center"
              onPress={addInvite}
              disabled={!input.trim() || loading}
              style={{ opacity: !input.trim() ? 0.4 : 1 }}
            >
              {loading
                ? <ActivityIndicator size="small" color="#000000" />
                : <Icon name="add" size={22} color="#000000" />}
            </TouchableOpacity>
          </View>
          {inputError ? (
            <Text className="text-red-500 text-xs mb-3">{inputError}</Text>
          ) : (
            <Text className="text-muted dark:text-[#A1A1AA] text-xs mb-3">
              Enter a NEAR account ID. They'll join using the Circle code you share.
            </Text>
          )}

          {/* Invited list */}
          {invites.length > 0 && (
            <>
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mt-4 mb-2">
                Invited ({invites.length})
              </Text>
              {invites.map((addr) => (
                <InvitedRow
                  key={addr}
                  addr={addr}
                  onRemove={() => removeInvite(addr)}
                />
              ))}
            </>
          )}

          {/* Existing members */}
          <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mt-6 mb-2">
            Current Members ({circle.members.length})
          </Text>
          {circle.members.map((m, i) => (
            <View key={m} className="flex-row items-center gap-3 py-2 border-b border-border dark:border-white/10">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                <Text className="text-black text-xs font-bold">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-charcoal dark:text-white text-sm font-mono" numberOfLines={1}>
                {fmtAddr(m)}
              </Text>
              {i === 0 && (
                <Text className="text-xs text-primary dark:text-[#00C08B] font-semibold">Creator</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
