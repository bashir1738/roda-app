import React, { useEffect } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type IoniconsProps = React.ComponentProps<typeof Ionicons>;

/**
 * The single icon type used across the app — every screen imports this module
 * rather than `@expo/vector-icons`, so the whole UI stays on one icon pack.
 */
export type IconName = IoniconsProps['name'];

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export interface IconProps extends Omit<IoniconsProps, 'name' | 'size' | 'color' | 'style'> {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Rotate forever — refresh / syncing / in-flight transaction affordance. */
  spin?: boolean;
  /** Bounce on mount and whenever `name` changes — tab focus, state changes. */
  pop?: boolean;
}

export function Icon({
  name,
  size = 20,
  color = '#000000',
  style,
  spin = false,
  pop = false,
  ...rest
}: IconProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (spin) {
      rotation.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
    return () => cancelAnimation(rotation);
  }, [spin, rotation]);

  useEffect(() => {
    if (!pop) return;
    scale.value = withSequence(
      withTiming(1.25, { duration: 140, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
  }, [name, pop, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }, { scale: scale.value }],
  }));

  return (
    <AnimatedIonicons
      {...rest}
      name={name}
      size={size}
      color={color}
      style={[styles.base, style, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({ base: {} });
