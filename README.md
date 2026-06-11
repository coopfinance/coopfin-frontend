# coopfin-frontend

Next.js 14 dashboard for CoopFinance — the open-source cooperative finance platform on Stellar.

[![CI](https://github.com/coopfinance/coopfin-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/coopfinance/coopfin-frontend/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- 🏦 Group wallet management
- 💰 Contribution tracking & history
- 🏧 Loan requests and repayment
- 🗳️ Governance proposals and voting
- 📊 Treasury analytics dashboard
- 🔗 Stellar Wallets Kit (Freighter, LOBSTR, xBull)
- 🌙 Dark mode support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Charts**: Recharts
- **Wallet**: Stellar Wallets Kit
- **Stellar SDK**: @stellar/stellar-sdk v12

## Setup

```bash
git clone https://github.com/coopfinance/coopfin-frontend
cd coopfin-frontend
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_API_URL=http://localhost:3001

# Contract IDs (from coopfin-contracts deployments/testnet.json)
NEXT_PUBLIC_TREASURY_CONTRACT_ID=
NEXT_PUBLIC_LOAN_CONTRACT_ID=
NEXT_PUBLIC_VOTING_CONTRACT_ID=
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=
NEXT_PUBLIC_DIVIDEND_CONTRACT_ID=
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues labeled `good first issue` welcome.
