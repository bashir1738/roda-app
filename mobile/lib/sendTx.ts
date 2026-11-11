export type ErrorCategory =
  | 'wallet'
  | 'balance'
  | 'timing'
  | 'governance'
  | 'reputation'
  | 'network'
  | 'cancelled'
  | 'validation'
  | 'generic';

export interface ErrorDetails {
  category: ErrorCategory;
  title: string;
  message: string;
  hint?: string;
  actionLabel: string;
}

type RodaMessageSpec = Omit<ErrorDetails, 'actionLabel'> & {
  actionLabel?: string;
};

const RODA_MESSAGES: Record<string, RodaMessageSpec> = {
  // Vaults & general balance
  BelowMinimumDeposit: {
    category: 'validation',
    title: 'Deposit is a bit too small',
    message: 'This savings vault requires a higher minimum deposit to get started.',
    hint: 'Pick the Min quick-fill option or enter at least the vault minimum.',
  },
  VaultNotMatured: {
    category: 'timing',
    title: 'This vault is still locked',
    message: 'Your savings are safely locked until the maturity date arrives.',
    hint: 'Come back once the countdown completes to withdraw your funds.',
    actionLabel: 'Got it',
  },
  VaultNotFound: {
    category: 'validation',
    title: "We couldn't find that vault",
    message: "This vault doesn't exist or may have already been closed.",
    actionLabel: 'Close',
  },
  VaultNotActive: {
    category: 'timing',
    title: 'This vault is already closed',
    message: 'This savings vault has finished and can no longer accept deposits.',
    actionLabel: 'Got it',
  },
  VaultAlreadyClosed: {
    category: 'timing',
    title: 'Vault already closed',
    message: 'This vault was already wrapped up earlier.',
    actionLabel: 'Close',
  },
  InsufficientBalance: {
    category: 'balance',
    title: 'Not enough funds available',
    message: "There isn't quite enough balance to complete that amount.",
    hint: 'Check your available USDC or enter a smaller amount.',
    actionLabel: 'Adjust amount',
  },
  Unauthorized: {
    category: 'governance',
    title: 'Action not allowed for this wallet',
    message: 'Only an authorized owner or linked community DAO can perform this step.',
    hint: 'Make sure you are signed in with the right NEAR account.',
    actionLabel: 'Got it',
  },
  InvalidAmount: {
    category: 'validation',
    title: 'Check that amount',
    message: 'Enter a positive amount above zero before continuing.',
    actionLabel: 'Fix amount',
  },
  InvalidTier: {
    category: 'validation',
    title: 'Unknown vault tier',
    message: 'That vault tier is not supported on this version of Roda.',
  },

  // Savings circles (ROSCA)
  InvalidContribution: {
    category: 'validation',
    title: 'Exact contribution required',
    message: 'Each circle contribution has to match the round amount down to the cent.',
    hint: 'Use the preset contribution amount shown on the circle card.',
  },
  InvalidFrequency: {
    category: 'validation',
    title: 'Schedule interval is too short',
    message: 'Circle rounds need to be spaced at least 60 seconds apart.',
  },
  InvalidCircleName: {
    category: 'validation',
    title: 'Adjust your circle name',
    message: 'Circle names work best between 3 and 32 characters.',
  },
  InvalidCircleCode: {
    category: 'validation',
    title: 'Invalid 6-digit circle code',
    message: 'Circle codes must be a 6-digit number between 100000 and 999999.',
  },
  InvalidMemberCount: {
    category: 'validation',
    title: 'Check the group size',
    message: 'A savings circle needs between 2 and 12 members.',
  },
  CircleFull: {
    category: 'timing',
    title: 'This circle is already full',
    message: 'Every seat in this savings circle has already been taken.',
    hint: 'Ask the organizer to start a new circle, or create one yourself.',
    actionLabel: 'Got it',
  },
  CircleNotJoinable: {
    category: 'timing',
    title: 'Sign-ups are closed for this circle',
    message: 'This circle has either started its rounds already or you are already a member.',
    actionLabel: 'Got it',
  },
  CircleCodeTaken: {
    category: 'validation',
    title: 'That circle code is already used',
    message: 'Another circle on Roda already picked that 6-digit code.',
    hint: 'Tap Try again to generate a fresh code automatically.',
  },
  CircleNotFound: {
    category: 'validation',
    title: 'Circle not found',
    message: "We couldn't find an active circle with that code on NEAR.",
    hint: 'Double-check the 6-digit code shared by your organizer.',
  },
  CircleNotCompleted: {
    category: 'timing',
    title: 'Circle still in progress',
    message: 'Wait until the final payout round wraps up before closing the circle.',
    actionLabel: 'Got it',
  },
  NotAMember: {
    category: 'governance',
    title: 'Members only',
    message: 'Only joined members of this circle can contribute to its rounds.',
    actionLabel: 'Got it',
  },
  AlreadyPaid: {
    category: 'timing',
    title: "You're already covered this round",
    message: 'Your contribution for the current round is already recorded on-chain.',
    hint: 'Nothing else needed until the next round opens.',
    actionLabel: 'Awesome',
  },
  NotAllPaid: {
    category: 'timing',
    title: 'Waiting on a few circle members',
    message: 'Everyone in the circle needs to contribute before the payout can be released.',
    hint: 'Nudge any pending members shown on the circle card.',
    actionLabel: 'Got it',
  },
  PendingTransfer: {
    category: 'timing',
    title: 'Transfer already on the way',
    message: 'A previous payout or spend transfer is still settling on NEAR.',
    hint: 'Give it a few seconds to finalize, then refresh.',
    actionLabel: 'Got it',
  },
  RoundNotReady: {
    category: 'timing',
    title: 'Payout window opens soon',
    message: "This round's scheduled payout time hasn't arrived just yet.",
    hint: 'Check the countdown on your circle screen and come back when it hits zero.',
    actionLabel: 'Got it',
  },
  NotYourPayout: {
    category: 'timing',
    title: "Another member's turn this round",
    message: "It isn't your scheduled payout turn in this round yet.",
    hint: 'You can see who is next in line right inside the circle details.',
    actionLabel: 'Got it',
  },

  // Usernames & faucet
  NameTaken: {
    category: 'validation',
    title: 'That handle is already claimed',
    message: 'Someone else already registered that username on Roda.',
    hint: 'Try adding a number or underscore to make it uniquely yours.',
  },
  NameTooShort: {
    category: 'validation',
    title: 'Username is a bit short',
    message: 'Pick a handle with at least 3 characters.',
  },
  NameTooLong: {
    category: 'validation',
    title: 'Username is a bit too long',
    message: 'Keep your handle at 20 characters or fewer.',
  },
  InvalidNameChars: {
    category: 'validation',
    title: 'Check your username characters',
    message: 'Use lowercase letters, numbers, and underscores only.',
  },
  NameNotSet: {
    category: 'validation',
    title: 'No on-chain username yet',
    message: "This wallet hasn't claimed a username on Roda yet.",
  },
  FaucetCooldown: {
    category: 'timing',
    title: 'Faucet resting until tomorrow',
    message: "You've already claimed test USDC today — your daily refill resets in 24 hours.",
    actionLabel: 'Got it',
  },
  CooldownActive: {
    category: 'timing',
    title: 'Cooling down for a moment',
    message: 'Please wait until the cooldown finishes before claiming again.',
    actionLabel: 'Got it',
  },
  FaucetUnavailable: {
    category: 'timing',
    title: 'Test faucet is paused right now',
    message: 'The testnet USDC faucet is temporarily turned off.',
    actionLabel: 'Close',
  },

  // Community coordination, Sputnik DAO, reputation, rewards & ownership
  InsufficientReputation: {
    category: 'reputation',
    title: 'A little more Roda reputation needed',
    message: 'Your current Roda reputation score is below the minimum set for this action.',
    hint: 'Save in vaults, pay circle rounds on time, or fund community budgets to grow your score.',
    actionLabel: 'Got it',
  },
  DaoAlreadyLinked: {
    category: 'validation',
    title: 'DAO already connected elsewhere',
    message: 'That Sputnik DAO is already managing another community on Roda.',
    hint: 'Choose a different DAO address or create a fresh one.',
  },
  AlreadyLinked: {
    category: 'timing',
    title: 'Community already linked',
    message: 'This community is already verified and connected to its Sputnik DAO.',
    actionLabel: 'Done',
  },
  CommunityNotFound: {
    category: 'validation',
    title: "Couldn't find that community",
    message: "This community doesn't exist or couldn't be loaded from NEAR.",
  },
  CommunityNotLinked: {
    category: 'governance',
    title: 'Approve the link proposal first',
    message: 'Your Sputnik DAO needs to approve its confirm_link proposal before escrow funds can move.',
    hint: 'Open the Proposals tab in your community dashboard and vote Approve.',
    actionLabel: 'Got it',
  },
  CommunityDissolved: {
    category: 'governance',
    title: 'This community has been dissolved',
    message: 'New allocations, spends, and rules are paused now that the community dissolved.',
    hint: 'Shareholders can still claim any remaining surplus in the community dashboard.',
    actionLabel: 'Got it',
  },
  CommunityNotDissolved: {
    category: 'governance',
    title: 'Community is still active',
    message: 'Surplus claims only unlock after the DAO approves dissolving the community.',
    actionLabel: 'Got it',
  },
  EnvelopeNotFound: {
    category: 'validation',
    title: 'Budget envelope not found',
    message: "We couldn't find that budget envelope inside this community.",
  },
  EnvelopeInactive: {
    category: 'governance',
    title: 'This budget envelope is closed',
    message: "Closed envelopes can't receive new allocations or payouts.",
    hint: 'Re-open the envelope or select an active one instead.',
    actionLabel: 'Got it',
  },
  ExceedsEnvelope: {
    category: 'balance',
    title: 'Over this envelope budget',
    message: 'That amount is larger than the remaining balance inside the selected envelope.',
    hint: 'Allocate more from the unallocated pool first, or lower the spend amount.',
    actionLabel: 'Adjust amount',
  },
  InsufficientPool: {
    category: 'balance',
    title: 'Not enough in the unallocated pool',
    message: "There isn't enough unallocated USDC in the community pool for that transfer.",
    hint: 'Ask members to fund the pool first, or allocate a smaller amount.',
    actionLabel: 'Got it',
  },
  TooManyEnvelopes: {
    category: 'validation',
    title: 'Envelope limit reached',
    message: 'Each community can have up to 12 budget envelopes.',
    hint: 'Close or reuse an existing envelope to free up space.',
  },
  TooManyCommunities: {
    category: 'validation',
    title: 'Community limit reached',
    message: 'Your account has reached the maximum number of communities it can manage.',
  },
  InvalidCommunityName: {
    category: 'validation',
    title: 'Check the community name',
    message: 'Pick a clear community name between 3 and 48 characters long.',
  },
  InvalidEnvelopeName: {
    category: 'validation',
    title: 'Check the envelope name',
    message: 'Budget envelope names must be between 2 and 32 characters long.',
  },
  InvalidReputationThreshold: {
    category: 'validation',
    title: 'Reputation threshold out of range',
    message: 'Choose a reputation score requirement between 0 and 1000.',
  },
  TooManyRewardRules: {
    category: 'validation',
    title: 'Auto-reward rule limit reached',
    message: 'This community already has the maximum number of active reward rules.',
  },
  RewardRuleNotFound: {
    category: 'validation',
    title: 'Reward rule not found',
    message: "That automated reward rule doesn't exist or was already removed.",
  },
  InvalidTrigger: {
    category: 'validation',
    title: 'Check the reward trigger',
    message: 'Streak milestones need at least 1 required contribution to activate.',
  },
  ActiveEnvelopesRemaining: {
    category: 'governance',
    title: 'Close open envelopes first',
    message: 'All budget envelopes must be closed before dissolving the community.',
    hint: 'Closing envelopes automatically returns unspent balances to the shared pool.',
    actionLabel: 'Got it',
  },
  NoSharesToClaim: {
    category: 'governance',
    title: 'No ownership shares held',
    message: "Your wallet doesn't hold any ownership shares in this community.",
    actionLabel: 'Got it',
  },
  NoSurplusToClaim: {
    category: 'balance',
    title: 'No surplus remaining',
    message: "There isn't any unclaimed surplus left in the community pool.",
    actionLabel: 'Got it',
  },
  SurplusAlreadyClaimed: {
    category: 'timing',
    title: 'Surplus already claimed',
    message: "You've already withdrawn your share of the dissolved community surplus.",
    actionLabel: 'Got it',
  },
  UnauthorizedToken: {
    category: 'governance',
    title: 'Unsupported token contract',
    message: 'Only the configured Roda USDC token can fund savings and community budgets.',
    actionLabel: 'Got it',
  },
  InvalidToken: {
    category: 'governance',
    title: 'Unsupported token contract',
    message: 'Please use the Roda USDC token configured for this app.',
    actionLabel: 'Got it',
  },
  MathOverflow: {
    category: 'validation',
    title: 'Amount is outside valid limits',
    message: 'That number is too large to calculate safely — try a smaller amount.',
  },

  // Pre-flight wallet & NEAR funding states
  WalletNotConnected: {
    category: 'wallet',
    title: 'Connect a wallet first',
    message: 'Sign in with email or connect your Meteor wallet to continue.',
    actionLabel: 'Got it',
  },
  UnfundedAccount: {
    category: 'wallet',
    title: 'Activate your NEAR wallet first',
    message: "Your wallet address doesn't have any testnet NEAR on-chain yet, so it can't pay network fees.",
    hint: 'Copy your address from the Wallet tab and send a small amount of testnet NEAR.',
    actionLabel: 'Got it',
  },
  InsufficientNearForDao: {
    category: 'balance',
    title: 'Need ~6.2 NEAR to launch a DAO',
    message: 'Deploying a brand-new Sputnik DAO reserves ~6 NEAR for contract storage plus a tiny bit for gas.',
    hint: 'Top up your wallet with testnet NEAR, or switch to "Link Existing DAO".',
    actionLabel: 'Got it',
  },
};

function extractRawErrorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const anyErr = error as unknown as {
      type?: string;
      kind?: unknown;
      cause?: unknown;
      data?: unknown;
    };
    const parts = [error.message];
    if (anyErr.type) parts.push(anyErr.type);
    if (anyErr.kind && typeof anyErr.kind === 'object') {
      try {
        parts.push(JSON.stringify(anyErr.kind));
      } catch {}
    }
    return parts.filter(Boolean).join(' ');
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function unwrapSmartContractPanic(raw: string): string {
  const panicMatch = raw.match(/Smart contract panicked:\s*([^\n"\\}]+)/i);
  if (panicMatch?.[1]) return panicMatch[1].trim();
  const execMatch = raw.match(/ExecutionError[:\s"]+([^"\n}]+)/i);
  if (execMatch?.[1]) return execMatch[1].trim();
  return raw;
}

function sanitizeReadableFallback(raw: string): string {
  let clean = unwrapSmartContractPanic(raw)
    .replace(/^(?:Error|RpcError|ServerTransactionError):\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Never show raw serialized JSON objects or long base58 keys to humans
  if (
    clean.startsWith('{') ||
    clean.startsWith('[') ||
    /ed25519:[1-9A-HJ-NP-Za-km-z]{20,}/.test(clean)
  ) {
    return "Something interrupted that request before NEAR could finish it. Try once more in a moment.";
  }

  if (!clean) {
    return 'Something unexpected interrupted that step. Please try again.';
  }
  return clean.length > 150 ? `${clean.slice(0, 147)}…` : clean;
}

export function describeError(error: unknown): ErrorDetails {
  const raw = extractRawErrorText(error);
  const unwrapped = unwrapSmartContractPanic(raw);

  // 1. Cancelled / rejected in wallet (always check before wallet/network)
  if (/rejected|user denied|user closed|cancelled|canceled/i.test(raw)) {
    return {
      category: 'cancelled',
      title: 'No worries — paused at your cue',
      message: 'You cancelled the wallet approval, so nothing was submitted or spent.',
      actionLabel: 'Back',
    };
  }

  // 2. Match explicit Roda/pre-flight error codes anywhere in message or panic payload
  const explicitMatch = raw.match(/(?:RodaError:|ContractError:)([A-Za-z][A-Za-z0-9]+)/)?.[1];
  if (explicitMatch && RODA_MESSAGES[explicitMatch]) {
    const spec = RODA_MESSAGES[explicitMatch];
    return {
      ...spec,
      actionLabel: spec.actionLabel ?? 'Try again',
    };
  }
  const pascalTokens = raw.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? [];
  for (const token of pascalTokens) {
    if (RODA_MESSAGES[token]) {
      const spec = RODA_MESSAGES[token];
      return {
        ...spec,
        actionLabel: spec.actionLabel ?? 'Try again',
      };
    }
  }

  // 3. Match if the caller passed back a previously formatted RODA_MESSAGES sentence
  const matchedSpec = Object.values(RODA_MESSAGES).find(
    (spec) => spec.message === raw.trim(),
  );
  if (matchedSpec) {
    return {
      ...matchedSpec,
      actionLabel: matchedSpec.actionLabel ?? 'Try again',
    };
  }

  // 4. Local wallet / disconnected / session hints
  if (/wallet not connected|connect a wallet first|no wallet connected/i.test(raw)) {
    return {
      ...RODA_MESSAGES.WalletNotConnected,
      actionLabel: 'Got it',
    };
  }

  if (/wallet connection failed|no account returned by wallet/i.test(raw)) {
    return {
      category: 'wallet',
      title: "Wallet sign-in didn't finish",
      message: "Your external wallet didn't complete the sign-in handshake. Try connecting once more.",
      actionLabel: 'Try again',
    };
  }

  if (
    /access key .* doesn't exist|account .* doesn't exist|does not exist while viewing/i.test(
      raw,
    )
  ) {
    return {
      ...RODA_MESSAGES.UnfundedAccount,
      actionLabel: 'Got it',
    };
  }

  // 5. Sputnik factory & subaccount creation errors
  if (/AccountAlreadyExists|already exists/i.test(raw)) {
    return {
      category: 'validation',
      title: 'That DAO name is already taken',
      message: 'A Sputnik DAO with that exact web address already exists on NEAR.',
      hint: 'Go back one step and tweak your community name slightly.',
      actionLabel: 'Adjust name',
    };
  }

  // 6. Sputnik governance errors
  if (/ERR_PERMISSION|not allowed to vote|HostVoter|insufficient permissions/i.test(raw)) {
    return {
      category: 'governance',
      title: 'Council permission needed',
      message: "Your connected account isn't listed on this DAO's council for that action.",
      hint: 'Switch to a council wallet or ask a council member to vote.',
      actionLabel: 'Got it',
    };
  }

  if (/ERR_VOTE_BEFORE|already voted|Vote already cast/i.test(raw)) {
    return {
      category: 'governance',
      title: 'Your vote is already in',
      message: 'You already cast your vote on this proposal — thanks for participating!',
      actionLabel: 'Close',
    };
  }

  if (/ERR_PROPOSAL_EXPIRED|proposal has expired/i.test(raw)) {
    return {
      category: 'timing',
      title: 'Proposal voting window ended',
      message: 'This proposal expired before receiving enough votes to pass.',
      hint: 'You can create a fresh proposal anytime.',
      actionLabel: 'Got it',
    };
  }

  if (/ERR_INVALID_PROPOSAL|ERR_NO_BOUNTY|ERR_ALREADY_CLAIMED/i.test(raw)) {
    return {
      category: 'governance',
      title: 'Bounty or proposal unavailable',
      message: 'This proposal or bounty may have already been claimed or resolved.',
      actionLabel: 'Refresh',
    };
  }

  // 7. Token storage / balance / gas issues
  if (/is not registered|storage_deposit|Account does not have storage/i.test(raw)) {
    return {
      category: 'balance',
      title: 'Account needs USDC activation',
      message: 'That wallet has not activated its USDC storage slot yet.',
      hint: 'Ask the recipient to claim/receive USDC once, or deposit a tiny storage fee.',
      actionLabel: 'Got it',
    };
  }

  if (/LackBalanceForState|does not have enough balance|lack balance|NotEnoughBalance/i.test(raw)) {
    return {
      category: 'balance',
      title: 'Not enough NEAR for gas or bond',
      message: "Your wallet doesn't have enough NEAR right now to cover the deposit and network fee.",
      hint: 'Add a little testnet NEAR to your wallet address and try again.',
      actionLabel: 'Got it',
    };
  }

  if (/Exceeded the prepaid gas/i.test(raw)) {
    return {
      category: 'timing',
      title: 'Ran out of gas midway',
      message: 'NEAR paused the call before it finished executing.',
      hint: 'Try submitting once more — your tokens stayed safely in your wallet.',
      actionLabel: 'Try again',
    };
  }

  // 8. Network / RPC timeouts
  if (
    /network|fetch|timeout|ECONN|429|502|503|connection|offline|failed to query/i.test(
      raw,
    )
  ) {
    return {
      category: 'network',
      title: 'Having trouble reaching NEAR',
      message: 'The network connection blinked while talking to the NEAR blockchain.',
      hint: 'Check your Wi-Fi or mobile data and try again in a second.',
      actionLabel: 'Retry',
    };
  }

  // 9. Username / inline friendly validation strings passed through
  if (/at least 3|at most 20|lowercase letters/i.test(raw)) {
    return {
      category: 'validation',
      title: 'Check that handle',
      message: raw.trim(),
      actionLabel: 'Fix handle',
    };
  }

  // 10. Re-match previously formatted messages from this file
  if (/activated on-chain|doesn't have any testnet NEAR/i.test(raw)) {
    return { ...RODA_MESSAGES.UnfundedAccount, actionLabel: 'Got it' };
  }
  if (/~6\.2 NEAR|brand-new Sputnik DAO/i.test(raw)) {
    return { ...RODA_MESSAGES.InsufficientNearForDao, actionLabel: 'Got it' };
  }

  return {
    category: 'generic',
    title: "Hmm, that didn't quite go through",
    message: sanitizeReadableFallback(raw),
    hint: 'No funds were lost. Review the details or try once more.',
    actionLabel: 'Try again',
  };
}

export function friendlyError(error: unknown): string {
  return describeError(error).message;
}

export function isUserRejection(error: unknown): boolean {
  return /rejected|user denied|user closed|cancelled|canceled/i.test(
    extractRawErrorText(error),
  );
}
