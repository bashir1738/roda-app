# Roda frontend

The `frontend/` package is the Next.js 16 public landing page and product showcase for Roda. The product is delivered primarily through the bundled mobile app, whose five-tab experience is **Home, Circles, Community, Save, and Wallet**. The web frontend explains Circles, Solo Vaults, and Sputnik DAO + Trezu Community Coordination; it does not hold wallet secrets or submit contract calls, because transaction flows live in the mobile client.

## Deployed Program & Contract Addresses (NEAR Testnet)

| Role | Account ID |
| --- | --- |
| **Roda Protocol Program** | `roda.dev-92ebb0b3c42c.testnet` |
| **Circle USDC (NEAR testnet)** | `3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af` |
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
NEXT_PUBLIC_FT_ID=3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af
```

Testnet USDC has no financial value. The Roda faucet is disabled because the
protocol cannot mint Circle-issued USDC.
