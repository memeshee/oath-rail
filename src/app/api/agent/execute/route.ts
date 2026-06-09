import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getAddress,
  http,
  keccak256,
  parseEther,
  stringToBytes,
  verifyMessage,
  type Address,
  type Hex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { liteForge } from "@/lib/chain";
import { oathRailVaultAbi } from "@/lib/oathrail";

export const dynamic = "force-dynamic";

type ExecuteBody = {
  policyId?: string;
  amountZkLtc?: string;
  memo?: string;
  owner?: string;
  signature?: string;
};

export async function POST(request: Request) {
  const vaultAddress = process.env.NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS;
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  const rpcUrl = process.env.LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http";

  if (!vaultAddress) {
    return NextResponse.json({ error: "Vault contract address is not configured." }, { status: 500 });
  }
  if (!privateKey) {
    return NextResponse.json({ error: "Agent private key is not configured." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as ExecuteBody;
  const policyId = BigInt(body.policyId ?? "0");
  const amount = parseEther(body.amountZkLtc ?? "0");
  const memo = (body.memo ?? "OathRail payment").slice(0, 96);
  const memoHash = keccak256(stringToBytes(memo));

  if (policyId <= 0n || amount <= 0n) {
    return NextResponse.json({ error: "Valid policyId and amount are required." }, { status: 400 });
  }
  if (!body.owner || !body.signature) {
    return NextResponse.json({ error: "Owner address and signature are required." }, { status: 401 });
  }

  try {
    const vault = getAddress(vaultAddress) as Address;
    const claimedOwner = getAddress(body.owner);
    const publicClient = createPublicClient({
      chain: liteForge,
      transport: http(rpcUrl)
    });
    const policy = await publicClient.readContract({
      address: vault,
      abi: oathRailVaultAbi,
      functionName: "policies",
      args: [policyId]
    });
    const [policyOwner] = policy;
    if (getAddress(policyOwner) !== claimedOwner) {
      return NextResponse.json({ error: "Signature owner does not match policy owner." }, { status: 403 });
    }

    const message = executionMessage({
      vault,
      policyId: policyId.toString(),
      amountZkLtc: formatEther(amount),
      memo,
      owner: claimedOwner
    });
    const signatureOk = await verifyMessage({
      address: claimedOwner,
      message,
      signature: body.signature as Hex
    });
    if (!signatureOk) {
      return NextResponse.json({ error: "Invalid owner signature." }, { status: 403 });
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: liteForge,
      transport: http(rpcUrl)
    });

    const hash = await client.writeContract({
      address: vault,
      abi: oathRailVaultAbi,
      functionName: "spend",
      args: [policyId, amount, memoHash]
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      hash,
      blockNumber: receipt.blockNumber.toString(),
      status: receipt.status
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent execution failed.";
    return NextResponse.json({ error: message.slice(0, 500) }, { status: 500 });
  }
}

function executionMessage(input: {
  vault: Address;
  policyId: string;
  amountZkLtc: string;
  memo: string;
  owner: Address;
}) {
  return [
    "OathRail agent execution authorization",
    `Vault: ${input.vault}`,
    `Policy: ${input.policyId}`,
    `Amount: ${input.amountZkLtc} zkLTC`,
    `Memo: ${input.memo}`,
    `Owner: ${input.owner}`,
    "Only sign this if you want the OathRail server agent to submit this exact spend."
  ].join("\n");
}
