import { isAddress } from "viem";

export const oathRailVaultAbi = [
  { type: "error", name: "AmountZero", inputs: [] },
  { type: "error", name: "BadAddress", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "NotOwner", inputs: [] },
  { type: "error", name: "NotAgent", inputs: [] },
  { type: "error", name: "PolicyExpired", inputs: [] },
  { type: "error", name: "PolicyPaused", inputs: [] },
  { type: "error", name: "PolicyNotFound", inputs: [] },
  { type: "error", name: "SpendLimitExceeded", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "createPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agent", type: "address" },
      { name: "recipient", type: "address" },
      { name: "maxSpend", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
      { name: "purposeHash", type: "bytes32" }
    ],
    outputs: [{ name: "policyId", type: "uint256" }]
  },
  {
    type: "function",
    name: "setPolicyPaused",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "paused", type: "bool" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "spend",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "memoHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "nextPolicyId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "balances",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "policies",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "agent", type: "address" },
      { name: "recipient", type: "address" },
      { name: "maxSpend", type: "uint256" },
      { name: "spent", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
      { name: "paused", type: "bool" },
      { name: "purposeHash", type: "bytes32" }
    ]
  }
] as const;

export type PaymentPlan = {
  decision: "approve" | "reject";
  reason: string;
  amountZkLtc: string;
  recipient: string;
  memo: string;
  riskFlags: string[];
};

export function parseJsonObject(input: string): unknown {
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? input;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain a JSON object.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export function validatePaymentPlan(value: unknown, fallbackRecipient: string): PaymentPlan {
  if (!value || typeof value !== "object") {
    throw new Error("Payment plan must be an object.");
  }
  const data = value as Record<string, unknown>;
  const decision = data.decision === "approve" ? "approve" : "reject";
  const recipient = typeof data.recipient === "string" && isAddress(data.recipient)
    ? data.recipient
    : fallbackRecipient;
  const amountZkLtc = typeof data.amountZkLtc === "string" ? data.amountZkLtc : "0";
  const memo = typeof data.memo === "string" && data.memo.trim() ? data.memo.slice(0, 96) : "agent payment";
  const reason = typeof data.reason === "string" ? data.reason.slice(0, 500) : "No reason provided.";
  const riskFlags = Array.isArray(data.riskFlags)
    ? data.riskFlags.filter((item): item is string => typeof item === "string").slice(0, 6)
    : [];

  return { decision, reason, amountZkLtc, recipient, memo, riskFlags };
}

export function deterministicPlan(prompt: string, recipient: string, maxAmount: string): PaymentPlan {
  const lower = prompt.toLowerCase();
  const blocked = ["all", "drain", "private key", "bypass", "ignore policy"].some((word) =>
    lower.includes(word)
  );

  return {
    decision: blocked ? "reject" : "approve",
    reason: blocked
      ? "The request contains language that looks like an attempt to bypass bounded spending."
      : "The request is treated as a bounded vendor payment proposal. Contract policy still enforces the cap, recipient, expiry, and agent identity.",
    amountZkLtc: maxAmount,
    recipient,
    memo: prompt.slice(0, 96) || "OathRail vendor payment",
    riskFlags: blocked ? ["prompt-injection", "unsafe-spend-request"] : ["contract-enforced-policy"]
  };
}
