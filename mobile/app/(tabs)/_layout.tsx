import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Icon, IconName } from '../../components/Icon';

function TabIcon({
  iconActive, iconInactive, label, focused,
}: { iconActive: IconName; iconInactive: IconName; label: string; focused: boolean }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ACTIVE   = '#00C08B';
  const INACTIVE = isDark ? '#8E8E93' : '#71717A';
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 64, gap: 4 }}>
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 16,
        backgroundColor: focused ? (isDark ? 'rgba(0, 192, 139, 0.2)' : 'rgba(0, 192, 139, 0.12)') : 'transparent'
      }}>
        <Icon name={focused ? iconActive : iconInactive} size={22} color={focused ? ACTIVE : INACTIVE} pop />
      </View>
      <Text style={{ 
        color: focused ? ACTIVE : INACTIVE, 
        fontSize: 10, 
        fontWeight: focused ? '700' : '600' 
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const TAB_H = 64;
  // On Android, insets.bottom might be 0 if using 3-button nav, so add a minimal padding.
  const paddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 8) : insets.bottom;
  const height = TAB_H + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#00C08B',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#71717A',
        tabBarItemStyle: { height: TAB_H, justifyContent: 'center', paddingTop: 8 },
        tabBarStyle: {
            backgroundColor: isDark ? '#171717' : '#FFFDF8',
            borderTopColor: isDark ? '#FFFFFF' : '#111111',
            borderTopWidth: 2,
            height,
            paddingBottom,
            elevation: 0,
            shadowColor: 'transparent',
          },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconActive="home" iconInactive="home-outline" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconActive="people" iconInactive="people-outline" label="Circles" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="save"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconActive="leaf" iconInactive="leaf-outline" label="Save" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconActive="wallet" iconInactive="wallet-outline" label="Wallet" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
