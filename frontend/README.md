# Roda frontend

The `frontend/` package is the Next.js public landing page and product
marketing site. It does not hold wallet secrets or submit contract calls;
transaction flows live in the mobile client.

The landing page describes the NEAR testnet architecture:

- Rust / near-sdk contracts in [`program/`](../program/README.md)
- `near-api-js` account and view calls in [`mobile/`](../mobile/README.md)
- Magic email authentication, local device keys, and Meteor wallet bridging

## Development

```bash
npm install
npm run dev
```

Public configuration is documented in `.env.example`:

```bash
NEXT_PUBLIC_NEAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=roda.testnet
```

The contract account is a placeholder until deployment. No deployment or
frontend validation command was run during the migration.
