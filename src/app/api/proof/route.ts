import { NextResponse } from "next/server";
import { createPublicClient, formatEther, getAddress, http, type Address } from "viem";
import { liteForge } from "@/lib/chain";
import { oathRailVaultAbi } from "@/lib/oathrail";

export const dynamic = "force-dynamic";

export async function GET() {
  const rpcUrl = process.env.LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http";
  const vaultAddress = process.env.NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS;
  if (!vaultAddress) {
    return NextResponse.json({ error: "Vault contract address is not configured." }, { status: 500 });
  }

  try {
    const vault = getAddress(vaultAddress) as Address;
    const client = createPublicClient({
      chain: liteForge,
      transport: http(rpcUrl)
    });
    const [blockNumber, code, nextPolicyId, policyOne] = await Promise.all([
      client.getBlockNumber(),
      client.getBytecode({ address: vault }),
      client.readContract({
        address: vault,
        abi: oathRailVaultAbi,
        functionName: "nextPolicyId"
      }),
      client
        .readContract({
          address: vault,
          abi: oathRailVaultAbi,
          functionName: "policies",
          args: [1n]
        })
        .catch(() => null)
    ]);

    return NextResponse.json({
      chainId: 4441,
      blockNumber: blockNumber.toString(),
      vaultAddress: vault,
      bytecodeBytes: code ? Math.max((code.length - 2) / 2, 0) : 0,
      nextPolicyId: nextPolicyId.toString(),
      policyOne: policyOne
        ? {
            owner: policyOne[0],
            agent: policyOne[1],
            recipient: policyOne[2],
            maxSpendZkLtc: formatEther(policyOne[3]),
            spentZkLtc: formatEther(policyOne[4]),
            expiresAt: policyOne[5].toString(),
            paused: policyOne[6],
            purposeHash: policyOne[7]
          }
        : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read LiteForge proof.";
    return NextResponse.json({ error: message.slice(0, 500) }, { status: 500 });
  }
}
