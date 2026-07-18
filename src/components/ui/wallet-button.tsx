import React from'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@radix-ui/react-button';
import { Spinner } from '@radix-ui/react-spinner';
import { CopyIcon } from '@radix-ui/react-icons';
import { Dialog, DialogTrigger, DialogContent } from '@radix-ui/react-dialog';
import { Link } from 'next/link';

const WalletButton: React.FC = () => {
  const { wallet, connect, disconnect, connecting } = useWallet();

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const renderButton = () => {
    if (!wallet) {
      return (
        <Button onClick={handleConnect}>
          Connect Wallet
        </Button>
      );
    }

    if (connecting) {
      return (
        <div>
          <Spinner /> Connecting...
        </div>
      );
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">●</span>
            <span>{shortenAddress(wallet.address)}</span>
          </div>
        </DialogTrigger>
        <DialogContent>
          <div className="p-4">
            <div className="mb-2">
              <span>{wallet.address}</span>
              <CopyIcon className="ml-2 cursor-pointer" onClick={() => navigator.clipboard.writeText(wallet.address)} />
            </div>
            <Link href={`https://stellar.expert/explorer/testnet/account/${wallet.address}`} target="_blank">
              <Button>View on Stellar Explorer</Button>
            </Link>
            <Button onClick={handleDisconnect} className="mt-2">Disconnect</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="absolute top-4 right-4">
      {renderButton()}
    </div>
  );
};

export default WalletButton;