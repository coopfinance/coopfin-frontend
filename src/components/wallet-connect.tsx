"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Copy, LogOut, Check } from "lucide-react";

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
}

export function WalletConnectButton() {
  const [wallet, setWallet] = useState<WalletState>({ connected: false, address: null, balance: null });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem("coopfin_wallet");
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet));
      } catch {
        localStorage.removeItem("coopfin_wallet");
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    try {
      // Check for Stellar wallet kit or Freighter
      const anyWindow = window as unknown as Record<string, unknown>;
      if (anyWindow.freighter) {
        // Freighter wallet detected
        const freighter = anyWindow.freighter as { isConnected: () => Promise<boolean>; getPublicKey: () => Promise<string> };
        const isConnected = await freighter.isConnected();
        if (!isConnected) {
          // Request connection
          const publicKey = await freighter.getPublicKey();
          setWallet({ connected: true, address: publicKey, balance: null });
          localStorage.setItem("coopfin_wallet", JSON.stringify({ connected: true, address: publicKey, balance: null }));
        } else {
          const publicKey = await freighter.getPublicKey();
          setWallet({ connected: true, address: publicKey, balance: null });
        }
      } else {
        // Demo mode — generate a mock address for UI demonstration
        const mockAddress = "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
        setWallet({ connected: true, address: mockAddress, balance: "1,250 USDC" });
        localStorage.setItem("coopfin_wallet", JSON.stringify({ connected: true, address: mockAddress, balance: "1,250 USDC" }));
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({ connected: false, address: null, balance: null });
    localStorage.removeItem("coopfin_wallet");
  }, []);

  const copyAddress = useCallback(() => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [wallet.address]);

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (wallet.connected && wallet.address) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title={wallet.address}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
          <span className="text-gray-700">{truncateAddress(wallet.address)}</span>
        </button>
        {wallet.balance && (
          <span className="text-xs font-semibold text-green-600">{wallet.balance}</span>
        )}
        <button
          onClick={disconnectWallet}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
    >
      <Wallet className="w-4 h-4" />
      {loading ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
