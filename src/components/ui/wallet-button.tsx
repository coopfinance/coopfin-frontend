"use client";

import { useState, useCallback } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Wallet, Check, Copy, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/hooks/use-wallet";
import { shortenAddress } from "@/lib/stellar";

const STELLAR_EXPLORER_URL = "https://stellar.expert/explorer/testnet";

export function WalletButton() {
  const { address, connect, disconnect, isConnecting } = useWallet();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [address]);

  // Disconnected state
  if (!address) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className={clsx(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
          "bg-brand-600 text-white hover:bg-brand-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        data-testid="connect-wallet-btn"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  // Connected state 鈥?dropdown trigger
  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={clsx(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            "bg-white border border-gray-200 hover:bg-gray-50",
            "data-[state=open]:ring-2 data-[state=open]:ring-brand-500 data-[state=open]:border-brand-500"
          )}
          data-testid="wallet-connected-btn"
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-mono text-gray-700">
            {shortenAddress(address)}
          </span>
          <Wallet className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={clsx(
            "z-50 min-w-[240px] rounded-xl border border-gray-200 bg-white p-2 shadow-lg",
            "data-[side=bottom]:animate-in data-[side=bottom]:slide-in-from-top-2"
          )}
        >
          {/* Full address header */}
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
            <p className="text-xs text-gray-500 mb-1">Connected Wallet</p>
            <p className="text-sm font-mono text-gray-900 truncate" data-testid="wallet-address">
              {address}
            </p>
          </div>

          {/* Copy address */}
          <DropdownMenu.Item
            onClick={copyAddress}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none",
              "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
            {copied ? "Copied!" : "Copy Address"}
          </DropdownMenu.Item>

          {/* Explorer link */}
          <DropdownMenu.Item asChild>
            <a
              href={`${STELLAR_EXPLORER_URL}/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none",
                "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              View on Stellar Explorer
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

          {/* Disconnect */}
          <DropdownMenu.Item
            onClick={disconnect}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none",
              "text-red-600 hover:bg-red-50"
            )}
            data-testid="disconnect-btn"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
