import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCard } from '../../components/CircleCard';
import { CircleDetail } from '../../components/CircleDetail';
import { CreateCircleWizard } from '../../components/CreateCircleWizard';
import { ProfileButton } from '../../components/ProfileSidebar';
import { useProfileSidebar } from '../../contexts/ProfileSidebarContext';
import { useCircles, type CircleData } from '../../hooks/useCircles';
import { useCreateCircle } from '../../hooks/useCreateCircle';
import { JoinByIdModal } from '../../components/JoinByIdModal';
import { useWallet } from '../../providers/WalletContext';
import { useRefresh } from '../../hooks/useRefresh';
import { useColorScheme } from 'nativewind';
import { Icon } from '../../components/Icon';

export default function CirclesTab() {
  const { isConnected } = useWallet();
  const { circles, isLoading } = useCircles();
  const { createCircle, createdCode, txState, txHash, error, reset, isSuccess } = useCreateCircle();
  const { openSidebar } = useProfileSidebar();
  const { refreshing, refresh } = useRefresh();
  const { colorScheme } = useColorScheme();
  const [selected, setSelected] = useState<CircleData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    if (isSuccess) {
      // Give the creator time to read (and copy) the new 6-digit circle code.
      const t = setTimeout(() => { setShowCreate(false); reset(); }, createdCode ? 5000 : 1800);
      return () => clearTimeout(t);
    }
  }, [isSuccess, createdCode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return circles;
    return circles.filter((c) => c.name.toLowerCase().includes(q));
  }, [circles, query]);

  const active     = filtered.filter((c) => c.status === 1);
  const recruiting = filtered.filter((c) => c.status === 0);
  const completed  = filtered.filter((c) => c.status === 2);

  return (
    <View className="flex-1 bg-[#FDFBF7] dark:bg-[#121212]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-3 pb-4">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-charcoal dark:text-white text-3xl font-bold tracking-tight mt-2">Circles</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="h-10 rounded-full bg-border/20 dark:bg-white/10 px-4 items-center justify-center flex-row gap-2"
                onPress={() => setShowJoin(true)}
                accessibilityLabel="Join a circle"
              >
                <Icon name="enter-outline" size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#421F6D'} />
                <Text className="text-primary dark:text-white font-bold">Join</Text>
              </TouchableOpacity>
              <ProfileButton onPress={openSidebar} />
            </View>
          </View>
          {/* Search bar */}
          <View className="flex-row items-center gap-2 mt-6 bg-white dark:bg-[#1C1C1E] rounded-full px-5 py-4 border border-border/50 dark:border-white/5" style={{ shadowColor: '#421F6D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
            <Icon name="search-outline" size={18} color="#6B6B6B" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search circles…"
              placeholderTextColor="#A1A1AA"
              className="flex-1 text-charcoal dark:text-white font-medium text-base"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close-circle" size={18} color="#6B6B6B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="flex-1 overflow-hidden">
          {!isConnected ? (
            <View className="flex-1 items-center justify-center gap-3 px-8">
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-2">
                <Icon name="wallet-outline" size={40} color="#421F6D" />
              </View>
              <Text className="text-charcoal dark:text-white font-bold text-2xl">Connect your wallet</Text>
              <Text className="text-muted dark:text-[#A1A1AA] text-base text-center font-medium">
                Connect to view and join savings circles
              </Text>
            </View>
          ) : isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#421F6D" size="large" />
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerClassName="pb-8"
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#421F6D" colors={['#421F6D']} />
              }
            >
              {circles.length > 0 ? (
                <>
                  {active.length > 0 && (
                    <View className="mb-6">
                      <View className="px-5 mb-4 mt-2">
                        <Text className="text-charcoal dark:text-white text-xl font-bold tracking-tight">Active Circles</Text>
                      </View>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerClassName="px-4"
                        snapToInterval={280 + 16} 
                        decelerationRate="fast"
                      >
                        {active.map((c) => (
                          <View key={c.id} style={{ width: 280, marginRight: 16 }}>
                            <CircleCard circle={c} onPress={() => setSelected(c)} compact />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {(recruiting.length > 0 || completed.length > 0) && (
                    <View className="px-5">
                      {recruiting.length > 0 && (
                        <>
                          <View className="mb-4 mt-2">
                            <Text className="text-charcoal dark:text-white text-xl font-bold tracking-tight">Discover & Join</Text>
                          </View>
                          {recruiting.map((c) => (
                            <CircleCard key={c.id} circle={c} onPress={() => setSelected(c)} />
                          ))}
                        </>
                      )}

                      {completed.length > 0 && (
                        <>
                          <View className="mb-4 mt-6">
                            <Text className="text-muted dark:text-white/50 text-sm font-bold uppercase tracking-wider">Completed</Text>
                          </View>
                          {completed.map((c) => (
                            <CircleCard key={c.id} circle={c} onPress={() => setSelected(c)} />
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </>
              ) : query ? (
                <View className="flex-1 items-center justify-center gap-3 px-8 py-20">
                  <Icon name="search-outline" size={48} color="#B8A0C8" />
                  <Text className="text-charcoal dark:text-white font-bold text-xl text-center">No results found</Text>
                  <Text className="text-muted dark:text-[#A1A1AA] text-base text-center">
                    Try a different search term
                  </Text>
                  <TouchableOpacity onPress={() => setQuery('')} className="mt-4 px-6 py-3 bg-border/20 rounded-full">
                    <Text className="text-primary font-bold text-base">Clear search</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center gap-4 px-8 py-24">
                  <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-2">
                    <Icon name="people" size={48} color="#421F6D" />
                  </View>
                  <Text className="text-charcoal dark:text-white font-bold text-2xl text-center">Start a Circle</Text>
                  <Text className="text-muted dark:text-[#A1A1AA] text-base text-center font-medium leading-6">
                    Invite friends or community members to start saving together.
                  </Text>
                  <TouchableOpacity
                    className="mt-6 bg-primary px-8 py-4 rounded-full shadow-lg flex-row items-center gap-2"
                    onPress={() => setShowCreate(true)}
                  >
                    <Icon name="add" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-base">Create your first circle</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Floating Action Button */}
        {isConnected && circles.length > 0 && (
          <TouchableOpacity 
            className="absolute right-6 bottom-28 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-xl"
            style={{ shadowColor: '#421F6D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}
            onPress={() => setShowCreate(true)}
          >
            <Icon name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {selected && (
          <CircleDetail circle={selected} visible={!!selected} onClose={() => setSelected(null)} />
        )}
        <JoinByIdModal visible={showJoin} onClose={() => setShowJoin(false)} />
        <CreateCircleWizard
          visible={showCreate}
          onClose={() => { reset(); setShowCreate(false); }}
          txState={txState}
          txHash={txHash}
          txError={error}
          circleCode={createdCode}
          onCreate={async (p) => { await createCircle(p); }}
        />
      </SafeAreaView>
    </View>
  );
}
