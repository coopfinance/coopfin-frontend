import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoopFinance — Cooperative Finance on Stellar",
  description:
    "Open-source platform for savings groups, cooperatives, and rotating-credit associations built on Stellar.",
  keywords: ["cooperative", "savings", "Stellar", "USDC", "Africa", "SACCO", "Ajo", "Esusu"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-6">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
