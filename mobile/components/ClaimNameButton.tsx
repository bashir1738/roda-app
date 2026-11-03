import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useDisplayName } from '../hooks/useDisplayName';
import { useUsername } from '../hooks/useUsername';
import { useWallet } from '../providers/WalletContext';
import { Icon } from './Icon';

export function ClaimNameButton() {
  const { address } = useWallet();
  const { localName, onChainName } = useDisplayName(address);
  const { claim, claimState, claimError, reset, isPending } = useUsername();

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (claimState === 'success') {
      setModalVisible(false);
      Alert.alert('Success!', `Your name "@${localName}" has been claimed on-chain!`);
      reset();
    } else if (claimState === 'error') {
      Alert.alert('Claim failed', claimError ?? 'Something went wrong — please try again.');
      reset();
    }
  }, [claimState]);

  // Don't show if no local name or already on-chain
  if (!localName || onChainName) return null;

  const handleClaim = () => {
    if (!localName) return;
    claim(localName);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: '#EDD2F8',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Icon name="alert-circle-outline" size={16} color="#421F6D" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#421F6D', fontSize: 12, fontWeight: '600' }}>
            Claim your name on-chain
          </Text>
          <Text style={{ color: '#6B6B6B', fontSize: 11, marginTop: 2 }}>
            @{localName} · costs a bit of SOL for fees
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color="#6B6B6B" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EDD2F8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon name="shield-checkmark" size={32} color="#421F6D" />
              </View>
              <Text style={{ color: '#303030', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
                Claim @{localName}?
              </Text>
            </View>

            <Text style={{ color: '#6B6B6B', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              This will permanently register your name on the blockchain. Everyone in your circles will see it.
            </Text>

            <TouchableOpacity
              onPress={handleClaim}
              disabled={isPending}
              style={{
                backgroundColor: '#421F6D',
                borderRadius: 12,
                paddingVertical: 14,
                marginBottom: 10,
                alignItems: 'center',
              }}
            >
              {isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Claim Name</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              disabled={isPending}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#6B6B6B', fontWeight: '500', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
