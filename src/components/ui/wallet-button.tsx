"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Copy, Check, ExternalLink, LogOut, Loader2, Wallet } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { useWallet } from "@/hooks/use-wallet";

function shortenAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  // Disconnected state
  if (!address && !isConnecting) {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-sm text-red-500 max-w-[200px] truncate" title={error}>
            {error}
          </span>
        )}
        <button
          onClick={connect}
          className={twMerge(clsx(
            "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2",
            "text-sm font-medium text-gray-700 shadow-sm transition-colors",
            "hover:bg-gray-50 hover:border-gray-300",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          ))}
        >
          <Wallet className="h-4 w-4 text-indigo-600" />
          Connect Wallet
        </button>
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm"
      >
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        Connecting...
      </button>
    );
  }

  // Connected state with dropdown
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={twMerge(clsx(
            "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2",
            "text-sm font-medium text-gray-700 shadow-sm transition-colors",
            "hover:bg-gray-50 hover:border-gray-300",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          ))}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="font-mono">{shortenAddress(address!)}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[280px] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400">Connected Account</p>
              <p className="truncate font-mono text-sm text-gray-700" title={address!}>
                {address}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={copied ? "Copied!" : "Copy address"}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

          <a
            href={`https://stellar.expert/explorer/testnet/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 text-gray-400" />
            View on Stellar Explorer
          </a>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

          <button
            onClick={disconnect}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
