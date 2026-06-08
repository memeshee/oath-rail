# OathRail Architecture

## Product Flow

OathRail creates a bounded spending rail for AI agents:

1. User deposits native zkLTC into `OathRailVault`.
2. User creates an oath with agent, recipient, max spend, expiry, and purpose hash.
3. User asks the DGrid agent to plan a payment.
4. User signs the exact execution authorization.
5. Server verifies the signature against the on-chain policy owner.
6. Server-held agent key submits `spend(...)`.
7. The contract accepts or rejects the spend.

## Trust Boundaries

Browser:

- holds the user wallet session
- signs exact execution intents
- never receives DGrid key or agent private key

Server:

- calls DGrid
- holds the demo agent private key
- verifies owner authorization before broadcasting

Contract:

- enforces spend policy
- is the final authority
- rejects unsafe or out-of-policy calls even if the AI or server is wrong

## Contract Invariants

- only policy owner can pause a policy
- only configured agent can spend
- configured recipient is immutable per policy
- cumulative spend cannot exceed `maxSpend`
- expired or paused policies cannot spend
- owner vault balance must cover each spend

## Known MVP Limits

- One recipient per policy keeps the MVP simple and auditable.
- The same supplied testnet key is used for deployer and demo agent locally; production should split those roles.
- No database, user accounts, merchant onboarding, analytics, or real payments.
- Expiry uses coarse timestamps; this is acceptable for a hackathon demo but should not be used for second-level guarantees.

