import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Syne } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roda — Save together. Coordinate onchain.",
  description:
    "Roda unites rotating savings circles, personal USDC vaults, and Sputnik DAO community treasuries with Trezu integration, budget envelopes, and on-chain reputation on NEAR Protocol.",
};

import { CookiesNotification } from "../components/CookiesNotification";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${syne.variable} h-full antialiased`}>
      <body className={`${syne.className} min-h-full bg-white text-charcoal`}>
        {children}
        <CookiesNotification />
      </body>
    </html>
  );
}
