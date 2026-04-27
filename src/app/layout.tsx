import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/Toaster";
import ConfirmDialog from "@/components/ConfirmDialog";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "HFTF Portal",
  description: "Guest registration and check-in.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} antialiased h-full`}>
      <body className="min-h-full">
        {children}
        <Toaster />
        <ConfirmDialog />
      </body>
    </html>
  );
}
