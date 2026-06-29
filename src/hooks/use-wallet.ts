"use client";

import { useState, useCallback } from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  FreighterModule,
  LobstrModule,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import { toastError, toastInfo } from "@/hooks/use-toast";

let walletKit: StellarWalletsKit | null = null;

function getWalletKit() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!walletKit) {
    walletKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [new FreighterModule(), new LobstrModule(), new xBullModule()],
    });
  }

  return walletKit;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const kit = getWalletKit();
      if (!kit) {
        throw new Error("Wallet connection is only available in the browser");
      }

      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
          const { address: addr } = await kit.getAddress();
          setAddress(addr);
          toastInfo(
            "Wallet connected",
            `Connected ${addr.slice(0, 6)}...${addr.slice(-4)}`,
          );
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      toastError("Failed to connect wallet", message);
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
      const kit = getWalletKit();
      if (!kit) {
        throw new Error("Wallet signing is only available in the browser");
      }

      const { signedTxXdr } = await kit.signTransaction(xdr, {
        address,
        networkPassphrase: WalletNetwork.TESTNET,
      });
      return signedTxXdr;
    },
    [address],
  );

  return { address, isConnecting, error, connect, disconnect, signTransaction };
}
