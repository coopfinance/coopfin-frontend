"use client";

import { useState, useCallback } from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";

let kit: StellarWalletsKit | null = null;
if (typeof window !== "undefined") {
  kit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules(),
  });
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!kit) {
      setError("Wallet kit is not initialized");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit!.setWallet(option.id);
          const { address: addr } = await kit!.getAddress();
          setAddress(addr);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const signTransaction = useCallback(async (xdr: string) => {
    if (!address) throw new Error("Wallet not connected");
    if (!kit) throw new Error("Wallet kit is not initialized");
    const { signedTxXdr } = await kit.signTransaction(xdr, {
      address,
      networkPassphrase: WalletNetwork.TESTNET,
    });
    return signedTxXdr;
  }, [address]);

  return { address, isConnecting, error, connect, disconnect, signTransaction };
}
