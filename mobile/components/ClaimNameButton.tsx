import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useDisplayName } from '../hooks/useDisplayName';
import { useUsername } from '../hooks/useUsername';
import { useWallet } from '../providers/WalletContext';
import { Icon } from './Icon';
import { InlineErrorBanner } from './InlineErrorBanner';

export function ClaimNameButton() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { address } = useWallet();
  const { localName, onChainName } = useDisplayName(address);
  const { claim, claimState, claimError, reset, isPending } = useUsername();

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (claimState === 'success') {
      setModalVisible(false);
      Alert.alert('Username claimed!', `Your handle "@${localName}" is now saved on NEAR.`);
      reset();
    }
  }, [claimState, localName, reset]);

  // Don't show if no local name or already on-chain
  if (!localName || onChainName) return null;

  const openModal = () => {
    reset();
    setModalVisible(true);
  };

  const closeModal = () => {
    if (isPending) return;
    reset();
    setModalVisible(false);
  };

  const handleClaim = () => {
    if (!localName) return;
    reset();
    claim(localName);
  };

  return (
    <>
      <TouchableOpacity
        onPress={openModal}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: isDark ? 'rgba(0,192,139,0.12)' : '#E6F9F3',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(0,192,139,0.3)' : 'transparent',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Icon name="alert-circle-outline" size={16} color="#00C08B" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#00C08B', fontSize: 12, fontWeight: '700' }}>
            Claim your name on-chain
          </Text>
          <Text style={{ color: isDark ? '#A1A1AA' : '#6B6B6B', fontSize: 11, marginTop: 2 }}>
            @{localName} · costs a bit of NEAR for fees
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={isDark ? '#A1A1AA' : '#6B6B6B'} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
            borderRadius: 20,
            padding: 24,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: isDark ? 'rgba(0,192,139,0.15)' : '#E6F9F3',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Icon name="shield-checkmark" size={32} color="#00C08B" />
              </View>
              <Text style={{ color: isDark ? '#FFFFFF' : '#303030', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
                Claim @{localName}?
              </Text>
            </View>

            <Text style={{ color: isDark ? '#A1A1AA' : '#6B6B6B', fontSize: 14, textAlign: 'center', marginBottom: 18, lineHeight: 20 }}>
              This will permanently register your name on the blockchain. Everyone in your circles will see it.
            </Text>

            {claimState === 'error' && claimError ? (
              <View style={{ marginBottom: 16 }}>
                <InlineErrorBanner error={claimError} onDismiss={reset} />
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleClaim}
              disabled={isPending}
              style={{
                backgroundColor: '#00C08B',
                borderRadius: 12,
                paddingVertical: 14,
                marginBottom: 10,
                alignItems: 'center',
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={{ color: '#000000', fontWeight: '700', fontSize: 16 }}>
                  {claimState === 'error' ? 'Try Again' : 'Claim Name'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeModal}
              disabled={isPending}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: isDark ? '#A1A1AA' : '#6B6B6B', fontWeight: '500', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
