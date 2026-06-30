"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Loader2, Wallet } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { clsx } from "clsx";
import { useWallet } from "@/hooks/use-wallet";

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  if (isConnecting) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={() => void connect()}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  const explorerUrl = `https://stellar.expert/explorer/testnet/account/${address}`;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {shortenAddress(address)}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[240px] rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
        >
          <div className="px-2 py-1.5">
            <p className="text-xs text-gray-400 mb-1">Connected address</p>
            <div className="flex items-start gap-2">
              <p className="text-xs font-mono text-gray-800 break-all flex-1">{address}</p>
              <button
                type="button"
                onClick={() => void copyAddress()}
                className="shrink-0 p-1 text-gray-400 hover:text-gray-700 rounded"
                aria-label="Copy address"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
          <DropdownMenu.Item asChild>
            <Link
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md",
                "outline-none cursor-pointer hover:bg-gray-50",
              )}
            >
              <ExternalLink className="w-4 h-4" />
              View on Stellar Explorer
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => disconnect()}
            className={clsx(
              "flex items-center px-2 py-1.5 text-sm text-red-600 rounded-md",
              "outline-none cursor-pointer hover:bg-red-50",
            )}
          >
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
