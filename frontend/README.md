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

`npm run dev` starts the Next.js server with `WATCHPACK_POLLING=1000` by default
(via `scripts/dev.mjs`) so internal file watching does not hit Linux
`inotify` instance limits (`Watchpack Error: EMFILE`). Override the interval if
needed (`WATCHPACK_POLLING=500 npm run dev`), or pass `WATCHPACK_POLLING=1000`
when invoking `npx next dev` directly:

```bash
cd frontend
npm run dev
```

If Next reports `Another next dev server is already running`, stop the process
shown in the message:

```bash
kill <pid>
```

The custom launcher removes a stale `.next/dev/lock` automatically when its
PID is no longer a live Next process for this frontend. It never removes the
lock for a matching live process.

Public configuration template in `.env.example`:

```bash
NEXT_PUBLIC_NEAR_NETWORK=testnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.fastnear.com
NEXT_PUBLIC_CONTRACT_ID=roda.dev-92ebb0b3c42c.testnet
NEXT_PUBLIC_FT_ID=3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af
```

Testnet USDC has no financial value. The Roda faucet is disabled because the
protocol cannot mint Circle-issued USDC.

## Android demo download

The current Android APK can be downloaded from the public Expo artifact:

[Download the Roda Android APK](https://expo.dev/artifacts/eas/72debAby9UF2RnLX7Ml-x6YwdDO_YZ6G5bL114sLeLc.apk)
