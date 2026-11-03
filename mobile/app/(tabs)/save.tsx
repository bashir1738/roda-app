import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VaultCard } from '../../components/VaultCard';
import { DepositModal } from '../../components/DepositModal';
import { PayoutSheet } from '../../components/PayoutSheet';
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { useVaults, type VaultData } from '../../hooks/useVaults';
import { useWallet } from '../../providers/WalletContext';
import { VAULT_TIERS, type VaultTier } from '../../hooks/useVaults';
import { useRefresh } from '../../hooks/useRefresh';
import Svg, { LinearGradient, Stop, Rect, Path, Defs } from 'react-native-svg';
import { Icon } from '../../components/Icon';

const TIER_KEYS: VaultTier[] = ['Flex', 'Weekly', 'Monthly', '6 Months', '1 Year'];
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export default function SaveTab() {
  const { isConnected } = useWallet();
  const { vaults, isLoading } = useVaults();
  const { openSidebar } = useProfileSidebar();
  const { refreshing, refresh } = useRefresh();
  const [depositTier, setDepositTier] = useState<VaultTier | null>(null);
  const [claimVault, setClaimVault] = useState<VaultData | null>(null);

  const totalBalance = vaults.reduce((s, v) => s + v.currentBalanceUSDC, 0n);

  return (
    <View className="flex-1 bg-[#FDFBF7] dark:bg-[#121212]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-3 pb-2">
          <View className="flex-row justify-end items-center mb-6">
            <ProfileButton onPress={openSidebar} />
          </View>

          {/* Portfolio Overview */}
          <View className="items-center mb-6">
            <Text className="text-muted dark:text-[#A1A1AA] text-sm font-bold uppercase tracking-wider mb-2">Total Savings</Text>
            <Text className="text-charcoal dark:text-white text-5xl font-bold tracking-tighter">
              ${fmtUSDC(totalBalance)}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#421F6D" colors={['#421F6D']} />
          }
        >
          {/* Deck Layout for Vaults */}
          <View className="mt-2">
            <View className="px-5 mb-4 flex-row justify-between items-end">
              <Text className="text-charcoal dark:text-white text-xl font-bold tracking-tight">Open a Vault</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5"
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {TIER_KEYS.map((key, i) => {
                const t = VAULT_TIERS[key];
                const gradients: Record<VaultTier, string[]> = {
                  Flex: ['#FFFFFF', '#FDFBF7'],
                  Weekly: ['#421F6D', '#2B1448'],
                  Monthly: ['#111827', '#000000'],
                  '6 Months': ['#0F766E', '#042F2E'],
                  '1 Year': ['#92400E', '#451A03'],
                };
                const isDarkCard = key !== 'Flex';
                const grad = gradients[key];

                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.9}
                    onPress={() => setDepositTier(key)}
                    style={{ width: CARD_WIDTH, height: 200, marginRight: 16, borderRadius: 30, overflow: 'hidden', elevation: 5, shadowColor: '#421F6D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 }}
                  >
                    <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
                      <Defs>
                        <LinearGradient id={`grad-${key}`} x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0" stopColor={grad[0]} />
                          <Stop offset="1" stopColor={grad[1]} />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill={`url(#grad-${key})`} />
                      <Path d="M 0 100 Q 150 0 300 150 L 300 200 L 0 200 Z" fill="#FFFFFF" opacity={0.03} />
                    </Svg>
                    
                    <View className="p-6 flex-1 justify-between">
                      <View className="flex-row justify-between items-start">
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isDarkCard ? 'bg-white/10' : 'bg-primary/10'}`}>
                          <Icon name={t.icon as any} size={24} color={isDarkCard ? '#FFFFFF' : '#421F6D'} />
                        </View>
                        {key === 'Weekly' && (
                          <View className="bg-[#10B981] px-3 py-1 rounded-full">
                            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Popular</Text>
                          </View>
                        )}
                      </View>
                      <View>
                        <Text className={`text-3xl font-bold tracking-tight mb-1 ${isDarkCard ? 'text-white' : 'text-charcoal'}`}>{key}</Text>
                        <Text className={`text-sm font-medium ${isDarkCard ? 'text-white/70' : 'text-muted'}`}>
                          {t.lockDays > 0 ? `${t.lockDays}-day lock` : 'Withdraw anytime'} • Min ${t.minUSDC}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Active vaults */}
          {isConnected && (
            <View className="mt-8 px-5">
              <Text className="text-charcoal dark:text-white text-xl font-bold tracking-tight mb-4">Your Vaults</Text>
              {isLoading ? (
                <ActivityIndicator color="#421F6D" />
              ) : vaults.length === 0 ? (
                <View className="items-center py-12 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-border/50 dark:border-white/5 shadow-sm">
                  <Icon name="leaf-outline" size={40} color="#D4C4E8" />
                  <Text className="text-muted dark:text-[#A1A1AA] text-base font-medium mt-3">No active vaults</Text>
                </View>
              ) : (
                vaults.map((v) => <VaultCard key={v.id} vault={v} onClaim={() => setClaimVault(v)} />)
              )}
            </View>
          )}
        </ScrollView>

        {depositTier && (
          <DepositModal tier={depositTier} visible={!!depositTier} onClose={() => setDepositTier(null)} />
        )}
        {claimVault && (
          <PayoutSheet
            target={{
              type: 'vault',
              vaultId: claimVault.id,
              availableUSDC: claimVault.currentBalanceUSDC,
              label: `${claimVault.tierKey} Vault #${claimVault.id}`,
            }}
            visible={!!claimVault}
            onClose={() => setClaimVault(null)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
