import { NextResponse } from "next/server";
import { planPaymentRequest, PlannerInputError } from "@/lib/agentPlanner";

export const dynamic = "force-dynamic";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
};

const tools = [
  {
    name: "oathrail.plan_payment",
    description:
      "Plan a bounded zkLTC payment for an OathRail policy. This only proposes a payment; execution still requires owner signature and contract checks.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Natural-language payment request." },
        recipient: { type: "string", description: "Locked recipient address for the policy." },
        maxAmountZkLtc: { type: "string", description: "Maximum allowed spend in zkLTC." }
      },
      required: ["prompt", "recipient", "maxAmountZkLtc"]
    }
  },
  {
    name: "oathrail.health",
    description: "Return OathRail deployment health and configured LiteForge addresses.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as JsonRpcRequest;
  const id = body.id ?? null;

  if (body.method === "initialize") {
    return rpcResult(id, {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "oathrail", version: "0.1.0" },
      capabilities: { tools: {} }
    });
  }

  if (body.method === "tools/list") {
    return rpcResult(id, { tools });
  }

  if (body.method === "tools/call") {
    return callTool(id, body.params?.name, body.params?.arguments ?? {});
  }

  return rpcError(id, -32601, "Method not found");
}

export async function GET() {
  return NextResponse.json({
    name: "oathrail",
    description: "MCP-compatible tool endpoint for bounded zkLTC payment planning.",
    endpoint: "/api/mcp",
    tools: tools.map((tool) => ({ name: tool.name, description: tool.description }))
  });
}

async function callTool(id: JsonRpcRequest["id"], name: string | undefined, args: Record<string, unknown>) {
  if (name === "oathrail.health") {
    return rpcResult(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            app: "OathRail",
            chainId: 4441,
            vaultAddress: process.env.NEXT_PUBLIC_OATHRAIL_VAULT_ADDRESS || "",
            agentConfigured: Boolean(process.env.AGENT_PRIVATE_KEY),
            dgridConfigured: Boolean(process.env.DGRID_API_KEY)
          })
        }
      ]
    });
  }

  if (name === "oathrail.plan_payment") {
    try {
      const result = await planPaymentRequest({
        prompt: asString(args.prompt),
        recipient: asString(args.recipient),
        maxAmountZkLtc: asString(args.maxAmountZkLtc || "0.001")
      });
      return rpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(result) }]
      });
    } catch (error) {
      if (error instanceof PlannerInputError) {
        return rpcError(id, -32602, error.message);
      }
      return rpcError(id, -32000, "Payment planning failed");
    }
  }

  return rpcError(id, -32602, "Unknown tool");
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}
