# OathRail

**Covenants for machine money on LitVM.**

OathRail is a prototype payment rail for AI agents. A user deposits zkLTC into a smart-contract vault, creates a bounded spending policy, and lets an AI agent propose and execute payments only inside that policy.

The core idea is simple: AI can plan, explain, and automate payments, but it should not be trusted with unlimited money. OathRail gives agents useful spending power while keeping final authority in code.

## Vision

AI agents are moving from chat interfaces into real economic workflows: buying services, paying contributors, renewing infrastructure, handling invoices, and coordinating operational spend. Today, most agent-payment designs are either too manual to be useful or too trusted to be safe.

OathRail aims to become a programmable spending layer for autonomous agents:

- users define what an agent is allowed to do
- agents operate within clear financial limits
- smart contracts enforce those limits
- every spend leaves an auditable on-chain trail

The long-term direction is agent-native treasury infrastructure: recurring budgets, vendor allowlists, policy templates, team approvals, agent reputation, and risk-aware automation for crypto-native organizations.

## What It Does

The MVP supports one core flow:

1. A user deposits native zkLTC into `OathRailVault`.
2. The user creates an oath: agent address, allowed recipient, max spend, expiry, and purpose hash.
3. A DGrid-backed AI agent turns a natural-language request into a payment proposal.
4. The user signs the exact execution intent.
5. The server verifies the signature against the on-chain policy owner.
6. The server-held agent key submits `spend(...)`.
7. The LitVM contract accepts or rejects the spend.

If the AI tries to overspend, pay the wrong recipient, use an expired policy, or bypass the owner, the contract rejects the transaction.

## Why LitVM

LitVM brings EVM-compatible smart contracts to Litecoin through LiteForge. That makes it a natural environment for experimenting with hard-money automation: zkLTC can be held in programmable vaults, governed by simple spending covenants, and used by agents without giving those agents custody over unlimited funds.

OathRail uses LiteForge testnet:

- chain id: `4441`
- RPC: `https://liteforge.rpc.caldera.xyz/http`
- native gas/token: `zkLTC`
- deployed vault: `0x6792E51FBD24f9315282BD5b6c5E713dCc779C69`

## Architecture

```text
User wallet
  signs deposits, policies, and exact execution approvals
        |
        v
Next.js app
  wallet UI, policy flow, payment planner
        |
        v
Server routes
  DGrid planning, signature verification, agent transaction relay
        |
        v
OathRailVault on LiteForge
  final enforcement for balances, caps, recipient, expiry, pause, and agent identity
```

The AI is intentionally not the trust anchor. It is a planning layer. The smart contract is the authority.

## Security Model

Contract-enforced constraints:

- only the configured agent can spend from a policy
- only the configured recipient can receive funds
- cumulative spend cannot exceed the policy cap
- expired policies cannot spend
- paused policies cannot spend
- owner vault balance must cover the payment

Server-enforced constraints:

- `/api/agent/execute` requires a policy-owner signature
- the signature binds vault, policy id, amount, memo, and owner
- the server reads the on-chain policy owner before broadcasting
- unsigned or mismatched calls are rejected before the agent key is used

Operational assumptions:

- the demo agent key is server-side only
- the DGrid API key is server-side only
- `.env` must never be committed
- production should split deployer and agent keys
- this MVP is not a formal wallet, payment processor, or audited custody system

## Stack

- Next.js
- TypeScript
- viem
- Foundry
- Solidity
- DGrid OpenAI-compatible API
- LitVM LiteForge testnet

## Repository Layout

```text
src/app/                  Next.js app and API routes
src/lib/                  chain config, ABI, shared payment helpers
contracts/src/            OathRailVault contract
contracts/test/           Foundry tests
contracts/script/         deployment script
docs/                     architecture and deployment notes
scripts/                  local smoke/signature helpers
```

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill `.env`:

```bash
DGRID_API_KEY=...
DGRID_MODEL=openai/gpt-4o
LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
PRIVATE_KEY=...
AGENT_PRIVATE_KEY=...
NEXT_PUBLIC_LITVM_CHAIN_ID=4441
NEXT_PUBLIC_LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS=...
NEXT_PUBLIC_AGENT_ADDRESS=...
```

Run locally:

```bash
pnpm dev
```

## Contract Commands

Build and test:

```bash
forge build --root contracts
forge test --root contracts
```

Deploy:

```bash
forge script contracts/script/Deploy.s.sol \
  --root contracts \
  --rpc-url "$LITVM_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
```

After deployment, set:

```bash
NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS=...
NEXT_PUBLIC_AGENT_ADDRESS=...
```

## App Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm check
```

With the app running:

```bash
pnpm smoke
```

Against a deployed app:

```bash
OATHRAIL_BASE_URL=https://your-app-url pnpm smoke
```

## Live Testnet Evidence

- deployed vault: `0x6792E51FBD24f9315282BD5b6c5E713dCc779C69`
- agent address: `0x4Ba1e9e275EF61B56C99532D0066506436201D73`
- valid agent spend tx: `0xa81cb6a337a97f45af3e4d2545235b628b05d5a57f93fbfed5cea380ab6af6f1`
- signed execution smoke tx: `0x7112e7822982f3972ec3f6f52d097337a4b795ccdb3e003980ae6b15d58ea6a0`

## Roadmap

Near-term:

- multiple recipients per policy
- policy templates for common agent workflows
- recurring spend windows
- richer policy status and event history in the UI
- read-only public proof page for deployed vault state

Long-term:

- team approvals
- merchant/vendor profiles
- agent reputation
- spending simulations before execution
- risk scoring for payment requests
- cross-agent treasury management

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment guide](docs/DEPLOY.md)
