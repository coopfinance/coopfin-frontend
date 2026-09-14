import { useState, useEffect } from'react';
import { useStellarWallets } from '@creit.tech/stellar-wallets-kit';

export const useWallet = () => {
  const { wallet, connect, disconnect, connecting } = useStellarWallets();

  return {
    wallet,
    connect,
    disconnect,
    connecting,
  };
};