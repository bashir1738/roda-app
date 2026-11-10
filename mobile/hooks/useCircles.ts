import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { viewContract } from '../lib/contract';

export interface CircleData {
  address: string;
  id: number;
  creator: string;
  name: string;
  emoji: string;
  maxMembers: number;
  memberCount: number;
  paidCount: number;
  contributionAmount: bigint;
  currentRound: number;
  totalRounds: number;
  poolBalance: bigint;
  nextPayoutTimestamp: number;
  frequency: number;
  status: 0 | 1 | 2;
  payoutPending: boolean;
  payoutReady: boolean;
  isMyTurn: boolean;
  minReputation: number;
  members: string[];
  paid: string[];
  myPosition: number;
  myPaidRound: number;
}

const EMOJIS = ['💼', '👑', '🌿', '🎯', '🔥', '💎', '🚀', '🌟'];

function mapCircle(c: any, address?: string): CircleData {
  const members: string[] = c.members ?? [];
  const paid: string[] = c.paid ?? [];
  const currentRound = Number(c.current_round ?? 0);
  const maxMembers = Number(c.max_members ?? 0);
  const memberCount = Number(c.member_count ?? members.length);
  const paidCount = Number(c.paid_count ?? paid.length);
  const myPosition = address ? members.indexOf(address) : -1;
  const hasPaidCurrentRound = !!address && paid.includes(address);
  const allPaid = memberCount >= maxMembers && paidCount >= maxMembers && maxMembers > 0;
  const nextPayoutTs = Number(c.round_started_ts ?? 0) + Number(c.frequency_secs ?? 0);
  const isMyTurn = myPosition >= 0 && members.length > 0 && myPosition === (currentRound % members.length);
  const isPayoutReady = allPaid && (Date.now() / 1000 >= nextPayoutTs) && !Boolean(c.payout_pending) && c.status !== 'Completed';

  return {
    address: String(c.id),
    id: Number(c.id),
    creator: String(c.creator),
    name: c.name,
    emoji: EMOJIS[Number(c.id) % EMOJIS.length],
    maxMembers,
    memberCount,
    paidCount,
    contributionAmount: BigInt(c.contribution_amount ?? 0),
    currentRound,
    totalRounds: maxMembers,
    poolBalance: BigInt(c.pool_balance ?? 0),
    nextPayoutTimestamp: nextPayoutTs,
    frequency: Number(c.frequency_secs ?? 0),
    status: c.status === 'Completed' ? 2 : members.length < maxMembers ? 0 : 1,
    payoutPending: Boolean(c.payout_pending),
    payoutReady: isPayoutReady,
    isMyTurn,
    minReputation: Number(c.min_reputation ?? 0),
    members,
    paid,
    myPosition,
    myPaidRound: hasPaidCurrentRound ? currentRound : -1,
  };
}

export function useCircles() {
  const { address } = useWallet();
  const { data, isLoading } = useQuery<CircleData[]>({
    queryKey: ['circles', address],
    enabled: !!address,
    refetchInterval: 30_000,
    queryFn: async () => {
      const ids = await viewContract<number[]>('get_user_circle_ids', { account: address! });
      const circles = await viewContract<any[]>('get_circles', { circle_codes: ids });
      return circles.filter(Boolean).map((c) => mapCircle(c, address));
    },
  });
  return { circles: data ?? [], isLoading };
}

export interface CircleMemberInfo {
  address: string;
  paidRound: number;
}

export function useCircleMembers(address?: string, members?: string[]) {
  return useQuery<CircleMemberInfo[]>({
    queryKey: ['circleMembers', address, members],
    enabled: false,
    queryFn: async () => [],
  });
}
