import * as Crypto from 'expo-crypto';

/** Smallest valid circle code (6 digits, no leading zero). */
export const CIRCLE_CODE_MIN = 100_000;

/** Largest valid circle code (6 digits). */
export const CIRCLE_CODE_MAX = 999_999;

const CODE_RANGE = CIRCLE_CODE_MAX - CIRCLE_CODE_MIN + 1;

/** Cryptographically random 6-digit circle code (100000–999999). */
export function randomCircleCode(): number {
  const [n] = Crypto.getRandomValues(new Uint32Array(1));
  return CIRCLE_CODE_MIN + (n % CODE_RANGE);
}

/** True when the value is a full 6-digit circle code. */
export function isValidCircleCode(value: number): boolean {
  return Number.isInteger(value) && value >= CIRCLE_CODE_MIN && value <= CIRCLE_CODE_MAX;
}

/** True when a create failed because that code's circle PDA already exists. */
export function isCodeCollision(error: unknown): boolean {
  const anyErr = error as any;
  const code: string | undefined =
    anyErr?.errorCode?.code ?? anyErr?.error?.errorCode?.code;
  if (code === 'AccountAlreadyInUse' || code === 'ConstraintSeeds') return true;
  const msg = String(anyErr?.errorMessage ?? anyErr?.error?.message ?? anyErr?.message ?? error);
  return /already in use|constraint seeds/i.test(msg);
}
