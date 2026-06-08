import type { Chain } from "viem";

export const liteForge = {
  id: 4441,
  name: "LiteForge",
  nativeCurrency: {
    decimals: 18,
    name: "zkLTC",
    symbol: "zkLTC"
  },
  rpcUrls: {
    default: { http: ["https://liteforge.rpc.caldera.xyz/http"] },
    public: { http: ["https://liteforge.rpc.caldera.xyz/http"] }
  },
  blockExplorers: {
    default: {
      name: "LiteForge Explorer",
      url: "https://explorer.liteforge.litvm.com"
    }
  }
} as const satisfies Chain;

export const LITEFORGE_CHAIN_ID = 4441;
export const LITEFORGE_RPC_URL =
  process.env.NEXT_PUBLIC_LITVM_RPC_URL ?? "https://liteforge.rpc.caldera.xyz/http";

