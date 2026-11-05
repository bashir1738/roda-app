import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { type CircleData } from '../hooks/useCircles';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from './Icon';
import { useColorScheme } from 'nativewind';

function fmtUSDC(n: bigint) {
  return (Number(n) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export function CircleCard({ circle, onPress, compact = false }: { circle: CircleData; onPress: () => void; compact?: boolean }) {
  const isRecruiting = circle.status === 0;
  const isActive = circle.status === 1;
  const isCompleted = circle.status === 2;
  const { colorScheme } = useColorScheme();

  // Simple progress calculation
  const totalRounds = circle.totalRounds;
  const currentRound = circle.currentRound;
  const progressPercent = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <TouchableOpacity
      className={`bg-white dark:bg-[#1C1C1E] border border-border/50 dark:border-white/5 rounded-3xl p-5 ${compact ? '' : 'mb-4 mx-0'}`}
      style={!compact ? { shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 } : {}}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
            {isRecruiting ? (
              <Icon name="people" size={24} color={colorScheme === 'dark' ? '#00C08B' : '#00C08B'} />
            ) : isCompleted ? (
              <Icon name="checkmark-circle" size={24} color="#00C08B" />
            ) : (
              <View className="relative items-center justify-center">
                <Svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx="22" cy="22" r="18" stroke={colorScheme === 'dark' ? 'rgba(0,192,139,0.2)' : '#BEEEDB'} strokeWidth="3" fill="none" />
                  <Circle 
                    cx="22" cy="22" r="18" 
                    stroke="#00C08B" strokeWidth="3" fill="none" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                  />
                </Svg>
                <View className="absolute bg-white/80 dark:bg-[#1C1C1E] rounded-full px-1.5 py-0.5">
                  <Text className="text-primary dark:text-[#00C08B] font-extrabold text-[10px]">{currentRound}/{totalRounds}</Text>
                </View>
              </View>
            )}
          </View>
          <View>
            <Text className="text-charcoal dark:text-white font-bold text-lg">{circle.name}</Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-xs font-medium">
              {isRecruiting ? 'Recruiting' : isActive ? 'Active' : 'Completed'}
            </Text>
          </View>
        </View>
        
        {circle.payoutPending && circle.myPosition === circle.currentRound && (
          <View className="bg-[#00C08B]/15 border border-[#00C08B]/30 px-3 py-1.5 rounded-full">
            <Text className="text-[#00C08B] font-bold text-xs">Payout Ready</Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-end bg-[#F8F9FA] dark:bg-white/10 rounded-2xl p-4">
        <View>
          <Text className="text-muted dark:text-[#A1A1AA] text-xs mb-1 font-medium">Contribution</Text>
          <Text className="text-charcoal dark:text-white font-bold text-lg">${fmtUSDC(circle.contributionAmount)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-muted dark:text-[#A1A1AA] text-xs mb-1 font-medium">Pool Balance</Text>
          <Text className="text-primary dark:text-[#00C08B] font-bold text-lg">${fmtUSDC(circle.poolBalance)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
