import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/ui/sidebar";
import { WalletButton } from "@/components/ui/wallet-button";
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
            <div className="flex-1 flex flex-col">
              <header className="ml-64 h-16 border-b border-gray-200 bg-white flex items-center justify-end px-6">
                <WalletButton />
              </header>
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
