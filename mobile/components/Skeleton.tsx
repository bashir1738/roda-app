import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useColorScheme } from 'nativewind';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

/**
 * Base animated skeleton placeholder block with native-driver pulse animation.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  className,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const defaultBg = isDark ? '#2C2C2E' : '#E8E5DF';

  return (
    <Animated.View
      className={className}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: defaultBg,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton for the Recent Activity list item on the Home screen.
 */
export function HomeActivitySkeleton() {
  return (
    <View
      className="flex-row items-center justify-between bg-white dark:bg-[#1C1C1E] p-4 rounded-3xl border border-border/50 dark:border-white/5 mb-3"
      style={{
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View className="flex-row items-center gap-4">
        <Skeleton width={48} height={48} borderRadius={16} />
        <View className="gap-2">
          <Skeleton width={130} height={16} borderRadius={6} />
          <Skeleton width={170} height={12} borderRadius={4} />
        </View>
      </View>
      <Skeleton width={64} height={22} borderRadius={8} />
    </View>
  );
}

/**
 * Skeleton matching CircleCard for the Circles tab.
 */
export function CircleCardSkeleton() {
  return (
    <View
      className="bg-white dark:bg-[#1C1C1E] border border-border/50 dark:border-white/5 rounded-3xl p-5 mb-4"
      style={{
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <Skeleton width={48} height={48} borderRadius={16} />
          <View className="gap-2">
            <Skeleton width={140} height={18} borderRadius={6} />
            <Skeleton width={70} height={12} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={80} height={26} borderRadius={13} />
      </View>

      {/* Bottom stats box */}
      <View className="flex-row justify-between items-end bg-[#F8F9FA] dark:bg-white/10 rounded-2xl p-4">
        <View className="gap-2">
          <Skeleton width={75} height={11} borderRadius={4} />
          <Skeleton width={90} height={20} borderRadius={6} />
        </View>
        <View className="items-end gap-2">
          <Skeleton width={75} height={11} borderRadius={4} />
          <Skeleton width={90} height={20} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton matching VaultCard for the Save tab.
 */
export function VaultCardSkeleton() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EDE6DC';
  const blockBg = isDark ? '#141416' : '#F7F6F2';

  return (
    <View
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: cardBorder,
        backgroundColor: cardBg,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton width={42} height={42} borderRadius={21} />
          <View style={{ gap: 6 }}>
            <Skeleton width={120} height={16} borderRadius={6} />
            <Skeleton width={150} height={12} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={64} height={24} borderRadius={12} />
      </View>

      {/* Balance Block */}
      <View
        style={{
          borderRadius: 16,
          backgroundColor: blockBg,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Skeleton width={90} height={10} borderRadius={4} />
        <Skeleton width={140} height={24} borderRadius={6} />
      </View>

      {/* Progress row */}
      <View style={{ gap: 8, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width={100} height={12} borderRadius={4} />
          <Skeleton width={32} height={12} borderRadius={4} />
        </View>
        <Skeleton width="100%" height={6} borderRadius={3} />
      </View>
    </View>
  );
}

