import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { loadNearKey } from '../lib/nearKey';
import { Icon } from './Icon';

interface Props {
  visible: boolean;
  address?: string;
  onClose: () => void;
}

export function PrivateKeyModal({ visible, address, onClose }: Props) {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPrivateKey(null);
      setError(null);
      setCopied(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadNearKey()
      .then((keyPair) => {
        if (!keyPair) {
          setError('This wallet has no local private key to export.');
          return;
        }
        setPrivateKey(keyPair.toString());
      })
      .catch(() => setError('Could not load your private key. Please try again.'))
      .finally(() => setLoading(false));
  }, [visible]);

  const copyKey = async () => {
    if (!privateKey) return;
    try {
      await Clipboard.setStringAsync(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-border dark:border-white/10">
            <Text className="text-charcoal dark:text-white text-lg font-black">Private Key</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerClassName="px-5 py-5 gap-4" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
              <Icon name="warning-outline" size={18} color="#B45309" />
              <Text className="flex-1 text-amber-800 dark:text-amber-200 text-xs leading-5">
                Anyone with this key controls your funds. Never share it. Copy it only to a safe place you trust.
              </Text>
            </View>

            {address ? (
              <View>
                <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                  Account
                </Text>
                <Text className="text-charcoal dark:text-white text-sm font-mono" selectable>
                  {address}
                </Text>
              </View>
            ) : null}

            <View>
              <Text className="text-muted dark:text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mb-1.5">
                Secret Key
              </Text>
              {loading ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#00C08B" />
                </View>
              ) : error ? (
                <Text className="text-red-500 text-sm leading-5">{error}</Text>
              ) : (
                <View className="bg-[#F3F4F6] dark:bg-[#2C2C2E] rounded-2xl p-4 border border-border dark:border-white/10">
                  <Text
                    className="text-charcoal dark:text-white text-sm font-mono leading-6"
                    selectable
                  >
                    {privateKey}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="px-5 pb-5 pt-1 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl py-3.5 items-center justify-center flex-row gap-2"
              onPress={copyKey}
              disabled={!privateKey || loading}
              style={{ opacity: !privateKey || loading ? 0.4 : 1 }}
              accessibilityLabel="Copy private key"
            >
              <Icon name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color="#000000" />
              <Text className="text-black font-bold text-sm">{copied ? 'Copied!' : 'Copy Key'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-transparent border border-border dark:border-white/15 rounded-xl py-3.5 items-center justify-center"
              onPress={onClose}
              accessibilityLabel="Close private key modal"
            >
              <Text className="text-charcoal dark:text-white font-bold text-sm">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
