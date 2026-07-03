"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { server, parseAmount, networkPassphrase, formatAmount, shortenAddress } from "@/lib/stellar";
import { submitAndPoll } from "@/lib/deploy-contract";
import { Contract, nativeToScVal, Address, TransactionBuilder, BASE_FEE } from "@stellar/stellar-sdk";
import type { Group } from "@/types";

type TxStatus = "idle" | "signing" | "pending" | "success" | "error";

interface ContributeModalProps {
  group: Group;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContributeModal({ group, onClose, onSuccess }: ContributeModalProps) {
  const { address, signTransaction } = useWallet();
  const [amount, setAmount] = useState<string>("");
  const [period, setPeriod] = useState<string>("1");
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const minContribution = group.rules.minContribution / 10_000_000;

  useEffect(() => {
    async function fetchBalance() {
      if (!address) return;
      setIsLoadingBalance(true);
      try {
        const horizonRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
        if (horizonRes.ok) {
          const data = await horizonRes.json();
          const nativeBal = data.balances?.find((b: any) => b.asset_type === "native");
          if (nativeBal) {
            setBalance(Number(nativeBal.balance));
          } else {
            setBalance(0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch balance", err);
      } finally {
        setIsLoadingBalance(false);
      }
    }
    fetchBalance();
  }, [address]);

  const validate = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minContribution) {
      setErrorMessage(`Amount must be at least ${minContribution} USDC`);
      return false;
    }
    if (!period || isNaN(parseInt(period, 10)) || parseInt(period, 10) < 1) {
      setErrorMessage("Enter a valid period number");
      return false;
    }
    if (balance !== null && numAmount > balance) {
      setErrorMessage("Insufficient balance");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validate()) return;
    if (!address) {
      setErrorMessage("Wallet not connected");
      return;
    }
    if (!group.contractAddresses.treasury) {
      setErrorMessage("Group treasury contract missing");
      return;
    }

    try {
      setStatus("signing");
      const account = await server.getAccount(address);
      const contract = new Contract(group.contractAddresses.treasury);
      
      const memberVal = new Address(address).toScVal();
      const amountVal = nativeToScVal(parseAmount(amount), { type: "i128" });
      const periodVal = nativeToScVal(parseInt(period, 10), { type: "u32" });

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(contract.call("contribute", memberVal, amountVal, periodVal))
        .setTimeout(60)
        .build();

      setStatus("pending");
      const hash = await submitAndPoll(tx.toXDR(), signTransaction);
      
      setTxHash(hash);
      setStatus("success");
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    }
  };

  if (status === "success" && txHash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Contribution Successful!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your contribution of {amount} USDC for Period {period} has been processed.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center mb-6 text-sm">
            <span className="text-gray-500">Transaction</span>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-600 hover:underline flex items-center gap-1"
            >
              {shortenAddress(txHash, 6)} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Make a Contribution</h2>
          <button
            onClick={onClose}
            disabled={status === "signing" || status === "pending"}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="font-semibold text-gray-900">
                {isLoadingBalance ? (
                  <span className="animate-pulse bg-gray-200 text-transparent rounded">Loading...</span>
                ) : (
                  balance !== null ? `${balance.toLocaleString()} USDC` : "0 USDC"
                )}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="mb-1 flex justify-between text-sm font-medium text-gray-700">
              <span>Amount (USDC)</span>
              <span className="text-gray-400 font-normal">Min: {minContribution}</span>
            </label>
            <input
              id="amount"
              type="number"
              step="any"
              min={minContribution}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={status === "signing" || status === "pending"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder={`e.g. ${minContribution}`}
            />
          </div>

          <div>
            <label htmlFor="period" className="mb-1 block text-sm font-medium text-gray-700">
              Contribution Period
            </label>
            <input
              id="period"
              type="number"
              min="1"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={status === "signing" || status === "pending"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g. 1"
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "signing" || status === "pending"}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors mt-2"
          >
            {status === "signing" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "pending" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "signing"
              ? "Sign in Wallet..."
              : status === "pending"
              ? "Submitting to Network..."
              : "Submit Contribution"}
          </button>
        </form>
      </div>
    </div>
  );
}
