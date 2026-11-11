import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ErrorCategory } from '../lib/sendTx';

export interface CategoryTheme {
  accent: string;
  accentSoft: string;
  bg: string;
  border: string;
  titleColor: string;
  textColor: string;
  buttonBg: string;
  buttonText: string;
}

export function getCategoryTheme(category: ErrorCategory, isDark: boolean): CategoryTheme {
  switch (category) {
    case 'wallet':
    case 'balance':
      return isDark
        ? {
            accent: '#FBBF24',
            accentSoft: 'rgba(251,191,36,0.16)',
            bg: 'rgba(245,158,11,0.11)',
            border: 'rgba(251,191,36,0.28)',
            titleColor: '#FEF3C7',
            textColor: '#FDE68A',
            buttonBg: '#F59E0B',
            buttonText: '#111111',
          }
        : {
            accent: '#D97706',
            accentSoft: '#FEF3C7',
            bg: '#FFFBEB',
            border: '#FDE68A',
            titleColor: '#78350F',
            textColor: '#92400E',
            buttonBg: '#F59E0B',
            buttonText: '#111111',
          };

    case 'timing':
      return isDark
        ? {
            accent: '#FB923C',
            accentSoft: 'rgba(251,146,60,0.16)',
            bg: 'rgba(234,88,12,0.11)',
            border: 'rgba(251,146,60,0.28)',
            titleColor: '#FFEDD5',
            textColor: '#FED7AA',
            buttonBg: '#F97316',
            buttonText: '#111111',
          }
        : {
            accent: '#EA580C',
            accentSoft: '#FFEDD5',
            bg: '#FFF7ED',
            border: '#FED7AA',
            titleColor: '#7C2D12',
            textColor: '#9A3412',
            buttonBg: '#EA580C',
            buttonText: '#FFFFFF',
          };

    case 'network':
      return isDark
        ? {
            accent: '#38BDF8',
            accentSoft: 'rgba(56,189,248,0.16)',
            bg: 'rgba(14,165,233,0.11)',
            border: 'rgba(56,189,248,0.28)',
            titleColor: '#E0F2FE',
            textColor: '#BAE6FD',
            buttonBg: '#38BDF8',
            buttonText: '#082F49',
          }
        : {
            accent: '#0284C7',
            accentSoft: '#E0F2FE',
            bg: '#F0F9FF',
            border: '#BAE6FD',
            titleColor: '#0C4A6E',
            textColor: '#075985',
            buttonBg: '#0284C7',
            buttonText: '#FFFFFF',
          };

    case 'governance':
    case 'reputation':
      return isDark
        ? {
            accent: '#818CF8',
            accentSoft: 'rgba(129,140,248,0.16)',
            bg: 'rgba(99,102,241,0.12)',
            border: 'rgba(129,140,248,0.28)',
            titleColor: '#E0E7FF',
            textColor: '#C7D2FE',
            buttonBg: '#818CF8',
            buttonText: '#111111',
          }
        : {
            accent: '#4F46E5',
            accentSoft: '#E0E7FF',
            bg: '#EEF2FF',
            border: '#C7D2FE',
            titleColor: '#312E81',
            textColor: '#3730A3',
            buttonBg: '#4F46E5',
            buttonText: '#FFFFFF',
          };

    case 'cancelled':
      return isDark
        ? {
            accent: '#94A3B8',
            accentSoft: 'rgba(148,163,184,0.16)',
            bg: 'rgba(148,163,184,0.10)',
            border: 'rgba(148,163,184,0.25)',
            titleColor: '#F1F5F9',
            textColor: '#CBD5E1',
            buttonBg: '#334155',
            buttonText: '#FFFFFF',
          }
        : {
            accent: '#64748B',
            accentSoft: '#E2E8F0',
            bg: '#F8FAFC',
            border: '#CBD5E1',
            titleColor: '#1E293B',
            textColor: '#475569',
            buttonBg: '#1E293B',
            buttonText: '#FFFFFF',
          };

    case 'validation':
    case 'generic':
    default:
      return isDark
        ? {
            accent: '#F28B66',
            accentSoft: 'rgba(242,139,102,0.16)',
            bg: 'rgba(224,109,68,0.12)',
            border: 'rgba(242,139,102,0.3)',
            titleColor: '#FFE8DF',
            textColor: '#FACBB9',
            buttonBg: '#E06D44',
            buttonText: '#FFFFFF',
          }
        : {
            accent: '#D96B43',
            accentSoft: '#FDE8DF',
            bg: '#FFF6F2',
            border: '#F8CFC0',
            titleColor: '#7A2E14',
            textColor: '#993D1E',
            buttonBg: '#D96B43',
            buttonText: '#FFFFFF',
          };
  }
}

