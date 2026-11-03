import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/* 
// Uncomment this once you place your font file at frontend/app/fonts/KudaModena-Bold.woff2
const modena = localFont({
  src: "./fonts/KudaModena-Bold.woff2",
  variable: "--font-kuda-modena",
  display: "swap",
});
*/

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roda — Save together. Onchain.",
  description:
    "Roda brings rotating savings onchain. Join trusted savings circles, follow automated payouts, and grow your money with your community.",
};

import { CookiesNotification } from "../components/CookiesNotification";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className={`${jakarta.className} min-h-full bg-white text-charcoal`}>
        {children}
        <CookiesNotification />
      </body>
    </html>
  );
}
