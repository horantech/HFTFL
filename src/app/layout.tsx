import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Hope for the Fatherless · Donation Dinner",
  description: "Guest registration & check-in for the Hope for the Fatherless donation dinner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} antialiased h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
