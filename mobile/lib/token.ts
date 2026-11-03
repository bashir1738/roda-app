export const tokenAmount = (amount: number, decimals: number) =>
  BigInt(Math.round(amount * 10 ** decimals)).toString();
