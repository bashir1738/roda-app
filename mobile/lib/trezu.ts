import { Alert, Linking } from 'react-native';
import { TREZU_BASE_URL } from '../constants/roda';

/**
 * Canonical Trezu dashboard URL for a Sputnik DAO (`trezu.app/<dao>`).
 * Trezu wraps Sputnik DAO directly and unlocks bulk payments, swaps,
 * confidential payouts, and CSV exports without Roda re-implementing them.
 */
export function trezuDaoUrl(daoId: string): string {
  return `${TREZU_BASE_URL.replace(/\/+$/, '')}/${encodeURIComponent(daoId)}`;
}

/**
 * Direct deep link into Trezu's requests/proposals workspace for `daoId`.
 */
export function trezuRequestsUrl(daoId: string): string {
  return `${trezuDaoUrl(daoId)}/requests`;
}

/**
 * Direct deep link into Trezu's treasury export / exchange view for `daoId`.
 */
export function trezuTreasuryUrl(daoId: string): string {
  return `${trezuDaoUrl(daoId)}/treasury`;
}

export async function openInTrezu(
  daoId: string,
  section: 'home' | 'requests' | 'treasury' = 'home',
): Promise<void> {
  const url =
    section === 'requests'
      ? trezuRequestsUrl(daoId)
      : section === 'treasury'
        ? trezuTreasuryUrl(daoId)
        : trezuDaoUrl(daoId);

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        'Open Trezu in Your Browser',
        `We couldn't launch Trezu automatically — head to ${url} in your browser to view this DAO.`,
      );
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Open Trezu in Your Browser',
      `We couldn't launch Trezu automatically — head to ${url} in your browser to view this DAO.`,
    );
  }
}
