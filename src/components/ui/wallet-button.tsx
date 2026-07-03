"use client";

import { useWallet } from "@/hooks/use-wallet";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Copy, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export function WalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium text-sm"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (!address) {
    return (
      <button
        onClick={connect}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-md font-medium text-sm transition-colors">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span>{formatAddress(address)}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-white rounded-md p-1 shadow-lg border border-gray-200 z-50 text-sm animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 mt-2"
          align="end"
          sideOffset={5}
        >
          <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center justify-between">
            <span className="text-gray-500 text-xs truncate max-w-[150px]">{address}</span>
            <button
              onClick={copyToClipboard}
              className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
              title="Copy address"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <DropdownMenu.Item asChild>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
            >
              <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
              View on Stellar Explorer
            </a>
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
          
          <DropdownMenu.Item
            onClick={disconnect}
            className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
