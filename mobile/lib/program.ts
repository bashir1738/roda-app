import { callContract, viewContract } from './contract';

/**
 * Compatibility facade for screens that have not yet moved to the explicit
 * contract helpers. New code should call `viewContract` or `callContract`.
 */
export function getProgram() {
  return { view: viewContract, call: callContract };
}
export type AnyProgram = ReturnType<typeof getProgram>;
