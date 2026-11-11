import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { describeError, type ErrorCategory } from '../lib/sendTx';
import { CategoryBadgeSvg, getCategoryTheme } from './StatusIllustration';
import { Icon } from './Icon';

interface Props {
  error?: unknown;
  title?: string;
  message?: string;
  hint?: string;
  category?: ErrorCategory;
  compact?: boolean;
  onDismiss?: () => void;
}

export function InlineErrorBanner({
  error,
  title,
  message,
  hint,
  category,
  compact = false,
  onDismiss,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const hasContent = Boolean(error) || Boolean(message);
  const parsed = error ? describeError(error) : null;
  const resolvedCategory: ErrorCategory = category ?? parsed?.category ?? 'validation';
  const resolvedMessage = message ?? parsed?.message ?? '';
  const resolvedTitle = title ?? (error ? parsed?.title : undefined);
  const resolvedHint = hint ?? (compact ? undefined : parsed?.hint);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-6);
  const nudgeX = useSharedValue(0);

  useEffect(() => {
    if (!hasContent) {
      opacity.value = 0;
      return;
    }
    opacity.value = withTiming(1, { duration: 180 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 220 });
    nudgeX.value = withSequence(
      withTiming(-3, { duration: 60 }),
      withTiming(3, { duration: 60 }),
      withSpring(0, { damping: 15, stiffness: 220 }),
    );
  }, [hasContent, resolvedMessage, nudgeX, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { translateX: nudgeX.value }],
  }));

  if (!hasContent || !resolvedMessage) return null;

  const theme = getCategoryTheme(resolvedCategory, isDark);

  return (
    <Animated.View
      style={[
        animStyle,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: compact ? 14 : 18,
          paddingHorizontal: compact ? 12 : 14,
          paddingVertical: compact ? 10 : 12,
        },
      ]}
    >
      <View className="flex-row items-start gap-2.5">
        <View
          style={{
            width: compact ? 26 : 32,
            height: compact ? 26 : 32,
            borderRadius: compact ? 13 : 16,
            backgroundColor: theme.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 1,
          }}
        >
          <CategoryBadgeSvg category={resolvedCategory} size={compact ? 15 : 18} color={theme.accent} />
        </View>

        <View className="flex-1">
          {!compact && resolvedTitle ? (
            <Text style={{ color: theme.titleColor }} className="text-xs font-extrabold mb-0.5">
              {resolvedTitle}
            </Text>
          ) : null}
          <Text
            style={{ color: theme.textColor }}
            className={compact ? 'text-xs leading-4 font-medium' : 'text-xs leading-5'}
          >
            {resolvedMessage}
          </Text>
          {resolvedHint ? (
            <Text
              style={{ color: theme.textColor, opacity: 0.85 }}
              className="text-[11px] leading-4 mt-1"
            >
              Tip: {resolvedHint}
            </Text>
          ) : null}
        </View>

        {onDismiss ? (
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Dismiss message"
          >
            <Icon name="close" size={16} color={theme.accent} />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}
