import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WalletButton } from '../../components/WalletButton';
import { CircleDetail } from '../../components/CircleDetail';
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { useCircles, type CircleData } from '../../hooks/useCircles';
import { useWallet } from '../../providers/WalletContext';
import { useRefresh } from '../../hooks/useRefresh';
import { useFundWallet } from '../../hooks/useFundWallet';
import { useColorScheme } from 'nativewind';
import { SendSheet } from '../../components/SendSheet';
import { DepositModal } from '../../components/DepositModal';
import { CreateCircleWizard } from '../../components/CreateCircleWizard';
import { useCreateCircle } from '../../hooks/useCreateCircle';
import { Icon } from '../../components/Icon';

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

/** Greeting based on the device's local timezone. */
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeTab() {
  const { isConnected, connect, address } = useWallet();
  const { circles, isLoading } = useCircles();
  const { createCircle, createdCode, txState, txHash, error, reset, isSuccess } = useCreateCircle();
  const { openSidebar } = useProfileSidebar();
  const { refreshing, refresh } = useRefresh();
  
  const [selected, setSelected] = useState<CircleData | null>(null);
  const [balanceHidden, setBalanceHidden] = useState(false);
  
  // Modals for Quick Actions
  const [showSend, setShowSend] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useFundWallet(address);

  const totalSaved = circles.reduce((s, c) => s + c.poolBalance, 0n);
  const pendingPayouts = circles.filter((c) => c.payoutPending && c.myPosition === c.currentRound);

  return (
    <View className="flex-1 bg-[#FDFBF7] dark:bg-[#121212]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* ── Top bar ── */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-1">
          <Text className="text-charcoal dark:text-white font-bold text-xl">{greeting()}</Text>
          <View className="flex-row items-center gap-3">
            <WalletButton />
            <ProfileButton onPress={openSidebar} />
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
          {/* ── Balance Section ── */}
          <View className="px-5 pt-8 mb-8 items-center">
            <View className="mb-2">
              <Text className="text-muted dark:text-[#A1A1AA] font-bold text-xs uppercase tracking-wider text-center">Total Balance</Text>
            </View>
            
            <View className="flex-row items-center justify-center gap-3">
              <Text className="font-display text-charcoal dark:text-white text-5xl text-center">
                {balanceHidden ? '••••••' : `$${fmtUSDC(totalSaved)}`}
              </Text>
              <TouchableOpacity onPress={() => setBalanceHidden((h) => !h)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name={balanceHidden ? 'eye-off-outline' : 'eye-outline'} size={24} color={isDark ? '#8E8E93' : '#6B6B6B'} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions (Modals) */}
            <View className="flex-row justify-between gap-3 mt-8 self-stretch">
              <TouchableOpacity 
                className="flex-1 bg-white dark:bg-[#1C1C1E] items-center py-3.5 rounded-2xl "
                style={{ shadowColor: '#421F6D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
                onPress={() => setShowDeposit(true)}
              >
                <View className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-white/10 items-center justify-center mb-2">
                  <Icon name="leaf" size={20} color={isDark ? '#FFFFFF' : '#421F6D'} />
                </View>
                <Text className="text-charcoal dark:text-white font-bold text-xs">Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 bg-white dark:bg-[#1C1C1E] items-center py-3.5 rounded-2xl"
                style={{ shadowColor: '#421F6D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
                onPress={() => setShowSend(true)}
              >
                <View className="w-11 h-11 rounded-xl bg-border/50 dark:bg-white/10 items-center justify-center mb-2">
                  <Icon name="send" size={20} color={isDark ? '#FFFFFF' : '#16141a'} />
                </View>
                <Text className="text-charcoal dark:text-white font-bold text-xs">Send</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-1 bg-white dark:bg-[#1C1C1E] items-center py-3.5 rounded-2xl"
                style={{ shadowColor: '#421F6D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
                onPress={() => setShowCreate(true)}
              >
                <View className="w-11 h-11 rounded-xl bg-border/50 dark:bg-white/10 items-center justify-center mb-2">
                  <Icon name="people" size={20} color={isDark ? '#FFFFFF' : '#16141a'} />
                </View>
                <Text className="text-charcoal dark:text-white font-bold text-xs">New Circle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Recent Activity ── */}
          <View className="px-5 mt-2 flex-1">
            <View className="mb-4">
              <Text className="text-charcoal dark:text-white text-xl font-bold tracking-tight">Recent Activity</Text>
            </View>

            {/* Payout alert */}
            {pendingPayouts.length > 0 && (
              <TouchableOpacity
                className="flex-row items-center justify-between bg-[#10B981]/10 px-5 py-4 rounded-3xl mb-4"
                onPress={() => setSelected(pendingPayouts[0])}
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-2xl bg-[#10B981]/20 items-center justify-center">
                    <Icon name="gift" size={24} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-charcoal dark:text-white font-bold text-base">{pendingPayouts[0].name}</Text>
                    <Text className="text-[#10B981] font-bold text-[13px]">Payout ready to claim</Text>
                  </View>
                </View>
                <Text className="text-[#10B981] font-bold text-xl">+${fmtUSDC(pendingPayouts[0].poolBalance)}</Text>
              </TouchableOpacity>
            )}

            {!isConnected ? (
              <View className="items-center py-10 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-border/50 dark:border-white/5">
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
                  <Icon name="log-in" size={32} color="#421F6D" />
                </View>
                <Text className="text-charcoal dark:text-white font-bold text-lg">Sign in to get started</Text>
                <TouchableOpacity className="bg-primary rounded-full px-8 py-3.5 mt-4 shadow-sm" onPress={connect}>
                  <Text className="text-white font-bold text-sm">Sign in</Text>
                </TouchableOpacity>
              </View>
            ) : isLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator color="#421F6D" />
              </View>
            ) : circles.length === 0 ? (
              <View className="items-center py-10 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-border/50 dark:border-white/5">
                <Text className="text-muted dark:text-[#A1A1AA] text-sm font-bold text-center">No recent activity.</Text>
              </View>
            ) : (
              <View className="flex-col gap-4">
                {[...circles]
                  .sort((a, b) => Number(b.id - a.id))
                  .slice(0, 5)
                  .map((c) => (
                    <TouchableOpacity 
                      key={c.id} 
                      className="flex-row items-center justify-between bg-white dark:bg-[#1C1C1E] p-4 rounded-3xl border border-border/50 dark:border-white/5"
                      style={{ shadowColor: '#421F6D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 }}
                      onPress={() => setSelected(c)}
                    >
                      <View className="flex-row items-center gap-4">
                        <View className="w-12 h-12 rounded-2xl bg-border/50 dark:bg-white/10 items-center justify-center">
                          <Icon name="people" size={24} color={isDark ? '#FFFFFF' : '#16141a'} />
                        </View>
                        <View>
                          <Text className="text-charcoal dark:text-white font-bold text-base">{c.name}</Text>
                          <Text className="text-muted dark:text-[#A1A1AA] font-medium text-xs">{`Round ${c.currentRound}/${c.totalRounds} · ${c.members.length} members`}</Text>
                        </View>
                      </View>
                      <Text className="text-charcoal dark:text-white font-bold text-lg">${fmtUSDC(c.poolBalance)}</Text>
                    </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Modals */}
        {selected && (
          <CircleDetail circle={selected} visible={!!selected} onClose={() => setSelected(null)} />
        )}
        <SendSheet visible={showSend} onClose={() => setShowSend(false)} />
        {showDeposit && (
          <DepositModal tier="Flex" visible={showDeposit} onClose={() => setShowDeposit(false)} />
        )}
        <CreateCircleWizard
          visible={showCreate}
          onClose={() => { reset(); setShowCreate(false); }}
          txState={txState}
          txHash={txHash}
          txError={error}
          circleCode={createdCode}
          onCreate={async (p) => { await createCircle(p); }}
        />
      </SafeAreaView>
    </View>
  );
}
