"use client";

import { useCallback, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Copy, ExternalLink, LogOut, Loader2, Check } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [address]);

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!address) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-mono">{shortenAddress(address)}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[240px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-gray-500 mb-1">Connected wallet</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-mono text-gray-900 truncate">
                {address}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

          <DropdownMenu.Item asChild>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              View on Stellar Explorer
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

          <DropdownMenu.Item asChild>
            <button
              onClick={disconnect}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer outline-none"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
