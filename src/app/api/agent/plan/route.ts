import { NextResponse } from "next/server";
import { planPaymentRequest, PlannerInputError } from "@/lib/agentPlanner";

export const dynamic = "force-dynamic";

type PlanBody = {
  prompt?: string;
  recipient?: string;
  maxAmountZkLtc?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PlanBody;
  try {
    const result = await planPaymentRequest({
      prompt: body.prompt ?? "",
      recipient: body.recipient ?? "",
      maxAmountZkLtc: body.maxAmountZkLtc ?? "0.001"
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlannerInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Planning failed." }, { status: 500 });
  }
}
