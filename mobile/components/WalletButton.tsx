import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from 'nativewind';
import { useWallet } from '../providers/WalletContext';
import { Icon } from './Icon';

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { address, isConnected, connect } = useWallet();
  const [copied, setCopied] = useState(false);

  if (isConnected && address) {
    const handleCopy = async () => {
      try {
        await Clipboard.setStringAsync(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {}
    };

    return (
      <TouchableOpacity
        className="flex-row items-center gap-1.5 bg-border/30 dark:bg-white/10 px-3 py-1.5 rounded-full"
        onPress={handleCopy}
        accessibilityLabel="Copy wallet address"
      >
        <Icon
          name={copied ? 'checkmark-circle' : 'copy-outline'}
          size={13}
          color={copied ? '#00C08B' : (isDark ? '#A1A1AA' : '#6B6B6B')}
        />
        <Text className="text-charcoal dark:text-white text-xs font-semibold">
          {copied ? 'Copied!' : shortAddr(address)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="flex-row items-center gap-1.5 bg-primary/10 dark:bg-[#00C08B]/15 border border-primary/20 dark:border-[#00C08B]/30 px-3 py-1.5 rounded-full"
      onPress={connect}
      accessibilityLabel="Sign in"
    >
      <Icon name="log-in-outline" size={14} color="#00C08B" />
      <Text className="text-primary dark:text-[#00C08B] text-xs font-semibold">Sign in</Text>
    </TouchableOpacity>
  );
}
