import React, { useState } from 'react';
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { utils } from 'near-api-js';
import { isValidAddress, usdcToRaw } from '../constants/roda';
import { transferNear, transferToken } from '../lib/contract';
import { useWallet } from '../providers/WalletContext';
import { friendlyError } from '../lib/sendTx';
import { InlineErrorBanner } from './InlineErrorBanner';

export function SendSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { address } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'NEAR' | 'USDC'>('USDC');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const send = async () => {
    if (!address || !isValidAddress(recipient.trim())) {
      setError("That doesn't look like a valid NEAR address (for example, maya.testnet).");
      return;
    }
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Enter an amount above 0 to send.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (token === 'NEAR') {
        const raw = utils.format.parseNearAmount(amount.trim());
        if (!raw) {
          setError('Double-check that NEAR amount — use a number like 1.5.');
          setPending(false);
          return;
        }
        await transferNear(address, recipient.trim(), raw);
      } else {
        const raw = usdcToRaw(numeric).toString();
        await transferToken(address, recipient.trim(), raw);
      }
      setRecipient('');
      setAmount('');
      onClose();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
        <View className="bg-white dark:bg-[#111111] rounded-t-3xl px-6 pt-5 pb-10 gap-3">
          <View className="w-10 h-1 rounded-full bg-charcoal/15 dark:bg-white/25 self-center mb-1" />
          <Text className="text-charcoal dark:text-white text-xl font-black">Send</Text>
          <View className="flex-row gap-2">
            {(['NEAR', 'USDC'] as const).map((value) => (
              <TouchableOpacity key={value} onPress={() => setToken(value)}
                className={`rounded-full px-4 py-2 ${token === value ? 'bg-primary' : 'bg-charcoal/10 dark:bg-white/10'}`}>
                <Text className={token === value ? 'text-black font-bold' : 'text-charcoal dark:text-white font-bold'}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={recipient}
            onChangeText={(v) => { setRecipient(v); setError(null); }}
            autoCapitalize="none"
            placeholder="recipient.testnet"
            placeholderTextColor={isDark ? '#A1A1AA' : '#6B6B6B'}
            className="bg-black/5 dark:bg-[#1C1C1E] border border-transparent dark:border-white/10 rounded-2xl px-4 py-4 text-charcoal dark:text-white"
          />
          <TextInput
            value={amount}
            onChangeText={(v) => { setAmount(v); setError(null); }}
            keyboardType="decimal-pad"
            placeholder={`Amount ${token}`}
            placeholderTextColor={isDark ? '#A1A1AA' : '#6B6B6B'}
            className="bg-black/5 dark:bg-[#1C1C1E] border border-transparent dark:border-white/10 rounded-2xl px-4 py-4 text-charcoal dark:text-white"
          />
          {error ? (
            <InlineErrorBanner error={error} compact onDismiss={() => setError(null)} />
          ) : null}
          <TouchableOpacity
            onPress={send}
            disabled={pending}
            className={`rounded-full py-4 items-center ${pending ? 'bg-primary/50' : 'bg-primary'}`}
          >
            <Text className="text-black font-bold text-base">{pending ? 'Sending…' : `Send ${token}`}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
