import React from'react';
import { Sidebar } from '@/components/ui/sidebar';
import { WalletButton } from '@/components/ui/wallet-button';

const Layout: React.FC = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <WalletButton />
        {children}
      </div>
    </div>
  );
};

export default Layout;