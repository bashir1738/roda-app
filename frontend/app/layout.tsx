import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({
  src: "../public/fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-jakarta",
  display: "swap",
  weight: "400 800",
});

const syne = localFont({
  src: "../public/fonts/Syne-Variable.woff2",
  variable: "--font-syne",
  display: "swap",
  weight: "400 800",
});

export const metadata: Metadata = {
  title: "Roda — Save together. Coordinate onchain.",
  description:
    "Roda unites rotating savings circles, personal USDC vaults, and Sputnik DAO community treasuries with Trezu (mainnet only) compatibility, budget envelopes, and on-chain reputation on NEAR Protocol.",
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
