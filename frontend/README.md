# Roda frontend

The `frontend/` package is the Next.js 16 public landing page and product showcase for Roda (Circles, Solo Vaults, and Sputnik DAO + Trezu Community Coordination). It does not hold wallet secrets or submit contract calls; transaction flows live in the mobile client.

## Deployed Program & Contract Addresses (NEAR Testnet)

| Role | Account ID |
| --- | --- |
| **Roda Protocol Program** | `roda.dev-92ebb0b3c42c.testnet` |
| **NEP-141 Test USDC (`rUSDC`)** | `usdc.dev-92ebb0b3c42c.testnet` |
| **Sputnik DAO Factory** | `sputnikv2.testnet` |

## Development

```bash
npm install
npm run lint
npm run build
npm run dev
```

Public configuration template in `.env.example`:

```bash
NEXT_PUBLIC_NEAR_NETWORK=testnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.fastnear.com
NEXT_PUBLIC_CONTRACT_ID=roda.dev-92ebb0b3c42c.testnet
NEXT_PUBLIC_FT_ID=usdc.dev-92ebb0b3c42c.testnet
```
