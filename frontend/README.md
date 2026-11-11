# Roda frontend

The `frontend/` package is the Next.js 16 public landing page and product showcase for Roda (Circles, Solo Vaults, and Sputnik DAO + Trezu Community Coordination). It does not hold wallet secrets or submit contract calls; transaction flows live in the mobile client.

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
NEXT_PUBLIC_CONTRACT_ID=roda.dev-92ebb0b3c42c.testnet
```
