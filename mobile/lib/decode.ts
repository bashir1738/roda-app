export const toNumber = (value: unknown) => Number(value ?? 0);
export const toBigInt = (value: unknown) => BigInt(String(value ?? 0));
export const variantIndex = (value: unknown, variants: string[]) =>
  variants.indexOf(String(value));
