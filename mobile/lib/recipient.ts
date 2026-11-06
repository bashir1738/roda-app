export class NearAddress {
  constructor(private readonly value: string) {}
  toString() { return this.value; }
}

export async function resolveRecipient(input: string): Promise<{
  address: NearAddress;
  input: string;
  name?: string;
}> {
  const value = input.trim().toLowerCase();
  if (!/^[a-z0-9._-]{2,64}$/.test(value)) {
    throw new Error('Enter a valid NEAR account ID.');
  }
  return { address: new NearAddress(value), input };
}
