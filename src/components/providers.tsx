"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WalletProvider } from "@/hooks/use-wallet";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 2 },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  );
}
