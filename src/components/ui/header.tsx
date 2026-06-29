"use client";

import { WalletButton } from "@/components/ui/wallet-button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-end h-14 px-6 bg-white border-b border-gray-200">
      <WalletButton />
    </header>
  );
}
