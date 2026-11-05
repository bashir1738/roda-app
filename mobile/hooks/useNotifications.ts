import { useEffect } from 'react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TASK_NAME = 'roda-background-check';
const IN_EXPO_GO = Constants.appOwnership === 'expo';
const INTERVAL_SECONDS = 15 * 60; // 15 minutes
const NOTIFIED_PREFIX = 'roda_notification_';
const PREFERENCE_KEY = 'roda_notifications_enabled';
let taskDefined = false;

// All native modules are loaded lazily via require() inside try/catch so that a
// missing/removed module (e.g. expo-notifications in Expo Go on SDK 53+) never
// throws at import time and crashes the root layout.

async function runChecks(Notifications: any) {
  // Runs in a background task — no React context available.
  const { getStoredAddress } = require('../lib/wallet') as typeof import('../lib/wallet');
  const { viewContract } = require('../lib/contract') as typeof import('../lib/contract');

  const address = await getStoredAddress();
  if (!address) return;

  const ids = await viewContract<number[]>('get_user_circle_ids', { account: address });
  const infos = await viewContract<any[]>('get_circles', { circle_codes: ids });

  const now = Math.floor(Date.now() / 1000);
  const PAID_NONE = 65535;

  for (let i = 0; i < infos.length; i += 1) {
    const info = infos[i];
    if (!info) continue; // circle closed
    if (info.status !== 'Active') continue;

    const name = info.name ?? 'your circle';
    const frequency = Number(info.frequency_secs);
    const roundStarted = Number(info.round_started_ts);
    const paidCount = Number(info.paid_count);
    const memberCount = Number(info.member_count);
    const poolBalance = Number(info.pool_balance);

    // All paid → pot claimable by this round's recipient.
    if (paidCount >= memberCount && memberCount > 0 && poolBalance > 0) {
      const membersVec: string[] = info.members ?? [];
      const recipient = membersVec[Number(info.current_round) % memberCount];
      const isMine = recipient === address;
      if (isMine) {
        await sendNotificationOnce(
          Notifications,
          `${NOTIFIED_PREFIX}payout_${ids[i]}_${Number(info.current_round)}`,
          '🎉 Your payout is ready',
          `Claim your payout from ${name}`,
        );
      }
      continue;
    }

    // Round window closing within 24h → contribution due soon.
    const closesAt = roundStarted + frequency;
    const hoursUntil = (closesAt - now) / 3600;
    if (hoursUntil > 0 && hoursUntil <= 24) {
      await sendNotificationOnce(
        Notifications,
        `${NOTIFIED_PREFIX}due_${ids[i]}_${Number(info.current_round)}`,
        '⏰ Contribution due soon',
        `${name} closes in ${Math.round(hoursUntil)}h`,
      );
    }
  }
}

async function sendNotification(Notifications: any, title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

async function sendNotificationOnce(
  Notifications: any,
  key: string,
  title: string,
  body: string,
) {
  if (await SecureStore.getItemAsync(key)) return;
  await sendNotification(Notifications, title, body);
  await SecureStore.setItemAsync(key, '1');
}

async function setup() {
  // These throw in Expo Go (SDK 53+) — caught by the caller.
  const Notifications = require('expo-notifications');
  const BackgroundFetch = require('expo-background-fetch');
  const TaskManager = require('expo-task-manager');

  // In Expo Go (SDK 53+) the native module is not bundled — bail cleanly.
  if (!Notifications?.setNotificationHandler) throw new Error('Native notification module unavailable — use a dev build');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (!taskDefined) {
    TaskManager.defineTask(TASK_NAME, async () => {
      try {
        await runChecks(Notifications);
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch {
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    taskDefined = true;
  }

  const perm = await Notifications.requestPermissionsAsync();
  const granted = perm?.granted === true || perm?.status === 'granted';
  if (!granted) return false;

  const registered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (!registered) {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: INTERVAL_SECONDS,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
  await SecureStore.setItemAsync(PREFERENCE_KEY, '1');
  return true;
}

export async function getNotificationsEnabled() {
  try {
    return (await SecureStore.getItemAsync(PREFERENCE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setNotificationsEnabled(enabled: boolean) {
  if (IN_EXPO_GO && enabled) return false;

  if (!enabled) {
    try {
      const TaskManager = require('expo-task-manager');
      if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) {
        await TaskManager.unregisterTaskAsync(TASK_NAME);
      }
    } catch {
      // The native task manager is unavailable in Expo Go.
    }
    await SecureStore.deleteItemAsync(PREFERENCE_KEY);
    return false;
  }

  try {
    return await setup();
  } catch {
    return false;
  }
}

export function useNotifications() {
  useEffect(() => {
    if (IN_EXPO_GO) return;
    getNotificationsEnabled().then((enabled) => {
      if (!enabled) return;
      return setup();
    }).catch(() => {
      if (__DEV__) console.info('[Roda] Push + background tasks require a dev build — skipped in Expo Go.');  
    });
  }, []);
}

// Fire a vault-matured notification on demand (best-effort; no-ops in Expo Go).
export async function notifyVaultMatured(vaultTier: string) {
  try {
    const Notifications = require('expo-notifications');
    const perm = await Notifications.requestPermissionsAsync();
    if (!(perm?.granted === true || perm?.status === 'granted')) return;
    await sendNotification(Notifications, '✅ Vault matured', `Your ${vaultTier} Vault is ready to claim`);
  } catch {
    // Unavailable in Expo Go — ignore.
  }
}
