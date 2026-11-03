const RODA_MESSAGES: Record<string, string> = {
  BelowMinimumDeposit: 'Deposit is below the minimum for this vault.',
  VaultNotMatured: 'This vault is still locked — withdraw after it matures.',
  InsufficientBalance: 'Not enough balance for this action.',
  Unauthorized: 'This wallet is not allowed to do that.',
  InvalidContribution: 'Contribution must match the circle amount exactly.',
  InvalidFrequency: 'Round frequency must be at least 60 seconds.',
  CircleFull: 'This circle is full.',
  RoundNotReady: 'The payout window has not opened yet.',
  NotYourPayout: "It's not your turn to claim the payout.",
  NameTaken: 'That username is already taken.',
  FaucetCooldown: 'Faucet already claimed today — come back tomorrow.',
};

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const code = message.match(/(?:RodaError:|ContractError:)?([A-Za-z][A-Za-z0-9]+)/)?.[1];
  if (code && RODA_MESSAGES[code]) return RODA_MESSAGES[code];
  if (/rejected|cancel/i.test(message)) return 'Request rejected in wallet.';
  if (/network|fetch/i.test(message)) return 'Network error — check your connection.';
  return message.length > 160 ? `${message.slice(0, 157)}…` : message || 'Something went wrong.';
}

export function isUserRejection(error: unknown): boolean {
  return /rejected|cancel/i.test(String(error));
}
