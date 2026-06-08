import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "OathRail",
    chainId: 4441,
    vaultAddress: process.env.NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS || "",
    agentConfigured: Boolean(process.env.AGENT_PRIVATE_KEY),
    dgridConfigured: Boolean(process.env.DGRID_API_KEY)
  });
}