export function LoadingOrbitIllustration({
  mode = 'signing',
  size = 88,
}: {
  mode?: 'signing' | 'confirming';
  size?: number;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const orbit = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    orbit.value = withRepeat(
      withTiming(360, { duration: mode === 'confirming' ? 2200 : 3200, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    return () => {
      cancelAnimation(orbit);
      cancelAnimation(pulse);
    };
  }, [mode, orbit, pulse]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value}deg` }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const haloFill = isDark ? 'rgba(0,192,139,0.14)' : '#E6F9F3';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', inset: 0 }, orbitStyle]}>
        <Svg width={size} height={size} viewBox="0 0 88 88">
          <Circle
            cx="44"
            cy="44"
            r="38"
            fill="none"
            stroke="#00C08B"
            strokeOpacity={0.22}
            strokeWidth="2.5"
            strokeDasharray="10 8"
          />
          <Path
            d="M44 6 A38 38 0 0 1 82 44"
            fill="none"
            stroke="#00C08B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <Circle cx="44" cy="6" r="4.5" fill="#00C08B" />
        </Svg>
      </Animated.View>

      <Animated.View style={coreStyle}>
        <Svg width={size * 0.64} height={size * 0.64} viewBox="0 0 56 56">
          <Circle cx="28" cy="28" r="25" fill={haloFill} stroke="#00C08B" strokeOpacity={0.3} strokeWidth="1.5" />
          {mode === 'signing' ? (
            <G>
              <Rect x="15" y="19" width="26" height="19" rx="5" fill="#00C08B" />
              <Rect x="27" y="25" width="16" height="7" rx="3.5" fill={isDark ? '#111111' : '#FFFFFF'} />
              <Circle cx="32" cy="28.5" r="2" fill="#00C08B" />
            </G>
          ) : (
            <G>
              <Path
                d="M28 13 L41 20.5 L41 35.5 L28 43 L15 35.5 L15 20.5 Z"
                fill="none"
                stroke="#00C08B"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <Circle cx="28" cy="28" r="5" fill="#00C08B" />
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

export function SuccessBurstIllustration({ size = 88 }: { size?: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const pop = useSharedValue(0.6);
  const shimmer = useSharedValue(0.7);

  useEffect(() => {
    pop.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 220 }),
      withSpring(1, { damping: 14, stiffness: 180 }),
    );
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    return () => {
      cancelAnimation(pop);
      cancelAnimation(shimmer);
    };
  }, [pop, shimmer]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));
  const sparkStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  const halo = isDark ? 'rgba(0,192,139,0.16)' : '#E6F9F3';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', inset: 0 }, sparkStyle]}>
        <Svg width={size} height={size} viewBox="0 0 88 88">
          <Circle cx="15" cy="22" r="3" fill="#00C08B" fillOpacity={0.7} />
          <Circle cx="74" cy="26" r="2.5" fill="#00C08B" fillOpacity={0.6} />
          <Circle cx="70" cy="70" r="3.5" fill="#00C08B" fillOpacity={0.5} />
          <Circle cx="18" cy="68" r="2" fill="#00C08B" fillOpacity={0.6} />
        </Svg>
      </Animated.View>

      <Animated.View style={badgeStyle}>
        <Svg width={size} height={size} viewBox="0 0 88 88">
          <Circle cx="44" cy="44" r="36" fill={halo} />
          <Circle cx="44" cy="44" r="28" fill="#00C08B" />
          <Path
            d="M32 45 L40.5 53.5 L57 36"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function ErrorIllustration({
  category,
  size = 88,
}: {
  category: ErrorCategory;
  size?: number;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = getCategoryTheme(category, isDark);

  const scale = useSharedValue(0.75);
  const floatY = useSharedValue(0);
  const nudgeX = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    floatY.value = 0;
    nudgeX.value = 0;
    sway.value = 0;

    if (category === 'wallet' || category === 'balance' || category === 'network') {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (category === 'timing') {
      sway.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (category !== 'cancelled') {
      nudgeX.value = withSequence(
        withTiming(-5, { duration: 75 }),
        withTiming(5, { duration: 85 }),
        withTiming(-3, { duration: 85 }),
        withTiming(2, { duration: 85 }),
        withSpring(0, { damping: 14, stiffness: 220 }),
      );
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(floatY);
      cancelAnimation(nudgeX);
      cancelAnimation(sway);
    };
  }, [category, floatY, nudgeX, scale, sway]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: floatY.value },
      { translateX: nudgeX.value },
      { rotate: `${sway.value}deg` },
    ],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={animStyle}>
        <Svg width={size} height={size} viewBox="0 0 88 88">
          {/* Soft backdrop halo */}
          <Circle cx="44" cy="44" r="38" fill={theme.accentSoft} />
          <Circle
            cx="44"
            cy="44"
            r="37"
            fill="none"
            stroke={theme.accent}
            strokeOpacity={0.25}
            strokeWidth="1.5"
          />

          {(category === 'wallet' || category === 'balance') && (
            <G>
              {/* Friendly wallet + rising coin spark */}
              <Rect x="22" y="34" width="44" height="30" rx="8" fill={theme.accent} />
              <Path
                d="M22 40 C22 36.7 24.7 34 28 34 L54 34 C57.3 34 60 36.7 60 40"
                fill={theme.accent}
              />
              <Rect
                x="46"
                y="45"
                width="20"
                height="10"
                rx="5"
                fill={isDark ? '#111111' : '#FFFFFF'}
              />
              <Circle cx="52" cy="50" r="2" fill={theme.accent} />
              {/* Hovering coin above wallet */}
              <Circle
                cx="42"
                cy="24"
                r="8.5"
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={theme.accent}
                strokeWidth="2.5"
              />
              <Line
                x1="42"
                y1="20.5"
                x2="42"
                y2="27.5"
                stroke={theme.accent}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <Line
                x1="38.5"
                y1="24"
                x2="45.5"
                y2="24"
                stroke={theme.accent}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </G>
          )}

          {category === 'timing' && (
            <G>
              {/* Warm minimalist hourglass / clock */}
              <Circle
                cx="44"
                cy="44"
                r="22"
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={theme.accent}
                strokeWidth="3.5"
              />
              <Path
                d="M44 31 L44 44 L53 49"
                fill="none"
                stroke={theme.accent}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx="44" cy="44" r="2.5" fill={theme.accent} />
              <Circle cx="65" cy="23" r="3" fill={theme.accent} fillOpacity={0.7} />
            </G>
          )}

          {category === 'network' && (
            <G>
              {/* Soft cloud + pulse arc */}
              <Path
                d="M31 54 H58 C62.4 54 66 50.4 66 46 C66 42 63 38.6 59.1 38.1 C57.8 31.3 51.8 26 44.5 26 C36.5 26 30 32.5 30 40.5 C25.6 41.2 22 44.9 22 49.5 C22 52.3 25.8 54 31 54 Z"
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={theme.accent}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <Path
                d="M37 61 Q44 66 51 61"
                fill="none"
                stroke={theme.accent}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <Circle cx="44" cy="67" r="2.2" fill={theme.accent} />
            </G>
          )}

          {(category === 'governance' || category === 'reputation') && (
            <G>
              {/* Shield emblem */}
              <Path
                d="M44 21 L63 29 V43 C63 54.5 54.9 63.6 44 67 C33.1 63.6 25 54.5 25 43 V29 L44 21 Z"
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={theme.accent}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              {category === 'reputation' ? (
                <Path
                  d="M44 34 L46.8 40 L53.2 40.8 L48.5 45.2 L49.7 51.6 L44 48.5 L38.3 51.6 L39.5 45.2 L34.8 40.8 L41.2 40 Z"
                  fill={theme.accent}
                />
              ) : (
                <G>
                  <Circle cx="44" cy="41" r="4" fill={theme.accent} />
                  <Path
                    d="M37 54 C37 49.8 40.1 47 44 47 C47.9 47 51 49.8 51 54"
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </G>
              )}
            </G>
          )}

          {category === 'cancelled' && (
            <G>
              {/* Calm pause / undo circle */}
              <Circle
                cx="44"
                cy="44"
                r="21"
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={theme.accent}
                strokeWidth="3"
              />
              <Path
                d="M41 37 L34 44 L41 51"
                fill="none"
                stroke={theme.accent}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M35 44 H51 C54.5 44 56 46 56 49"
                fill="none"
                stroke={theme.accent}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </G>
          )}

          {(category === 'validation' || category === 'generic') && (
            <G>
              {/* Warm rounded speech/spark badge */}
              <Rect
                x="23"
                y="24"
                width="42"
                height="36"
                rx="14"
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={theme.accent}
                strokeWidth="3.2"
              />
              <Path
                d="M36 60 L32 67 L43 60"
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={theme.accent}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <Line
                x1="44"
                y1="34"
                x2="44"
                y2="45"
                stroke={theme.accent}
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <Circle cx="44" cy="51.5" r="2.4" fill={theme.accent} />
              <Circle cx="68" cy="21" r="2.8" fill={theme.accent} fillOpacity={0.65} />
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

export function CategoryBadgeSvg({
  category,
  size = 18,
  color,
}: {
  category: ErrorCategory;
  size?: number;
  color?: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const stroke = color ?? getCategoryTheme(category, isDark).accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {(category === 'wallet' || category === 'balance') && (
        <G>
          <Rect
            x="3"
            y="6"
            width="18"
            height="13"
            rx="3.5"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
          />
          <Path d="M15 11.5 H21 V14.5 H15 C14.2 14.5 13.5 13.8 13.5 13 C13.5 12.2 14.2 11.5 15 11.5 Z" fill={stroke} />
        </G>
      )}
      {category === 'timing' && (
        <G>
          <Circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth="2" />
          <Path
            d="M12 7.5 V12.5 L15.5 14.5"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
      {category === 'network' && (
        <Path
          d="M7 18 H17.5 C19.4 18 21 16.4 21 14.5 C21 12.7 19.6 11.2 17.8 11 C17.1 7.9 14.3 6 11.2 6 C7.8 6 5.2 8.7 5.2 12 C3.9 12.4 3 13.6 3 15 C3 16.7 4.8 18 7 18 Z"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {(category === 'governance' || category === 'reputation') && (
        <G>
          <Path
            d="M12 3 L19.5 6.2 V11.8 C19.5 16.5 16.3 19.9 12 21.2 C7.7 19.9 4.5 16.5 4.5 11.8 V6.2 L12 3 Z"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="12" r="2" fill={stroke} />
        </G>
      )}
      {category === 'cancelled' && (
        <G>
          <Circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth="2" />
          <Path
            d="M11 9 L8 12 L11 15 M8.5 12 H15"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
      {(category === 'validation' || category === 'generic') && (
        <G>
          <Circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth="2" />
          <Line
            x1="12"
            y1="8"
            x2="12"
            y2="13"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Circle cx="12" cy="16.2" r="1.2" fill={stroke} />
        </G>
      )}
    </Svg>
  );
}
