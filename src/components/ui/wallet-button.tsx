"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Copy,
  Check,
  ExternalLink,
  LogOut,
  ChevronDown,
  Loader2,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/hooks/use-wallet";
import { shortenAddress, STELLAR_NETWORK } from "@/lib/stellar";

function explorerUrl(address: string): string {
  const net = (STELLAR_NETWORK as string).toLowerCase();
  return `https://stellar.expert/explorer/${net}/account/${address}`;
}

export function WalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (isConnecting) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg"
        data-testid="wallet-connecting"
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
        onClick={connect}
        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors"
        data-testid="wallet-connect-btn"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
          data-testid="wallet-connected-btn"
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-mono">{shortenAddress(address)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={clsx(
            "z-50 min-w-[16rem] bg-white border border-gray-200 rounded-lg shadow-lg p-1"
          )}
        >
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">Connected account</p>
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-sm font-mono text-gray-700 break-all"
                data-testid="wallet-full-address"
              >
                {address}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 shrink-0"
                data-testid="wallet-copy-btn"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
          <DropdownMenu.Item asChild>
            <a
              href={explorerUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer outline-none"
              data-testid="wallet-explorer-link"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              View on Stellar Explorer
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <button
              type="button"
              onClick={disconnect}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none w-full text-left"
              data-testid="wallet-disconnect-btn"
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
