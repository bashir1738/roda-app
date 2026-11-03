import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Icon } from './Icon';

export const PIN_LENGTH = 4;

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['',  '0', '⌫'],
];

interface Props {
  length: number;
  value: string;
  onKey: (key: string) => void;
  error?: boolean;
  shakeAnim?: Animated.Value;
  disabled?: boolean;
}

export function PinPad({ length, value, onKey, error, shakeAnim, disabled }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const keyBg      = isDark ? '#2C2C2E' : '#FFFFFF';
  const keyBorder  = isDark ? 'rgba(255,255,255,0.08)' : '#E2EDE8';
  const keyTextCol = isDark ? '#FFFFFF' : '#303030';
  const backIconColor = isDark ? '#AEAEB2' : '#6B6B6B';

  return (
    <View style={styles.container}>
      {/* Dots */}
      <Animated.View
        style={[
          styles.dots,
          shakeAnim ? { transform: [{ translateX: shakeAnim }] } : undefined,
        ]}
      >
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < value.length
                    ? error ? '#EF4444' : '#421F6D'
                    : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(66,31,109,0.15)'),
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => {
              if (key === '') {
                return <View key={ki} style={styles.keyEmpty} />;
              }
              const isBack = key === '⌫';
              return (
                <TouchableOpacity
                  key={ki}
                  onPress={() => !disabled && onKey(key)}
                  activeOpacity={0.6}
                  style={[
                    styles.key,
                    { backgroundColor: isBack ? 'transparent' : keyBg, borderColor: keyBorder },
                    isBack && styles.keyBack,
                    disabled && styles.keyDisabled,
                  ]}
                >
                  {isBack ? (
                    <Icon name="backspace-outline" size={22} color={backIconColor} />
                  ) : (
                    <Text style={[styles.keyText, { color: keyTextCol }]}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  dots: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 36,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  keypad: {
    gap: 12,
    width: '100%',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  key: {
    width: 90,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  keyBack: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyEmpty: {
    width: 90,
    height: 68,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
  },
});
