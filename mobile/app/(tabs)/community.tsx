import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

import { formatShares, formatUsdc } from '../../constants/roda';
import { useCommunities, lookupCommunityByIdOrDao, type CommunityData } from '../../hooks/useCommunities';
import { useRefresh } from '../../hooks/useRefresh';
import { useWallet } from '../../providers/WalletContext';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { ProfileButton } from '../../components/ProfileSidebar';
import { ReputationPill } from '../../components/ReputationBadge';
import { CircleCardSkeleton } from '../../components/Skeleton';
import { Icon } from '../../components/Icon';
import { friendlyError } from '../../lib/sendTx';
import { InlineErrorBanner } from '../../components/InlineErrorBanner';

export default function CommunityTab() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    address,
    isConnected,
    connect,
    walletKind,
    externalKeyScope,
    connectNearWallet,
  } = useWallet();
  const { openSidebar } = useProfileSidebar();
  const { communities, isLoading } = useCommunities();
  const { refreshing, refresh } = useRefresh();

  const [query, setQuery] = useState('');
  const [lookupVisible, setLookupVisible] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<CommunityData | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.daoId.toLowerCase().includes(q) ||
        String(c.id) === q,
    );
  }, [communities, query]);

  const handleLookup = async () => {
    const trimmed = lookupInput.trim();
    if (!trimmed) return;
    setLookupBusy(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const found = await lookupCommunityByIdOrDao(trimmed);
      if (!found) {
        setLookupError(
          `We couldn't find a community matching "${trimmed}". Check the community ID or full DAO address.`,
        );
      } else {
        setLookupResult(found);
      }
    } catch (e) {
      setLookupError(friendlyError(e));
    } finally {
      setLookupBusy(false);
    }
  };

  const openCommunity = (id: number) => {
    router.push({ pathname: '/community/[id]', params: { id: String(id) } });
  };

  return (
    <View className="flex-1 bg-[#FDFBF7] dark:bg-[#111111]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-3 pb-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text className="text-charcoal dark:text-white text-3xl font-bold tracking-tight mt-2">
                Community
              </Text>
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-medium mt-0.5">
                Sputnik DAOs · Shared Budgets · Collective Shares
              </Text>
            </View>
            <View className="flex-row items-center gap-2.5 mt-1">
              <TouchableOpacity
                className="h-10 rounded-full bg-border/20 dark:bg-white/10 px-3.5 items-center justify-center flex-row gap-1.5"
                onPress={() => {
                  setLookupInput('');
                  setLookupError(null);
                  setLookupResult(null);
                  setLookupVisible(true);
                }}
                accessibilityLabel="Find community by ID or DAO"
              >
                <Icon name="search-outline" size={17} color="#00C08B" />
                <Text className="text-primary dark:text-[#00C08B] font-bold text-xs">Find</Text>
              </TouchableOpacity>
              <ProfileButton onPress={openSidebar} />
            </View>
          </View>

          {isConnected && address && (
            <View className="flex-row items-center justify-between mt-3">
              <ReputationPill account={address} />
              <TouchableOpacity
                onPress={() => router.push('/community/create')}
                className="flex-row items-center gap-1 bg-primary/10 dark:bg-[#00C08B]/15 border border-primary/20 dark:border-[#00C08B]/30 px-3 py-1 rounded-full"
              >
                <Icon name="add-circle-outline" size={14} color="#00C08B" />
                <Text className="text-primary dark:text-[#00C08B] text-xs font-bold">New DAO</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Meteor contract-scoped key warning */}
          {isConnected && walletKind === 'meteor' && externalKeyScope === 'contract' && (
            <TouchableOpacity
              onPress={() => connectNearWallet('meteor', 'full').catch(() => {})}
              activeOpacity={0.85}
              className="mt-3 flex-row items-center gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-3.5 py-2.5"
            >
              <Icon name="warning-outline" size={18} color="#F59E0B" />
              <Text className="flex-1 text-amber-900 dark:text-amber-200 text-xs font-medium">
                Meteor signed in with Roda-only key. Tap to enable Sputnik DAO & USDC signing.
              </Text>
              <Icon name="chevron-forward" size={15} color="#F59E0B" />
            </TouchableOpacity>
          )}

          {/* Search bar */}
          {isConnected && communities.length > 0 && (
            <View
              className="flex-row items-center gap-2 mt-4 bg-white dark:bg-[#1C1C1E] rounded-full px-5 py-3.5 border border-border/50 dark:border-white/5"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <Icon name="search-outline" size={18} color="#6B6B6B" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Filter communities or DAO…"
                placeholderTextColor="#A1A1AA"
                className="flex-1 text-charcoal dark:text-white font-medium text-sm"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Icon name="close-circle" size={18} color="#6B6B6B" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Body */}
        <View className="flex-1 overflow-hidden">
          {!isConnected ? (
            <View className="flex-1 items-center justify-center gap-4 px-8">
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
                <Icon name="layers-outline" size={38} color="#00C08B" />
              </View>
              <Text className="text-charcoal dark:text-white font-bold text-2xl text-center">
                Community Treasuries
              </Text>
              <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center leading-5">
                Launch a Sputnik DAO treasury in one tap, enforce shared budget envelopes on Roda,
                run bounties, and track collective shares.
              </Text>
              <TouchableOpacity
                className="mt-2 bg-primary px-8 py-4 rounded-full"
                onPress={connect}
              >
                <Text className="text-black font-bold text-base">Connect Wallet</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <ScrollView className="flex-1 px-5 pt-3" showsVerticalScrollIndicator={false}>
              <CircleCardSkeleton />
              <CircleCardSkeleton />
            </ScrollView>
          ) : (
            <ScrollView
              className="flex-1 px-5"
              contentContainerClassName="pb-28 pt-2"
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
              {communities.length === 0 ? (
                <View className="items-center justify-center py-12 px-4 bg-white dark:bg-[#1C1C1E] border border-border/50 dark:border-white/5 rounded-3xl mt-4">
                  <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
                    <Icon name="layers" size={38} color="#00C08B" />
                  </View>
                  <Text className="text-charcoal dark:text-white font-bold text-xl text-center">
                    No communities yet
                  </Text>
                  <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center leading-5 mt-2 mb-6">
                    Create a community backed by Sputnik DAO + Trezu and manage shared budget envelopes on-chain.
                  </Text>
                  <TouchableOpacity
                    className="bg-primary px-8 py-4 rounded-full flex-row items-center gap-2"
                    onPress={() => router.push('/community/create')}
                  >
                    <Icon name="add" size={20} color="#000000" />
                    <Text className="text-black font-bold text-base">Create Community</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="mt-4 py-2 px-4"
                    onPress={() => setLookupVisible(true)}
                  >
                    <Text className="text-primary dark:text-[#00C08B] text-sm font-bold">
                      Or find a community by ID / DAO
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : filtered.length === 0 ? (
                <View className="items-center py-16 px-6">
                  <Icon name="search-outline" size={40} color="#00C08B" />
                  <Text className="text-charcoal dark:text-white font-bold text-lg mt-3">
                    No matching communities
                  </Text>
                  <TouchableOpacity onPress={() => setQuery('')} className="mt-3">
                    <Text className="text-primary font-bold text-sm">Clear filter</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filtered.map((c) => {
                  const totalEscrow = c.poolUnallocated + c.totalAllocatedRemaining;
                  const activeEnvs = c.envelopes.filter((e) => e.active).length;

                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => openCommunity(c.id)}
                      activeOpacity={0.78}
                      className="bg-white dark:bg-[#1C1C1E] border border-border/50 dark:border-white/5 rounded-3xl p-5 mb-4"
                      style={{
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.04,
                        shadowRadius: 12,
                        elevation: 2,
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row items-center gap-3 flex-1 pr-2">
                          <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
                            <Icon name="business-outline" size={22} color="#00C08B" />
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-charcoal dark:text-white font-bold text-lg"
                              numberOfLines={1}
                            >
                              {c.name}
                            </Text>
                            <Text
                              className="text-muted dark:text-[#A1A1AA] text-xs font-mono"
                              numberOfLines={1}
                            >
                              #{c.id} · {c.daoId}
                            </Text>
                          </View>
                        </View>

                        <View
                          className="px-2.5 py-1 rounded-full border"
                          style={{
                            backgroundColor: c.dissolved
                              ? (isDark ? 'rgba(245,158,11,0.16)' : '#FFFBEB')
                              : c.linked
                                ? (isDark ? 'rgba(0,192,139,0.16)' : '#F0FDF4')
                                : (isDark ? 'rgba(234,88,12,0.16)' : '#FFF7ED'),
                            borderColor: c.dissolved
                              ? 'rgba(245,158,11,0.35)'
                              : c.linked
                                ? 'rgba(0,192,139,0.35)'
                                : 'rgba(234,88,12,0.35)',
                          }}
                        >
                          <Text
                            className="text-[11px] font-bold"
                            style={{
                              color: c.dissolved
                                ? '#F59E0B'
                                : c.linked
                                  ? '#00C08B'
                                  : '#EA580C',
                            }}
                          >
                            {c.dissolved ? 'Dissolved' : c.linked ? 'Linked' : 'Link Pending'}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row justify-between bg-[#F8F9FA] dark:bg-white/10 rounded-2xl p-3.5">
                        <View>
                          <Text className="text-muted dark:text-[#A1A1AA] text-[11px] font-medium">
                            Escrow Funds
                          </Text>
                          <Text className="text-primary dark:text-[#00C08B] font-bold text-base mt-0.5">
                            ${formatUsdc(totalEscrow)}
                          </Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-muted dark:text-[#A1A1AA] text-[11px] font-medium">
                            Envelopes
                          </Text>
                          <Text className="text-charcoal dark:text-white font-bold text-base mt-0.5">
                            {activeEnvs} active
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-muted dark:text-[#A1A1AA] text-[11px] font-medium">
                            Shares
                          </Text>
                          <Text className="text-charcoal dark:text-white font-bold text-base mt-0.5">
                            {formatShares(c.totalShares)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>

        {/* FAB */}
        {isConnected && communities.length > 0 && (
          <TouchableOpacity
            className="absolute right-6 bottom-28 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-xl"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
            onPress={() => router.push('/community/create')}
            accessibilityLabel="Create community"
          >
            <Icon name="add" size={32} color="#000000" />
          </TouchableOpacity>
        )}

        {/* Lookup Modal */}
        <Modal
          visible={lookupVisible}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={() => setLookupVisible(false)}
        >
          <View className="flex-1 bg-[#FDFBF7] dark:bg-[#111111] px-5 pt-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-charcoal dark:text-white text-xl font-bold">
                Find Community
              </Text>
              <TouchableOpacity onPress={() => setLookupVisible(false)}>
                <Icon name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-2">
              Community ID or Sputnik DAO Account
            </Text>
            <View className="flex-row gap-2 mb-3">
              <TextInput
                className="flex-1 bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-2xl px-4 py-3 text-charcoal dark:text-white text-sm font-medium"
                placeholder="e.g. 1 or lagos-dao.sputnikv2.testnet"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                value={lookupInput}
                onChangeText={(t) => {
                  setLookupInput(t);
                  setLookupError(null);
                  setLookupResult(null);
                }}
                onSubmitEditing={handleLookup}
              />
              <TouchableOpacity
                className="bg-primary rounded-2xl px-5 items-center justify-center"
                onPress={handleLookup}
                disabled={!lookupInput.trim() || lookupBusy}
                style={{ opacity: !lookupInput.trim() ? 0.45 : 1 }}
              >
                {lookupBusy ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text className="text-black font-bold">Look up</Text>
                )}
              </TouchableOpacity>
            </View>

            {lookupError ? (
              <View className="mb-4">
                <InlineErrorBanner
                  error={lookupError}
                  category="validation"
                  onDismiss={() => setLookupError(null)}
                />
              </View>
            ) : null}

            {lookupResult && (
              <View className="bg-white dark:bg-[#1C1C1E] border border-border dark:border-white/10 rounded-3xl p-5">
                <Text className="text-charcoal dark:text-white text-lg font-bold">
                  {lookupResult.name}
                </Text>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-mono mt-1 mb-4">
                  #{lookupResult.id} · {lookupResult.daoId}
                </Text>
                <TouchableOpacity
                  className="bg-primary rounded-full py-3.5 items-center"
                  onPress={() => {
                    const id = lookupResult.id;
                    setLookupVisible(false);
                    openCommunity(id);
                  }}
                >
                  <Text className="text-black font-bold">Open Community Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
