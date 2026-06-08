# Deployment Guide

## Prerequisites

- Node.js 22+
- pnpm
- Foundry
- A LiteForge-funded testnet deployer key
- DGrid API key
- A Next.js host with server route support

## Local Validation

```bash
pnpm install
pnpm check
```

With the app running locally or deployed publicly:

```bash
OATHRAIL_BASE_URL=http://localhost:3001 pnpm smoke
OATHRAIL_BASE_URL=https://your-public-app.example pnpm smoke
```

## Contract Deployment

```bash
forge script contracts/script/Deploy.s.sol \
  --root contracts \
  --rpc-url "$LITVM_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
```

Set the returned contract address as:

```bash
NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS=...
```

## App Deployment

Set these variables on the host:

```bash
DGRID_API_KEY=...
DGRID_MODEL=openai/gpt-4o
LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
AGENT_PRIVATE_KEY=...
NEXT_PUBLIC_LITVM_CHAIN_ID=4441
NEXT_PUBLIC_LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS=0x6792E51FBD24f9315282BD5b6c5E713dCc779C69
NEXT_PUBLIC_AGENT_ADDRESS=0x4Ba1e9e275EF61B56C99532D0066506436201D73
```

Build command:

```bash
pnpm build
```

Start command:

```bash
pnpm start
```

## Vercel

The repository includes `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

Vercel deploys the Next.js API routes as serverless functions automatically. No separate MCP server is required.

Important deployed endpoints:

- `/api/health` - app and env health
- `/api/config` - public LiteForge app config
- `/api/proof` - live LiteForge vault proof
- `/api/agent/plan` - DGrid/rules payment planner
- `/api/agent/execute` - owner-signed agent execution relay
- `/api/mcp` - MCP-compatible JSON-RPC tool endpoint

After Vercel deployment:

```bash
OATHRAIL_BASE_URL=https://your-vercel-app.vercel.app pnpm smoke
```
