import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { viewContract } from '../lib/contract';

export interface CircleData {
  address: string; id: number; creator: string; name: string; emoji: string;
  maxMembers: number; memberCount: number; paidCount: number; contributionAmount: bigint;
  currentRound: number; totalRounds: number; poolBalance: bigint; nextPayoutTimestamp: number;
  frequency: number; status: 0 | 1 | 2; payoutPending: boolean; members: string[];
  myPosition: number; myPaidRound: number;
}
const EMOJIS = ['💼', '👑', '🌿', '🎯', '🔥', '💎', '🚀', '🌟'];
function mapCircle(c: any, address?: string): CircleData {
  const members = c.members ?? [];
  return { address: String(c.id), id: Number(c.id), creator: String(c.creator), name: c.name,
    emoji: EMOJIS[Number(c.id) % EMOJIS.length], maxMembers: Number(c.max_members),
    memberCount: Number(c.member_count), paidCount: Number(c.paid_count),
    contributionAmount: BigInt(c.contribution_amount ?? 0), currentRound: Number(c.current_round),
    totalRounds: members.length, poolBalance: BigInt(c.pool_balance ?? 0),
    nextPayoutTimestamp: Number(c.round_started_ts) + Number(c.frequency_secs),
    frequency: Number(c.frequency_secs), status: c.status === 'Completed' ? 2 : members.length < Number(c.max_members) ? 0 : 1,
    payoutPending: Boolean(c.payout_pending), members, myPosition: address ? members.indexOf(address) : -1,
    myPaidRound: -1 };
}
export function useCircles() {
  const { address } = useWallet();
  const { data, isLoading } = useQuery<CircleData[]>({
    queryKey: ['circles', address], enabled: !!address, refetchInterval: 60_000,
    queryFn: async () => {
      const ids = await viewContract<number[]>('get_user_circle_ids', { account: address! });
      const circles = await viewContract<any[]>('get_circles', { circle_codes: ids });
      return circles.filter(Boolean).map((c) => mapCircle(c, address));
    },
  });
  return { circles: data ?? [], isLoading };
}
export function useCircleMembers() {
  return useQuery({ queryKey: ['circleMembers'], enabled: false, queryFn: async () => [] });
}
