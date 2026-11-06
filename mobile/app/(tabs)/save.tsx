import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import { VaultCard } from '../../components/VaultCard';
import { DepositModal } from '../../components/DepositModal';
import { PayoutSheet } from '../../components/PayoutSheet';
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { useVaults, type VaultData } from '../../hooks/useVaults';
import { useWallet } from '../../providers/WalletContext';
import { VAULT_TIERS, type VaultTier } from '../../hooks/useVaults';
import { useRefresh } from '../../hooks/useRefresh';
import { Icon, type IconName } from '../../components/Icon';
import { Skeleton, VaultCardSkeleton } from '../../components/Skeleton';

const TIER_KEYS: VaultTier[] = ['Flex', 'Weekly', 'Monthly', '6 Months', '1 Year'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.76, 290);

const TIER_ICONS: Record<VaultTier, IconName> = {
  Flex: 'infinite-outline',
  Weekly: 'calendar-outline',
  Monthly: 'time-outline',
  '6 Months': 'trending-up-outline',
  '1 Year': 'trophy-outline',
};

const TIER_BADGES: Partial<Record<VaultTier, string>> = {
  Flex: 'Flexible',
  Weekly: 'Popular',
  '1 Year': 'Long Term',
};

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SaveTab() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isConnected } = useWallet();
  const { vaults, isLoading } = useVaults();
  const { openSidebar } = useProfileSidebar();
  const { refreshing, refresh } = useRefresh();

  const [depositTier, setDepositTier] = useState<VaultTier | null>(null);
  const [claimVault, setClaimVault] = useState<VaultData | null>(null);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const totalBalance = vaults.reduce((s, v) => s + v.currentBalanceUSDC, 0n);

  const screenBg = isDark ? '#111111' : '#FDFBF7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#8E8E93' : '#6B6B6B';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: screenBg }]} edges={['top']}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { backgroundColor: screenBg }]}>
        <View>
          <Text style={[styles.screenTitle, { color: textPrimary }]}>Save</Text>
          <Text style={[styles.screenSubtitle, { color: textMuted }]}>
            Solo savings vaults & fixed yield
          </Text>
        </View>
        <ProfileButton onPress={openSidebar} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#00C08B"
            colors={['#00C08B']}
          />
        }
      >
        {/* ── Minimalist Portfolio Overview Hero ── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
        >
          <View style={styles.heroLabelRow}>
            <Text style={[styles.heroLabel, { color: textMuted }]}>Total Saved</Text>
            <TouchableOpacity
              onPress={() => setBalanceHidden((h) => !h)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={balanceHidden ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceRow}>
            {isLoading && vaults.length === 0 ? (
              <Skeleton width={150} height={42} borderRadius={10} />
            ) : (
              <Text style={[styles.balanceText, { color: textPrimary }]}>
                {balanceHidden ? '••••••••' : `$${fmtUSDC(totalBalance)}`}
              </Text>
            )}
          </View>

          {vaults.length > 0 && (
            <Text style={[styles.heroSubtext, { color: textMuted }]}>
              {vaults.length} active {vaults.length === 1 ? 'vault' : 'vaults'}
            </Text>
          )}
        </View>

        {/* ── Choose a Plan Carousel ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Choose a Plan</Text>
            <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
              Lock funds for consistency or save with flexible access
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={CARD_WIDTH + 14}
            decelerationRate="fast"
          >
            {TIER_KEYS.map((key) => {
              const t = VAULT_TIERS[key];
              const iconName = TIER_ICONS[key];
              const badgeLabel = TIER_BADGES[key];
              const isPopular = key === 'Weekly';

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.88}
                  onPress={() => setDepositTier(key)}
                  style={[
                    styles.planCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: cardBg,
                      borderColor: isPopular ? '#00C08B' : cardBorder,
                      borderWidth: isPopular ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.planHeader}>
                    <View
                      style={[
                        styles.planIconCircle,
                        {
                          backgroundColor: isDark
                            ? 'rgba(0,192,139,0.12)'
                            : 'rgba(0,192,139,0.1)',
                        },
                      ]}
                    >
                      <Icon name={iconName} size={22} color="#00C08B" />
                    </View>

                    {badgeLabel && (
                      <View
                        style={[
                          styles.planBadge,
                          {
                            backgroundColor: isPopular
                              ? '#00C08B'
                              : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#F3F4F6',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.planBadgeText,
                            { color: isPopular ? '#000000' : textMuted },
                          ]}
                        >
                          {badgeLabel}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Plan Content */}
                  <View style={styles.planContent}>
                    <Text style={[styles.planTitle, { color: textPrimary }]}>{t.name}</Text>
                    <Text style={[styles.planLockText, { color: textMuted }]}>
                      {t.lockDays > 0 ? `${t.lockDays}-day commitment` : 'Withdraw anytime'}
                    </Text>
                    <Text style={[styles.planMinText, { color: textMuted }]}>
                      {t.minUSDC > 0 ? `Minimum deposit $${t.minUSDC} USDC` : 'No minimum deposit'}
                    </Text>
                  </View>

                  {/* Action Pill */}
                  <View
                    style={[
                      styles.planActionPill,
                      {
                        backgroundColor: isDark ? '#141416' : '#F7F6F2',
                        borderColor: cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.planActionText, { color: textPrimary }]}>Open Vault</Text>
                    <Icon name="arrow-forward" size={14} color="#00C08B" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Active Vaults Section ── */}
        {isConnected && (
          <View style={styles.activeVaultsSection}>
            <View style={styles.activeHeaderRow}>
              <Text style={[styles.activeSectionTitle, { color: textPrimary }]}>Your Vaults</Text>
              {vaults.length > 0 && (
                <View
                  style={[
                    styles.vaultCountBadge,
                    { backgroundColor: isDark ? 'rgba(0,192,139,0.12)' : 'rgba(0,192,139,0.1)' },
                  ]}
                >
                  <Text style={styles.vaultCountText}>
                    {vaults.length} {vaults.length === 1 ? 'Active' : 'Active'}
                  </Text>
                </View>
              )}
            </View>

            {isLoading ? (
              <View>
                <VaultCardSkeleton />
                <VaultCardSkeleton />
              </View>
            ) : vaults.length === 0 ? (
              /* Serene Empty State */
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: isDark ? 'rgba(0,192,139,0.12)' : 'rgba(0,192,139,0.08)' },
                  ]}
                >
                  <Icon name="leaf-outline" size={28} color="#00C08B" />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                  No active vaults yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: textMuted }]}>
                  Choose a plan above to lock in your savings and put your money to work with zero stress.
                </Text>
              </View>
            ) : (
              vaults.map((v) => (
                <VaultCard key={v.id} vault={v} onClaim={() => setClaimVault(v)} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Deposit Modal Sheet */}
      {depositTier && (
        <DepositModal
          tier={depositTier}
          visible={!!depositTier}
          onClose={() => setDepositTier(null)}
        />
      )}

      {/* Claim Payout Sheet */}
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    marginTop: 4,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceLoader: {
    marginLeft: 4,
  },
  heroSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },

  // Plan Carousel
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  planCard: {
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 185,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  planContent: {
    marginBottom: 14,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  planLockText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  planMinText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  planActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
  },
  planActionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Active Vaults
  activeVaultsSection: {
    paddingHorizontal: 16,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  activeSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  vaultCountBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 100,
  },
  vaultCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C08B',
  },
  loaderContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },

  // Empty state
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
