import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { formatUsdc } from '../constants/roda';
import { getReputationTier, useReputation } from '../hooks/useReputation';
import { Icon } from './Icon';

export function ReputationPill({
  account,
  compact = false,
}: {
  account?: string;
  compact?: boolean;
}) {
  const { data, isLoading } = useReputation(account);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const score = data?.score ?? 0;
  const tier = getReputationTier(score);

  if (isLoading && !data) {
    return (
      <View
        className="flex-row items-center gap-1.5 rounded-full px-3 py-1 border"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F7F6F2',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC',
        }}
      >
        <ActivityIndicator size="small" color="#00C08B" />
        <Text className="text-muted dark:text-[#A1A1AA] text-xs font-semibold">Rep…</Text>
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1 border"
      style={{
        backgroundColor: `${tier.color}18`,
        borderColor: `${tier.color}40`,
      }}
    >
      <Icon name="shield-checkmark" size={compact ? 12 : 14} color={tier.color} />
      <Text
        className="text-xs font-bold"
        style={{ color: tier.color }}
      >
        Rep {score}{!compact ? ` · ${tier.label}` : ''}
      </Text>
    </View>
  );
}

export function ReputationCard({ account }: { account?: string }) {
  const { data, isLoading } = useReputation(account);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expanded, setExpanded] = useState(false);

  if (!account) return null;

  const score = data?.score ?? 0;
  const tier = getReputationTier(score);
  const pct = Math.min(100, Math.max(0, Math.round((score / 1000) * 100)));

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const muted = isDark ? '#8E8E93' : '#6B6B6B';
  const subBg = isDark ? '#141416' : '#F7F6F2';

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: 1,
        borderRadius: 24,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2.5">
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: `${tier.color}1A`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="shield-checkmark" size={18} color={tier.color} />
          </View>
          <View>
            <Text className="text-charcoal dark:text-white font-bold text-sm">
              Roda Reputation
            </Text>
            <Text style={{ color: tier.color, fontSize: 12, fontWeight: '700' }}>
              {tier.label}
            </Text>
          </View>
        </View>

        {isLoading && !data ? (
          <ActivityIndicator size="small" color="#00C08B" />
        ) : (
          <View className="items-end">
            <Text className="text-charcoal dark:text-white font-black text-xl">
              {score}
              <Text style={{ color: muted, fontSize: 12, fontWeight: '600' }}>/1000</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 7,
          borderRadius: 99,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC',
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 99,
            backgroundColor: tier.color,
          }}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: muted, fontSize: 12, fontWeight: '600' }}>
          {expanded ? 'Hide score breakdown' : 'View score breakdown & Sybil model'}
        </Text>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={15}
          color={muted}
        />
      </TouchableOpacity>

      {expanded && data && (
        <View
          style={{
            marginTop: 12,
            borderRadius: 16,
            backgroundColor: subBg,
            padding: 12,
            gap: 8,
          }}
        >
          {[
            {
              label: 'Circle Reliability',
              detail: `${data.contributionsOk} on-time · ${data.contributionsMissed} missed`,
              pts: data.penaltyPts > 0
                ? `+${data.reliabilityPts} / -${data.penaltyPts}`
                : `+${data.reliabilityPts}`,
            },
            {
              label: 'Circles Completed',
              detail: `${data.circlesCompleted} full cycles`,
              pts: `+${data.completionPts}`,
            },
            {
              label: 'Vault Discipline',
              detail: `${data.vaultWithdrawUnits} matured withdrawals`,
              pts: `+${data.vaultPts}`,
            },
            {
              label: 'Community Volume',
              detail: `$${formatUsdc(data.communityVolume)} USDC funded`,
              pts: `+${data.volumePts}`,
            },
            {
              label: 'Account Tenure',
              detail: `${data.tenureDays} days active`,
              pts: `+${data.tenurePts}`,
            },
          ].map((row) => (
            <View key={row.label} className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-charcoal dark:text-white text-xs font-semibold">
                  {row.label}
                </Text>
                <Text style={{ color: muted, fontSize: 11 }}>{row.detail}</Text>
              </View>
              <Text className="text-primary dark:text-[#00C08B] text-xs font-bold">
                {row.pts}
              </Text>
            </View>
          ))}

          <View
            style={{
              marginTop: 4,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: cardBorder,
            }}
          >
            <Text style={{ color: muted, fontSize: 11, lineHeight: 16 }}>
              {data.sybilNote ||
                'Reputation scales with real USDC capital committed across circles, vaults, and community budgets — not wallet count.'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
