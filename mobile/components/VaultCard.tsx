import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import { VAULT_TIERS, type VaultData, type VaultTier } from '../hooks/useVaults';
import { Icon, type IconName } from './Icon';
import { useColorScheme } from 'nativewind';

const TIER_ICONS: Record<VaultTier, IconName> = {
  Flex: 'infinite-outline',
  Weekly: 'calendar-outline',
  Monthly: 'time-outline',
  '6 Months': 'trending-up-outline',
  '1 Year': 'trophy-outline',
};

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function timeLeft(ts: number) {
  const d = ts - Date.now() / 1000;
  if (d <= 0) return 'Matured';
  const days = Math.floor(d / 86400);
  if (days === 0) {
    const hours = Math.floor(d / 3600);
    return hours <= 1 ? 'Under an hour left' : `${hours}h remaining`;
  }
  return `${days}d remaining`;
}

function lockPct(v: VaultData) {
  if (v.lockDuration === 0) return 1;
  return Math.min(1, (Date.now() / 1000 - v.depositTimestamp) / v.lockDuration);
}

export function VaultCard({ vault, onClaim }: { vault: VaultData; onClaim: () => void }) {
  const tier = VAULT_TIERS[vault.tierKey];
  const pct = lockPct(vault);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const iconName = TIER_ICONS[vault.tierKey] ?? 'leaf-outline';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#8E8E93' : '#6B6B6B';
  const innerBg = isDark ? '#141416' : '#F7F6F2';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(0,192,139,0.12)' : 'rgba(0,192,139,0.1)' },
            ]}
          >
            <Icon name={iconName} size={20} color="#00C08B" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{tier.label} Vault</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>
              {tier.lockDays > 0 ? `${tier.lockDays}-day lock commitment` : 'Withdraw anytime'}
            </Text>
          </View>
        </View>
        <Badge variant={vault.isMatured ? 'matured' : 'locked'} size="sm" />
      </View>

      {/* Balance Block */}
      <View style={[styles.balanceBlock, { backgroundColor: innerBg }]}>
        <Text style={[styles.balanceLabel, { color: textMuted }]}>CURRENT BALANCE</Text>
        <Text style={[styles.balanceValue, { color: textPrimary }]}>
          ${fmtUSDC(vault.currentBalanceUSDC)} <Text style={[styles.currencyUnit, { color: textMuted }]}>USDC</Text>
        </Text>
      </View>

      {/* Lock Progress */}
      {vault.lockDuration > 0 && !vault.isMatured && (
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <View style={styles.progressLeft}>
              <Icon name="time-outline" size={13} color={textMuted} />
              <Text style={[styles.progressText, { color: textMuted }]}>
                {timeLeft(vault.maturityTimestamp)}
              </Text>
            </View>
            <Text style={[styles.progressPct, { color: textMuted }]}>
              {Math.round(pct * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={pct}
            color="#00C08B"
            trackColor={isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}
            height={5}
          />
        </View>
      )}

      {/* Claim Button */}
      {vault.isMatured && (
        <TouchableOpacity
          onPress={onClaim}
          activeOpacity={0.85}
          style={styles.claimButton}
          accessibilityLabel={`Claim ${tier.label} vault`}
        >
          <Icon name="checkmark-circle" size={16} color="#000000" />
          <Text style={styles.claimButtonText}>
            Claim ${fmtUSDC(vault.principalUSDC)} USDC
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  balanceBlock: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  currencyUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 6,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#00C08B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 100,
    marginTop: 8,
    shadowColor: '#00C08B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  claimButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
