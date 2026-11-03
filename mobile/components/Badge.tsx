import React from 'react';
import { View, Text } from 'react-native';
import { Icon, IconName } from './Icon';

export type BadgeVariant = 'active' | 'recruiting' | 'completed' | 'yourTurn' | 'matured' | 'locked';

type IoniconsName = IconName;

const VARIANTS: Record<BadgeVariant, {
  className: string; textClass: string; label: string; icon?: IoniconsName; iconColor?: string;
}> = {
  active:     { className: 'bg-green-50 border border-green-200',    textClass: 'text-primary',   label: 'Active',    icon: 'radio-button-on', iconColor: '#4ADE80' },
  recruiting: { className: 'bg-primary/10 border border-primary/20',    textClass: 'text-primary',    label: 'Recruiting',icon: 'person-add-outline', iconColor: '#FFFFFF' },
  completed:  { className: 'bg-gray-100 border border-gray-200',     textClass: 'text-muted',     label: 'Completed', icon: 'checkmark-circle', iconColor: '#B8A0C8' },
  yourTurn:   { className: 'bg-accent border border-accent',         textClass: 'text-primary',   label: 'Your turn!',icon: 'gift', iconColor: '#421F6D' },
  matured:    { className: 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50', textClass: 'text-primary dark:text-white', label: 'Ready' },
  locked:     { className: 'bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10', textClass: 'text-muted dark:text-white/80', label: 'Locked', icon: 'lock-closed-outline', iconColor: '#B8A0C8' },
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
