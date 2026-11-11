import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { TxState } from '../providers/WalletContext';
import { describeError } from '../lib/sendTx';
import { Icon } from './Icon';
import {
  ErrorIllustration,
  LoadingOrbitIllustration,
  SuccessBurstIllustration,
  getCategoryTheme,
} from './StatusIllustration';

interface Props {
  txState: TxState;
  txHash?: string | null;
  error?: string | null;
  successMessage?: string;
  onReset: () => void;
}

export function TxStateView({ txState, txHash, error, successMessage, onReset }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    if (txState === 'idle') return;
    opacity.value = 0;
    translateY.value = 8;
    opacity.value = withTiming(1, { duration: 220 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
  }, [txState, error, opacity, translateY]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (txState === 'idle') return null;

  const errorDetails = txState === 'error' ? describeError(error) : null;
  const errorTheme = errorDetails ? getCategoryTheme(errorDetails.category, isDark) : null;

  return (
    <Animated.View style={cardAnimStyle} className="items-center py-6 gap-3.5 px-4">
      {txState === 'signing' && (
        <>
          <LoadingOrbitIllustration mode="signing" size={88} />
          <View className="items-center gap-1 mt-1">
            <Text className="text-charcoal dark:text-white font-bold text-base text-center">
              Waiting for your approval
            </Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center px-4">
              Review and confirm this request in your wallet prompt.
            </Text>
          </View>
        </>
      )}

      {txState === 'confirming' && (
        <>
          <LoadingOrbitIllustration mode="confirming" size={88} />
          <View className="items-center gap-1 mt-1">
            <Text className="text-charcoal dark:text-white font-bold text-base text-center">
              Finishing up on NEAR…
            </Text>
            <Text className="text-muted dark:text-[#A1A1AA] text-sm text-center px-4">
              Usually settles in about 1 second.
            </Text>
          </View>
        </>
      )}

      {txState === 'success' && (
        <>
          <SuccessBurstIllustration size={88} />
          <Text className="text-primary dark:text-[#00C08B] font-black text-lg text-center px-2">
            {successMessage ?? 'All done — confirmed on NEAR!'}
          </Text>
          {txHash && (
            <View className="flex-row items-center gap-1.5 bg-white dark:bg-white/10 border border-border/50 dark:border-white/10 rounded-xl px-3 py-2">
              <Icon name="link-outline" size={13} color="#00C08B" />
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-mono">
                {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </Text>
            </View>
          )}
          <TouchableOpacity
            className="mt-1 bg-primary rounded-full px-8 py-3.5"
            onPress={onReset}
            accessibilityLabel="Done"
          >
            <Text className="text-black font-bold text-sm">Done</Text>
          </TouchableOpacity>
        </>
      )}

      {txState === 'error' && errorDetails && errorTheme && (
        <>
          <ErrorIllustration category={errorDetails.category} size={92} />

          <View
            style={{
              backgroundColor: errorTheme.bg,
              borderColor: errorTheme.border,
              borderWidth: 1,
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingVertical: 16,
              width: '100%',
              maxWidth: 360,
              gap: 6,
            }}
          >
            <Text
              style={{ color: errorTheme.titleColor }}
              className="font-extrabold text-base text-center"
            >
              {errorDetails.title}
            </Text>
            <Text
              style={{ color: errorTheme.textColor }}
              className="text-sm text-center leading-5"
            >
              {errorDetails.message}
            </Text>
            {errorDetails.hint ? (
              <View
                style={{
                  backgroundColor: errorTheme.accentSoft,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{ color: errorTheme.titleColor }}
                  className="text-xs text-center leading-4 font-medium"
                >
                  Tip: {errorDetails.hint}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={{ backgroundColor: errorTheme.buttonBg }}
            className="mt-1 rounded-full px-8 py-3.5"
            onPress={onReset}
            accessibilityLabel={errorDetails.actionLabel}
          >
            <Text style={{ color: errorTheme.buttonText }} className="font-bold text-sm">
              {errorDetails.actionLabel}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
}
