import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuredAgent = process.env.NEXT_PUBLIC_AGENT_ADDRESS;
  const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
  const derivedAgent = agentPrivateKey
    ? privateKeyToAccount(agentPrivateKey as `0x${string}`).address
    : "";

  return NextResponse.json({
    chainId: 4441,
    rpcUrl: process.env.NEXT_PUBLIC_LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http",
    vaultAddress: process.env.NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS || "",
    agentAddress: configuredAgent || derivedAgent
  });
}
