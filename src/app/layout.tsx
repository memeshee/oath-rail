import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://oath-rail.vercel.app"),
  title: {
    default: "OathRail",
    template: "%s | OathRail"
  },
  description: "Bounded zkLTC spending covenants for AI agents on LitVM.",
  applicationName: "OathRail",
  authors: [{ name: "OathRail" }],
  keywords: ["LitVM", "LiteForge", "zkLTC", "AI agents", "agentic payments", "smart contracts"],
  openGraph: {
    title: "OathRail",
    description: "Give AI agents bounded zkLTC spending power through LitVM smart-contract covenants.",
    type: "website",
    siteName: "OathRail"
  },
  twitter: {
    card: "summary",
    title: "OathRail",
    description: "Bounded zkLTC spending covenants for AI agents on LitVM."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
