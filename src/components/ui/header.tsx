"use client";

import { useState, useRef, useEffect } from "react";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { shortenAddress } from "@/lib/stellar";

export function Header() {
  const { address, connect, disconnect, isConnecting } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-64 h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 z-30">
      <div className="flex items-center gap-3">
        {address ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              data-testid="wallet-header-btn"
            >
              <Wallet className="w-4 h-4" />
              <span>{shortenAddress(address)}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400">Connected Wallet</p>
                  <p className="text-sm font-mono text-gray-700 truncate">{address}</p>
                </div>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                  {copied ? "Copied!" : "Copy Address"}
                </button>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  View on Explorer
                </a>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => { disconnect(); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            data-testid="connect-wallet-header-btn"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
