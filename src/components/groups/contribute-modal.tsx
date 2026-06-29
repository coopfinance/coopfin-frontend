"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { server, formatAmount, parseAmount, networkPassphrase } from "@/lib/stellar";
import { Address, Contract, TransactionBuilder, nativeToScVal } from "@stellar/stellar-sdk";
import type { Group } from "@/types";

type Step = "idle" | "signing" | "pending" | "success" | "error";

async function fetchUsdcBalance(accountId: string): Promise<number> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_HORIZON_URL}/accounts/${accountId}`,
  );
  if (!res.ok) throw new Error("Failed to fetch account");
  const data = await res.json();
  const usdc = data.balances.find(
    (b: Record<string, unknown>) =>
      b.asset_type !== "native" && b.asset_code === "USDC",
  );
  return usdc ? parseFloat(usdc.balance as string) : 0;
}

function getCurrentPeriod(groupCreatedAt: string, contributionPeriodDays: number): number {
  const created = new Date(groupCreatedAt).getTime();
  const now = Date.now();
  const elapsed = now - created;
  return Math.max(1, Math.floor(elapsed / (contributionPeriodDays * 24 * 60 * 60 * 1000)) + 1);
}

export function ContributeModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const { address, signTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(() => getCurrentPeriod(group.createdAt, group.rules.contributionPeriodDays));
  const [step, setStep] = useState<Step>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: balance = 0 } = useQuery({
    queryKey: ["usdcBalance", address],
    queryFn: () => fetchUsdcBalance(address!),
    enabled: !!address,
    refetchInterval: 5000,
  });

  const minStroops = useMemo(() => parseAmount(group.rules.minContribution), [group.rules.minContribution]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !group.contractAddresses.treasury) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    const amountStroops = parseAmount(parsedAmount);
    if (amountStroops < minStroops) {
      setError(`Minimum contribution is ${formatAmount(minStroops)} USDC`);
      return;
    }

    if (parsedAmount > balance) {
      setError("Insufficient USDC balance in connected wallet.");
      return;
    }

    setError(null);
    setStep("signing");

    let transaction;
    try {
      const account = await server.getAccount(address);
      const contract = new Contract(group.contractAddresses.treasury);
      const scMember = Address.fromString(address).toScVal();
      const scAmount = nativeToScVal(amountStroops, { type: "i128" });
      const scPeriod = nativeToScVal(period, { type: "u64" });

      transaction = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase,
      })
        .addOperation(contract.call("contribute", scMember, scAmount, scPeriod))
        .setTimeout(30)
        .build();

      const signedXdr = await signTransaction(transaction.toXDR());
      setStep("pending");

      const signedTransaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const sendResponse = await server.sendTransaction(signedTransaction);
      if (sendResponse.status === "ERROR") {
        throw new Error("Transaction rejected by network");
      }

      let result = await server.getTransaction(sendResponse.hash);
      while (result.status === "NOT_FOUND") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await server.getTransaction(sendResponse.hash);
      }

      if (result.status === "SUCCESS") {
        setTxHash(sendResponse.hash);
        setStep("success");
        queryClient.invalidateQueries({ queryKey: ["groups"] });
        queryClient.invalidateQueries({ queryKey: ["group", group.id] });
        queryClient.invalidateQueries({ queryKey: ["usdcBalance", address] });
      } else {
        throw new Error("Transaction failed on chain");
      }
    } catch (err: unknown) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const isLoading = step === "signing" || step === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Contribute to {group.name}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "success" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span>Contribution submitted successfully!</span>
            </div>
            {txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-brand-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="break-all">{txHash}</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wallet className="h-4 w-4" />
                <span>Wallet Balance:</span>
                <span className="font-semibold text-gray-900">
                  {address ? `${balance.toFixed(7)} USDC` : "Connect wallet"}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="mb-1 block text-sm font-medium text-gray-700">
                Amount (USDC)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="amount"
                  type="number"
                  step="any"
                  min={group.rules.minContribution}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  placeholder={`Min: ${formatAmount(parseAmount(group.rules.minContribution))} USDC`}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="period" className="mb-1 block text-sm font-medium text-gray-700">
                Period
              </label>
              <input
                id="period"
                type="number"
                min="1"
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value || "1", 10))}
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !address || !group.contractAddresses.treasury}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {step === "signing" && "Sign in wallet..."}
                {step === "pending" && "Submitting..."}
                {step === "idle" && "Contribute"}
                {step === "error" && "Retry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
