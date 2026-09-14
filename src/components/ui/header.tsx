"use client";

import { WalletButton } from "@/components/ui/wallet-button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">CoopFinance</h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Testnet
          </span>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
