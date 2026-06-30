"use client";

import { useState, useCallback } from "react";
import {
  StellarWalletsKit,
  type ISupportedWallet,
  WalletNetwork,
  FreighterModule,
  FREIGHTER_ID,
  LobstrModule,
  LOBSTR_ID,
  xBullModule,
  XBULL_ID,
} from "@creit.tech/stellar-wallets-kit";

let walletKit: StellarWalletsKit | null = null;

function getWalletKit() {
  if (walletKit) {
    return walletKit;
  }

  walletKit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: [new FreighterModule(), new LobstrModule(), new xBullModule()],
  });

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
      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          kit.setWallet(option.id);
          const { address: addr } = await kit.getAddress();
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
    const kit = getWalletKit();
    const { signedTxXdr } = await kit.signTransaction(xdr, {
      address,
      networkPassphrase: WalletNetwork.TESTNET,
    });
    return signedTxXdr;
  }, [address]);

  return { address, isConnecting, error, connect, disconnect, signTransaction };
}
