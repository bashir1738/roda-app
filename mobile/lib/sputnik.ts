import { Buffer } from 'buffer';
import {
  CONTRACT_ID,
  DAO_CREATE_DEPOSIT,
  DEFAULT_GRACE_PERIOD_NS,
  DEFAULT_VOTE_PERIOD_NS,
  FT_ID,
  FT_STORAGE_DEPOSIT,
  PROPOSAL_BOND,
  SPUTNIK_FACTORY_ID,
} from '../constants/roda';
import { getNearAccount, viewContract, viewToken } from './contract';
import { getNear } from './near';

// ─── Sputnik DAO v2 Types ─────────────────────────────────────────────────────

export type Vote = 'Approve' | 'Reject' | 'Remove';
export type VoteAction = 'VoteApprove' | 'VoteReject' | 'VoteRemove';

export type ProposalStatus =
  | 'InProgress'
  | 'Approved'
  | 'Rejected'
  | 'Removed'
  | 'Expired'
  | 'Moved'
  | 'Failed';

export interface VotePolicy {
  weight_kind: 'TokenWeight' | 'RoleWeight';
  quorum: string;
  threshold: [number, number] | string;
}

export type RoleKind = 'Everyone' | { Member: string } | { Group: string[] };

export interface RolePermission {
  name: string;
  kind: RoleKind;
  permissions: string[];
  vote_policy: Record<string, VotePolicy>;
}

export interface PolicyView {
  roles: RolePermission[];
  default_vote_policy: VotePolicy;
  proposal_bond: string;
  proposal_period: string;
  bounty_bond: string;
  bounty_forgiveness_period: string;
}

export interface DaoConfigView {
  name: string;
  purpose: string;
  metadata: string;
}

export interface ActionCall {
  method_name: string;
  args: string;
  deposit: string;
  gas: string;
}

export interface BountySpec {
  description: string;
  token: string;
  amount: string;
  times: number;
  max_deadline: string;
}

export type ProposalKind =
  | 'Vote'
  | {
      Transfer: {
        token_id: string;
        receiver_id: string;
        amount: string;
        msg: string | null;
      };
    }
  | {
      FunctionCall: {
        receiver_id: string;
        actions: ActionCall[];
      };
    }
  | {
      AddBounty: {
        bounty: BountySpec;
      };
    }
  | {
      BountyDone: {
        bounty_id: number;
        receiver_id: string;
      };
    }
  | {
      ChangePolicy: {
        policy: PolicyView;
      };
    }
  | Record<string, unknown>;

export interface ProposalView {
  id: number;
  proposer: string;
  description: string;
  kind: ProposalKind;
  status: ProposalStatus;
  vote_counts: Record<string, [string, string, string]>;
  votes: Record<string, Vote>;
  submission_time: string;
}

export interface BountyOutput {
  id: number;
  description: string;
  token: string;
  amount: string;
  times: number;
  max_deadline: string;
}

export interface BountyClaim {
  bounty_id: number;
  start_time: string;
  deadline: string;
  completed: boolean;
}

// ─── Serialization & Factory Builders ─────────────────────────────────────────

export function encodeArgsBase64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');
}

