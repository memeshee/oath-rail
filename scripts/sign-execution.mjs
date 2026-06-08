import { privateKeyToAccount } from "viem/accounts";
import { formatEther, parseEther } from "viem";

const [vault, policyId, amountZkLtc, memo, owner] = process.argv.slice(2);
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey || !vault || !policyId || !amountZkLtc || !memo || !owner) {
  console.error("Usage: PRIVATE_KEY=... node scripts/sign-execution.mjs <vault> <policyId> <amountZkLtc> <memo> <owner>");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
const message = [
  "OathRail agent execution authorization",
  `Vault: ${vault}`,
  `Policy: ${policyId}`,
  `Amount: ${formatEther(parseEther(amountZkLtc))} zkLTC`,
  `Memo: ${memo.slice(0, 96)}`,
  `Owner: ${owner}`,
  "Only sign this if you want the OathRail server agent to submit this exact spend."
].join("\n");

const signature = await account.signMessage({ message });
console.log(signature);
