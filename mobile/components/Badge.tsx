import React from 'react';
import { View, Text } from 'react-native';
import { Icon, IconName } from './Icon';

export type BadgeVariant = 'active' | 'recruiting' | 'completed' | 'yourTurn' | 'matured' | 'locked';

type IoniconsName = IconName;

const VARIANTS: Record<BadgeVariant, {
  className: string; textClass: string; label: string; icon?: IoniconsName; iconColor?: string;
}> = {
  active:     { className: 'bg-[#00C08B]/10 dark:bg-[#00C08B]/20 border border-[#00C08B]/30', textClass: 'text-primary dark:text-[#00C08B]', label: 'Active', icon: 'radio-button-on', iconColor: '#00C08B' },
  recruiting: { className: 'bg-primary/10 dark:bg-[#00C08B]/20 border border-primary/20 dark:border-[#00C08B]/30', textClass: 'text-primary dark:text-[#00C08B]', label: 'Recruiting', icon: 'person-add-outline', iconColor: '#00C08B' },
  completed:  { className: 'bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10', textClass: 'text-muted dark:text-[#A1A1AA]', label: 'Completed', icon: 'checkmark-circle', iconColor: '#A1A1AA' },
  yourTurn:   { className: 'bg-[#00C08B]/15 dark:bg-[#00C08B]/25 border border-[#00C08B]/35', textClass: 'text-primary dark:text-[#00C08B]', label: 'Your turn!', icon: 'gift', iconColor: '#00C08B' },
  matured:    { className: 'bg-[#00C08B]/15 dark:bg-[#00C08B]/20 border border-[#00C08B]/30 dark:border-[#00C08B]/40', textClass: 'text-primary dark:text-[#00C08B]', label: 'Ready' },
  locked:     { className: 'bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10', textClass: 'text-muted dark:text-white/80', label: 'Locked', icon: 'lock-closed-outline', iconColor: '#A1A1AA' },
};

export function Badge({ variant, size = 'md' }: { variant: BadgeVariant; size?: 'sm' | 'md' }) {
  const v = VARIANTS[variant];
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <View className={`flex-row items-center gap-1 rounded-full self-start ${v.className} ${px}`}>
      {v.icon && <Icon name={v.icon} size={size === 'sm' ? 10 : 11} color={v.iconColor} />}
      <Text className={`font-semibold ${textSize} ${v.textClass}`}>{v.label}</Text>
    </View>
  );
}
