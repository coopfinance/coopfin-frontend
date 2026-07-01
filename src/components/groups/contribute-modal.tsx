"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import {
  server,
  networkPassphrase,
  formatAmount,
  shortenAddress,
  HORIZON_URL,
} from "@/lib/stellar";
import {
  TransactionBuilder,
  Contract,
  nativeToScVal,
  Address,
  BASE_FEE,
  SorobanRpc,
  xdr,
} from "@stellar/stellar-sdk";
import type { Group } from "@/types";

type TxState = "idle" | "signing" | "pending" | "success" | "error";

interface PeriodOption {
  label: string;
  days: number;
}

function buildPeriodOptions(group: Group): PeriodOption[] {
  const base = group.rules.contributionPeriodDays;
  const options: PeriodOption[] = [
    { label: "Current period (" + base + "d)", days: base },
  ];
  if (base * 2 <= 365) options.push({ label: base * 2 + " days", days: base * 2 });
  if (base * 3 <= 365) options.push({ label: base * 3 + " days", days: base * 3 });
  return options;
}

async function fetchWalletBalance(addr: string): Promise<string> {
  try {
    const res = await fetch(HORIZON_URL + "/accounts/" + addr);
    if (!res.ok) return "\u2014";
    const data = await res.json();
    const native = data.balances?.find(
      (b: { asset_type: string }) => b.asset_type === "native"
    );
    return native ? native.balance : "0";
  } catch {
    return "\u2014";
  }
}

interface ContributeModalProps {
  group: Group;
  onClose: () => void;
}

export function ContributeModal({ group, onClose }: ContributeModalProps) {
  const { address, isConnecting, connect, signTransaction } = useWallet();

  const [amount, setAmount] = useState("");
  const [periodDays, setPeriodDays] = useState(group.rules.contributionPeriodDays);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const periodOptions = buildPeriodOptions(group);
  const minContribution = group.rules.minContribution;

  useEffect(() => {
    if (!address) return;
    setBalanceLoading(true);
    fetchWalletBalance(address)
      .then(setWalletBalance)
      .finally(() => setBalanceLoading(false));
  }, [address]);

  const validate = useCallback((): boolean => {
    if (!amount || isNaN(parseFloat(amount))) {
      setValidationError("Enter a valid amount");
      return false;
    }
    const value = parseFloat(amount);
    if (value <= 0) {
      setValidationError("Amount must be greater than 0");
      return false;
    }
    const minHuman = minContribution / 10_000_000;
    if (value < minHuman) {
      setValidationError("Minimum contribution is " + minHuman + " USDC");
      return false;
    }
    if (walletBalance && walletBalance !== "\u2014" && parseFloat(walletBalance) < value) {
      setValidationError("Insufficient wallet balance");
      return false;
    }
    setValidationError(null);
    return true;
  }, [amount, minContribution, walletBalance]);

  useEffect(() => {
    if (amount) setValidationError(null);
  }, [amount]);

  const handleContribute = useCallback(async () => {
    if (!address) {
      await connect();
      return;
    }

    if (!validate()) return;

    setTxState("signing");
    setTxError(null);
    setTxHash(null);

    try {
      const account = await server.getAccount(address);
      const value = parseFloat(amount);
      const stroops = BigInt(Math.round(value * 10_000_000));

      const treasuryContractId =
        group.contractAddresses?.treasury ||
        process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID ||
        "";

      const contract = new Contract(treasuryContractId);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            "contribute",
            xdr.ScVal.scvAddress(new Address(address).toScAddress()),
            nativeToScVal(stroops, { type: "i128" }),
            nativeToScVal(periodDays, { type: "u32" })
          )
        )
        .setTimeout(60)
        .build();

      const simulation = await server.simulateTransaction(tx);
      if (SorobanRpc.Api.isSimulationError(simulation)) {
        throw new Error("Simulation failed: " + simulation.error);
      }

      setTxState("signing");
      const signedXdr = await signTransaction(tx.toXDR());

      setTxState("pending");
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const sendResponse = await server.sendTransaction(signedTx);

      if (sendResponse.status === "ERROR") {
        throw new Error("Transaction rejected by the network");
      }

      let getResponse = await server.getTransaction(sendResponse.hash);
      let attempts = 0;
      const maxAttempts = 30;

      while (getResponse.status === "NOT_FOUND" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        getResponse = await server.getTransaction(sendResponse.hash);
        attempts++;
      }

      if (getResponse.status === "NOT_FOUND") {
        throw new Error("Transaction timed out waiting for confirmation");
      }

      if (getResponse.status === "SUCCESS") {
        setTxHash(sendResponse.hash);
        setTxState("success");
      } else {
        throw new Error("Transaction failed on-chain");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setTxError(message);
      setTxState("error");
    }
  }, [address, amount, connect, group, periodDays, signTransaction, validate]);

  const handleRetry = useCallback(() => {
    setTxState("idle");
    setTxError(null);
    setTxHash(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Contribute</h2>
          <button
            onClick={onClose}
            disabled={txState === "signing" || txState === "pending"}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mb-5">
          <p className="text-sm font-medium text-gray-900">{group.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Treasury:{" "}
            {shortenAddress(
              group.contractAddresses?.treasury ||
                process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID ||
                "",
              6
            )}
          </p>
        </div>

        {txState === "idle" && (
          <div className="space-y-4">
            {address ? (
              <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-mono font-medium text-green-800">
                    {shortenAddress(address)}
                  </span>
                </div>
                <div className="text-sm text-green-700">
                  {balanceLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>
                      {walletBalance && walletBalance !== "\u2014"
                        ? parseFloat(walletBalance).toFixed(2) + " XLM"
                        : "\u2014"}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Amount (USDC)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum: {formatAmount(minContribution)} USDC
              </p>
              {validationError && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationError}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Contribution Period
              </label>
              <select
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.days} value={opt.days}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 space-y-1">
              <p>• Contribution is recorded on Stellar testnet</p>
              <p>
                • Period: <strong>{periodDays} days</strong>
              </p>
              {walletBalance && walletBalance !== "\u2014" && amount && (
                <p>
                  • Remaining after contribution:{" "}
                  <strong>
                    {(parseFloat(walletBalance) - parseFloat(amount || "0")).toFixed(2)} XLM
                  </strong>
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContribute}
                disabled={!address || !amount}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {!address ? (
                  "Connect Wallet"
                ) : (
                  <>
                    Contribute
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {txState === "signing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                Waiting for wallet signature...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please confirm the transaction in your wallet
              </p>
            </div>
          </div>
        )}

        {txState === "pending" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-stellar-600" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                Transaction submitted
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Waiting for ledger confirmation...
              </p>
            </div>
            {txHash && (
              <a
                href={"https://stellar.expert/explorer/testnet/tx/" + txHash}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                View on Stellar Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {txState === "success" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
              <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Contribution Successful!
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  {parseFloat(amount)} USDC contributed for {periodDays} days
                </p>
              </div>
            </div>

            {txHash && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                <a
                  href={"https://stellar.expert/explorer/testnet/tx/" + txHash}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-mono text-brand-600 hover:underline break-all"
                >
                  {txHash}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {txState === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Transaction Failed
                </p>
                <p className="text-xs text-red-600 mt-1 break-words">
                  {txError}
                </p>
              </div>
            </div>

            {txHash && (
              <a
                href={"https://stellar.expert/explorer/testnet/tx/" + txHash}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-brand-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="break-all">{txHash}</span>
              </a>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
