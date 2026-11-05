import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { utils } from 'near-api-js';
import { isValidAddress, usdcToRaw } from '../constants/roda';
import { transferNear, transferToken } from '../lib/contract';
import { useWallet } from '../providers/WalletContext';
import { friendlyError } from '../lib/sendTx';

export function SendSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { address } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'NEAR' | 'USDC'>('USDC');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const send = async () => {
    if (!address || !isValidAddress(recipient.trim())) {
      setError('Enter a valid NEAR account ID.');
      return;
    }
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (token === 'NEAR') {
        const raw = utils.format.parseNearAmount(amount.trim());
        if (!raw) {
          setError('Invalid NEAR amount.');
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
    <Modal isVisible={visible} onBackdropPress={onClose} style={{ justifyContent: 'flex-end', margin: 0 }}>
      <View className="bg-white dark:bg-[#121212] rounded-t-3xl px-6 pt-5 pb-10 gap-3">
        <Text className="text-charcoal dark:text-white text-xl font-black">Send</Text>
        <View className="flex-row gap-2">
          {(['NEAR', 'USDC'] as const).map((value) => (
            <TouchableOpacity key={value} onPress={() => setToken(value)}
              className={`rounded-full px-4 py-2 ${token === value ? 'bg-primary' : 'bg-charcoal/10'}`}>
              <Text className={token === value ? 'text-white font-bold' : 'text-charcoal dark:text-white font-bold'}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput value={recipient} onChangeText={setRecipient} autoCapitalize="none"
          placeholder="recipient.testnet" className="bg-black/5 dark:bg-white/10 rounded-2xl px-4 py-4 text-charcoal dark:text-white" />
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
          placeholder={`Amount ${token}`} className="bg-black/5 dark:bg-white/10 rounded-2xl px-4 py-4 text-charcoal dark:text-white" />
        {error && <Text className="text-red-500 text-sm">{error}</Text>}
        <TouchableOpacity onPress={send} disabled={pending} className="bg-primary rounded-full py-4 items-center">
          <Text className="text-white font-bold">{pending ? 'Sending…' : `Send ${token}`}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
