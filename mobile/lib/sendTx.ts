const RODA_MESSAGES: Record<string, string> = {
  BelowMinimumDeposit: 'Deposit is below the minimum for this vault.',
  VaultNotMatured: 'This vault is still locked — withdraw after it matures.',
  InsufficientBalance: 'Not enough balance for this action.',
  Unauthorized: 'This wallet is not allowed to do that.',
  InvalidContribution: 'Contribution must match the circle amount exactly.',
  InvalidFrequency: 'Round frequency must be at least 60 seconds.',
  InvalidCircleName: 'Circle name must be between 3 and 32 characters.',
  InvalidCircleCode: 'Circle code must be 6 digits (100000–999999).',
  InvalidMemberCount: 'Member count must be between 2 and 12 members.',
  CircleFull: 'This circle is full.',
  CircleNotJoinable: 'Cannot join circle (round already started or you already joined).',
  CircleCodeTaken: 'A circle with this code already exists. Please try another code.',
  AlreadyPaid: 'You have already contributed to this round.',
  NotAllPaid: 'All members must contribute before claiming the payout.',
  PendingTransfer: 'A payout transfer is already in progress for this circle.',
  RoundNotReady: 'The payout window has not opened yet.',
  NotYourPayout: "It's not your turn to claim the payout.",
  NameTaken: 'That username is already taken.',
  FaucetCooldown: 'Faucet already claimed today — come back tomorrow.',
  FaucetUnavailable: 'The test faucet is currently disabled.',
  // Community coordination, reputation, rewards & collective ownership
  InsufficientReputation: 'Your Roda reputation score is below the required minimum.',
  DaoAlreadyLinked: 'That Sputnik DAO is already linked to another community.',
  AlreadyLinked: 'This community is already linked to its DAO.',
  CommunityNotFound: 'Community not found.',
  CommunityNotLinked: 'This community must link its DAO via Sputnik proposal first.',
  CommunityDissolved: 'This community has been dissolved.',
  CommunityNotDissolved: 'Surplus claims unlock only after the community dissolves.',
  EnvelopeNotFound: 'Budget envelope not found.',
  EnvelopeInactive: 'This budget envelope is closed.',
  ExceedsEnvelope: 'Spend exceeds the remaining balance in this envelope.',
  InsufficientPool: 'Not enough unallocated pool balance for that allocation.',
  TooManyEnvelopes: 'A community can have at most 12 budget envelopes.',
  TooManyCommunities: 'You have reached the maximum number of communities.',
  InvalidCommunityName: 'Community name must be between 3 and 48 characters.',
  InvalidEnvelopeName: 'Envelope name must be between 2 and 32 characters.',
  InvalidReputationThreshold: 'Reputation threshold must be between 0 and 1000.',
  TooManyRewardRules: 'Maximum reward rules reached for this community.',
  RewardRuleNotFound: 'Reward rule not found.',
  InvalidTrigger: 'Reward trigger parameters are invalid.',
  ActiveEnvelopesRemaining: 'Close all budget envelopes before dissolving the community.',
  NoSharesToClaim: 'You hold no ownership shares in this community.',
  NoSurplusToClaim: 'There is no remaining surplus to claim.',
  SurplusAlreadyClaimed: 'You have already claimed your dissolution surplus.',
  UnauthorizedToken: 'Only the configured USDC token contract may credit deposits.',
};

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const code = message.match(/(?:RodaError:|ContractError:)?([A-Za-z][A-Za-z0-9]+)/)?.[1];
  if (code && RODA_MESSAGES[code]) return RODA_MESSAGES[code];
  if (/ERR_PERMISSION|not allowed to vote|HostVoter/i.test(message)) {
    return 'Your account lacks permission on this Sputnik DAO policy.';
  }
  if (/ERR_VOTE_BEFORE|already voted|Vote already cast/i.test(message)) {
    return 'You have already cast a vote on this proposal.';
  }
  if (/ERR_PROPOSAL_EXPIRED/i.test(message)) return 'This proposal has expired.';
  if (/does not have enough balance|lack balance|NotEnoughBalance/i.test(message)) {
    return 'Not enough NEAR balance to cover deposit and gas.';
  }
  if (/rejected|cancel/i.test(message)) return 'Request rejected in wallet.';
  if (/network|fetch/i.test(message)) return 'Network error — check your connection.';
  return message.length > 160 ? `${message.slice(0, 157)}…` : message || 'Something went wrong.';
}

export function isUserRejection(error: unknown): boolean {
  return /rejected|cancel/i.test(String(error));
}
