import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface AjoPotProps {
  fillPercent: number;
  size?: number;
  animated?: boolean;
}

export function AjoPot({ fillPercent, size = 120, animated = true }: AjoPotProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);
  const target = Math.max(0, Math.min(100, fillPercent));
  const isFull = target >= 100;

  useEffect(() => {
    if (!animated || !isFull) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    return () => cancelAnimation(scale);
  }, [animated, isFull, scale]);

  const bankStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size * 1.25 }]}>
      <Animated.View style={[styles.iconWrap, bankStyle]}>
        <View style={[
          styles.iconBadge,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: size * 0.44,
            backgroundColor: isDark ? 'rgba(0,192,139,0.15)' : '#E6F9F3',
          },
        ]}>
          <Ionicons
            name="people"
            size={size * 0.7}
            color="#00C08B"
          />
        </View>
      </Animated.View>
      <View style={[styles.progressTrack, { width: size * 0.7 }]}>
        <View
          style={[
            styles.progress,
            { width: `${target}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: '#E6F9F3',
    borderColor: '#00C08B',
    borderWidth: 3,
    justifyContent: 'center',
    shadowColor: '#00C08B',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  progressTrack: {
    backgroundColor: 'rgba(0, 192, 139, 0.18)',
    borderRadius: 6,
    height: 7,
    marginTop: 7,
    overflow: 'hidden',
  },
  progress: {
    backgroundColor: '#00C08B',
    borderRadius: 6,
    height: '100%',
  },
});
