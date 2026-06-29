"use client";

import { useState, useCallback } from "react";
import {
  FreighterModule,
  StellarWalletsKit,
  WalletNetwork,
  LobstrModule,
  FREIGHTER_ID,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";

let kit: StellarWalletsKit | null = null;

function getWalletKit(): StellarWalletsKit {
  if (typeof window === "undefined") {
    throw new Error("Wallet kit is only available in the browser");
  }

  kit ??= new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: [new FreighterModule(), new LobstrModule(), new xBullModule()],
  });

  return kit;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const walletKit = getWalletKit();
      await walletKit.openModal({
        onWalletSelected: async (option) => {
          walletKit.setWallet(option.id);
          const { address: addr } = await walletKit.getAddress();
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

  const signTransaction = useCallback(
    async (xdr: string) => {
      if (!address) throw new Error("Wallet not connected");
      const { signedTxXdr } = await getWalletKit().signTransaction(xdr, {
        address,
        networkPassphrase: WalletNetwork.TESTNET,
      });
      return signedTxXdr;
    },
    [address],
  );

  return { address, isConnecting, error, connect, disconnect, signTransaction };
}