export function decodeArgsBase64<T = Record<string, unknown>>(b64: string): T | null {
  try {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export interface BuildPolicyArgsInput {
  name: string;
  purpose?: string;
  council: string[];
  thresholdNum?: number;
  thresholdDen?: number;
  proposalBond?: string;
  proposalPeriodNs?: string;
  bountyBond?: string;
  bountyForgivenessPeriodNs?: string;
}

export function buildDaoInitArgs(input: BuildPolicyArgsInput): {
  config: DaoConfigView;
  policy: PolicyView;
} {
  const council = Array.from(
    new Set(input.council.map((a) => a.trim().toLowerCase()).filter(Boolean)),
  );
  const den = Math.max(1, input.thresholdDen ?? council.length);
  const num = Math.max(1, Math.min(den, input.thresholdNum ?? Math.floor(den / 2) + 1));

  return {
    config: {
      name: input.name.trim(),
      purpose: input.purpose?.trim() || `${input.name.trim()} community treasury & Roda governance`,
      metadata: '',
    },
    policy: {
      roles: [
        {
          name: 'council',
          kind: { Group: council },
          permissions: ['*:*'],
          vote_policy: {},
        },
        {
          name: 'all',
          kind: 'Everyone',
          permissions: ['*:AddProposal', '*:VoteApprove', '*:VoteReject', '*:VoteRemove'],
          vote_policy: {},
        },
      ],
      default_vote_policy: {
        weight_kind: 'RoleWeight',
        quorum: '0',
        threshold: [num, den],
      },
      proposal_bond: input.proposalBond ?? PROPOSAL_BOND,
      proposal_period: input.proposalPeriodNs ?? DEFAULT_VOTE_PERIOD_NS,
      bounty_bond: input.bountyBond ?? PROPOSAL_BOND,
      bounty_forgiveness_period: input.bountyForgivenessPeriodNs ?? DEFAULT_GRACE_PERIOD_NS,
    },
  };
}

export function sanitizeDaoSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return slug || `comm-${Date.now().toString(36)}`;
}

// ─── View Calls ───────────────────────────────────────────────────────────────

export async function viewDao<T>(
  daoId: string,
  methodName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return viewContract<T>(methodName, args, daoId);
}

export async function getDaoConfig(daoId: string): Promise<DaoConfigView> {
  return viewDao<DaoConfigView>(daoId, 'get_config');
}

export async function getDaoPolicy(daoId: string): Promise<PolicyView> {
  return viewDao<PolicyView>(daoId, 'get_policy');
}

export async function getLastProposalId(daoId: string): Promise<number> {
  return viewDao<number>(daoId, 'get_last_proposal_id');
}

export async function getDaoProposal(daoId: string, id: number): Promise<ProposalView> {
  return viewDao<ProposalView>(daoId, 'get_proposal', { id });
}

export async function getDaoProposals(
  daoId: string,
  fromIndex = 0,
  limit = 30,
): Promise<ProposalView[]> {
  const lastId = await getLastProposalId(daoId);
  if (lastId <= 0) return [];
  const start = Math.max(0, lastId - fromIndex - limit);
  const count = Math.min(limit, lastId - fromIndex);
  if (count <= 0) return [];
  const list = await viewDao<ProposalView[]>(daoId, 'get_proposals', {
    from_index: start,
    limit: count,
  });
  return [...list].sort((a, b) => b.id - a.id);
}

export async function getDaoBounties(
  daoId: string,
  fromIndex = 0,
  limit = 30,
): Promise<BountyOutput[]> {
  return viewDao<BountyOutput[]>(daoId, 'get_bounties', {
    from_index: fromIndex,
    limit,
  });
}

export async function getDaoBountyClaims(
  daoId: string,
  accountId: string,
): Promise<BountyClaim[]> {
  return viewDao<BountyClaim[]>(daoId, 'get_bounty_claims', {
    account_id: accountId,
  });
}

export async function getDaoNearBalance(daoId: string): Promise<string> {
  const near = await getNear();
  const state = await near.connection.provider.query<{
    block_height: number;
    block_hash: string;
    amount: string;
  }>({
    request_type: 'view_account',
    account_id: daoId,
    finality: 'final',
  });
  return state.amount;
}

export async function getDaoTokenBalance(
  daoId: string,
  tokenId: string = FT_ID,
): Promise<string> {
  return viewToken<string>('ft_balance_of', { account_id: daoId }, tokenId);
}

export async function isTokenRegistered(
  accountId: string,
  tokenId: string = FT_ID,
): Promise<boolean> {
  const res = await viewToken<{ total: string; available: string } | null>(
    'storage_balance_of',
    { account_id: accountId },
    tokenId,
  );
  return res !== null;
}

// ─── Write Calls ──────────────────────────────────────────────────────────────

export async function createDao(
  accountId: string,
  name: string,
  policyInput: Omit<BuildPolicyArgsInput, 'name'>,
  deposit: string = DAO_CREATE_DEPOSIT,
  factoryId: string = SPUTNIK_FACTORY_ID,
): Promise<{ txHash: string; daoId: string }> {
  const slug = sanitizeDaoSlug(name);
  const initArgs = buildDaoInitArgs({ name, ...policyInput });
  const encoded = encodeArgsBase64(initArgs);
  const account = await getNearAccount(accountId);
  const result = await account.functionCall({
    contractId: factoryId,
    methodName: 'create',
    args: { name: slug, args: encoded },
    gas: BigInt('180000000000000'),
    attachedDeposit: BigInt(deposit),
  });
  return {
    txHash: result.transaction.hash,
    daoId: `${slug}.${factoryId}`,
  };
}

export async function ensureDaoFtRegistered(
  signerAccountId: string,
  daoId: string,
  tokenId: string = FT_ID,
): Promise<string | null> {
  const registered = await isTokenRegistered(daoId, tokenId).catch(() => false);
  if (registered) return null;
  const account = await getNearAccount(signerAccountId);
  const result = await account.functionCall({
    contractId: tokenId,
    methodName: 'storage_deposit',
    args: { account_id: daoId, registration_only: true },
    gas: BigInt('30000000000000'),
    attachedDeposit: BigInt(FT_STORAGE_DEPOSIT),
  });
  return result.transaction.hash;
}

async function resolveProposalBond(daoId: string, explicitBond?: string): Promise<string> {
  if (explicitBond) return explicitBond;
  try {
    const policy = await getDaoPolicy(daoId);
    return policy.proposal_bond || PROPOSAL_BOND;
  } catch {
    return PROPOSAL_BOND;
  }
}

export async function addProposal(
  accountId: string,
  daoId: string,
  params: { description: string; kind: ProposalKind; bond?: string },
): Promise<string> {
  const bond = await resolveProposalBond(daoId, params.bond);
  const account = await getNearAccount(accountId);
  const result = await account.functionCall({
    contractId: daoId,
    methodName: 'add_proposal',
    args: {
      proposal: {
        description: params.description,
        kind: params.kind,
      },
    },
    gas: BigInt('100000000000000'),
    attachedDeposit: BigInt(bond),
  });
  return result.transaction.hash;
}

export interface RodaActionCallSpec {
  methodName: string;
  args: Record<string, unknown>;
  deposit?: string;
  gas?: string;
}

export async function addFunctionCallProposal(
  accountId: string,
  daoId: string,
  description: string,
  actions: RodaActionCallSpec[],
  receiverId: string = CONTRACT_ID,
  bond?: string,
): Promise<string> {
  return addProposal(accountId, daoId, {
    description,
    bond,
    kind: {
      FunctionCall: {
        receiver_id: receiverId,
        actions: actions.map((a) => ({
          method_name: a.methodName,
          args: encodeArgsBase64(a.args),
          deposit: a.deposit ?? '0',
          gas: a.gas ?? '80000000000000',
        })),
      },
    },
  });
}

export async function addTransferProposal(
  accountId: string,
  daoId: string,
  description: string,
  params: { tokenId: string; receiverId: string; amount: string; msg?: string | null },
  bond?: string,
): Promise<string> {
  return addProposal(accountId, daoId, {
    description,
    bond,
    kind: {
      Transfer: {
        token_id: params.tokenId,
        receiver_id: params.receiverId,
        amount: params.amount,
        msg: params.msg ?? null,
      },
    },
  });
}

export async function addBountyProposal(
  accountId: string,
  daoId: string,
  description: string,
  bounty: BountySpec,
  bond?: string,
): Promise<string> {
  return addProposal(accountId, daoId, {
    description,
    bond,
    kind: { AddBounty: { bounty } },
  });
}

export async function addBountyDoneProposal(
  accountId: string,
  daoId: string,
  description: string,
  bountyId: number,
  receiverId: string,
  bond?: string,
): Promise<string> {
  return addProposal(accountId, daoId, {
    description,
    bond,
    kind: {
      BountyDone: {
        bounty_id: bountyId,
        receiver_id: receiverId,
      },
    },
  });
}

export async function actProposal(
  accountId: string,
  daoId: string,
  proposalId: number,
  action: VoteAction,
): Promise<string> {
  const account = await getNearAccount(accountId);
  const result = await account.functionCall({
    contractId: daoId,
    methodName: 'act_proposal',
    args: { id: proposalId, action },
    gas: BigInt('250000000000000'),
    attachedDeposit: 0n,
  });
  return result.transaction.hash;
}

export async function claimBounty(
  accountId: string,
  daoId: string,
  bountyId: number,
  deadlineNs: string,
  bond?: string,
): Promise<string> {
  let bountyBond = bond;
  if (!bountyBond) {
    try {
      const policy = await getDaoPolicy(daoId);
      bountyBond = policy.bounty_bond || PROPOSAL_BOND;
    } catch {
      bountyBond = PROPOSAL_BOND;
    }
  }
  const account = await getNearAccount(accountId);
  const result = await account.functionCall({
    contractId: daoId,
    methodName: 'bounty_claim',
    args: { id: bountyId, deadline: deadlineNs },
    gas: BigInt('100000000000000'),
    attachedDeposit: BigInt(bountyBond),
  });
  return result.transaction.hash;
}

export async function giveupBounty(
  accountId: string,
  daoId: string,
  bountyId: number,
): Promise<string> {
  const account = await getNearAccount(accountId);
  const result = await account.functionCall({
    contractId: daoId,
    methodName: 'bounty_giveup',
    args: { id: bountyId },
    gas: BigInt('100000000000000'),
    attachedDeposit: 0n,
  });
  return result.transaction.hash;
}

/** Format a human-readable summary of a proposal kind. */
export function describeProposalKind(kind: ProposalKind): {
  badge: string;
  summary: string;
} {
  if (kind === 'Vote') {
    return { badge: 'Vote', summary: 'Governance poll' };
  }
  if (typeof kind === 'object' && kind !== null) {
    const k = kind as Record<string, any>;
    if (k.Transfer) {
      const t = k.Transfer as { token_id?: string; receiver_id?: string };
      const asset = t.token_id ? 'USDC/FT' : 'NEAR';
      return {
        badge: 'Transfer',
        summary: `Send ${asset} to ${t.receiver_id ?? ''}`,
      };
    }
    if (k.FunctionCall) {
      const fc = k.FunctionCall as { receiver_id?: string; actions?: ActionCall[] };
      const methods = (fc.actions ?? []).map((a) => a.method_name).join(', ');
      return {
        badge: 'Call',
        summary: `${fc.receiver_id ?? ''} -> ${methods}()`,
      };
    }
    if (k.AddBounty?.bounty) {
      return {
        badge: 'Bounty',
        summary: String(k.AddBounty.bounty.description ?? 'Bounty'),
      };
    }
    if (k.BountyDone) {
      return {
        badge: 'Payout',
        summary: `Bounty #${k.BountyDone.bounty_id} -> ${k.BountyDone.receiver_id}`,
      };
    }
    if (k.ChangePolicy) {
      return { badge: 'Policy', summary: 'Update DAO governance policy' };
    }
    if (k.AddMemberToRole) {
      return {
        badge: 'Member',
        summary: `Add ${k.AddMemberToRole.member_id} to ${k.AddMemberToRole.role}`,
      };
    }
    if (k.RemoveMemberFromRole) {
      return {
        badge: 'Member',
        summary: `Remove ${k.RemoveMemberFromRole.member_id} from ${k.RemoveMemberFromRole.role}`,
      };
    }
  }
  return { badge: 'Proposal', summary: 'Governance action' };
}
