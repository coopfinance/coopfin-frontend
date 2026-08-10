"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Send,
  Coins,
} from "lucide-react";
import {
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import { useWallet } from "@/hooks/use-wallet";
import {
  server,
  networkPassphrase,
  CONTRACT_IDS,
  formatAmount,
  parseAmount,
  shortenAddress,
} from "@/lib/stellar";
import type { Group } from "@/types";

type ContributeStep = "form" | "submitting" | "success" | "error";

interface FormErrors {
  amount?: string;
  period?: string;
}

interface ContributeModalProps {
  group: Group;
  onClose: () => void;
}

function getCurrentCycle(): number {
  const now = new Date();
  // Rough cycle number based on days since epoch
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30));
}

export function ContributeModal({ group, onClose }: ContributeModalProps) {
  const { address, isConnecting, connect, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<ContributeStep>("form");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(String(getCurrentCycle()));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  const minContribution = group.rules.minContribution / 10_000_000;

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Enter a valid contribution amount";
    } else if (amountNum < minContribution) {
      newErrors.amount = `Minimum contribution is ${minContribution.toLocaleString()} USDC`;
    }

    const periodNum = parseInt(period, 10);
    if (!period || isNaN(periodNum) || periodNum < 1) {
      newErrors.period = "Enter a valid cycle number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, period, minContribution]);

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    setIsFetchingBalance(true);
    try {
      const account = await server.getAccount(address);
      // Account in stellar-sdk v12 has a `balances` getter
      type BalanceLine = { asset_type: string; balance: string };
      const balances = (account as unknown as { balances: BalanceLine[] }).balances;
      const nativeBalance = balances?.find(
        (b: { asset_type: string }) => b.asset_type === "native"
      );
      if (nativeBalance) {
        setBalance(Number(nativeBalance.balance).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }));
      }
    } catch {
      setBalance("0");
    } finally {
      setIsFetchingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, fetchBalance]);

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!address) {
      setSubmitError("Please connect your wallet first");
      return;
    }

    const treasuryId = CONTRACT_IDS.treasury;
    if (!treasuryId) {
      setSubmitError(
        "Treasury contract not configured. Set NEXT_PUBLIC_TREASURY_CONTRACT_ID in your environment."
      );
      return;
    }

    setStep("submitting");
    setSubmitError(null);

    try {
      const account = await server.getAccount(address);
      const contract = new Contract(treasuryId);
      const amountStroops = parseAmount(amount);
      const periodNum = parseInt(period, 10);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            "contribute",
            nativeToScVal(address, { type: "address" }),
            nativeToScVal(amountStroops, { type: "i128" }),
            nativeToScVal(periodNum, { type: "i128" })
          )
        )
        .setTimeout(30)
        .build();

      // Simulate first to get the footprint + fee
      const simulation = await server.simulateTransaction(tx);
      if (SorobanRpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      const preparedTx = await server.prepareTransaction(tx);
      const signedXdr = await signTransaction(preparedTx.toXDR());

      const signedTx = TransactionBuilder.fromXDR(
        signedXdr,
        networkPassphrase
      );

      const sendResult = await server.sendTransaction(signedTx);
      if (sendResult.status === "PENDING") {
        // Poll for result
        let pollCount = 0;
        const maxPolls = 30;
        let result = await server.getTransaction(sendResult.hash);

        while (
          result.status === "NOT_FOUND" &&
          pollCount < maxPolls
        ) {
          await new Promise((r) => setTimeout(r, 1000));
          result = await server.getTransaction(sendResult.hash);
          pollCount++;
        }

        if (result.status === "SUCCESS") {
          setTxHash(sendResult.hash);
          setStep("success");
          queryClient.invalidateQueries({ queryKey: ["groups"] });
          queryClient.invalidateQueries({ queryKey: ["treasury"] });
          return;
        }

        throw new Error(
          `Transaction ${result.status.toLowerCase()}: ${JSON.stringify(result)}`
        );
      } else {
        throw new Error(
          `Transaction failed: ${sendResult.status} — ${JSON.stringify(sendResult)}`
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Contribution failed";
      setSubmitError(message);
      setStep("error");
    }
  };

  if (!address) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Contribute to {group.name}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Connect your wallet to submit a contribution to this group.
          </p>
          <button
            onClick={connect}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {step === "form" && `Contribute to ${group.name}`}
            {step === "submitting" && "Submitting Contribution"}
            {step === "success" && "Contribution Submitted!"}
            {step === "error" && "Contribution Failed"}
          </h2>
          <button
            onClick={onClose}
            disabled={step === "submitting"}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "form" && (
          <div className="space-y-4">
            {/* Connected wallet badge */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wallet className="h-4 w-4" />
                <span>Connected as</span>
                <span className="font-mono font-semibold text-gray-900">
                  {shortenAddress(address)}
                </span>
              </div>
            </div>

            {/* Wallet balance */}
            <div className="flex items-center justify-between rounded-lg bg-brand-50 border border-brand-200 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-brand-600" />
                <span className="text-gray-700">Wallet Balance</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {isFetchingBalance ? (
                  <Loader2 className="h-4 w-4 animate-spin inline" />
                ) : (
                  `${Number(balance || 0).toLocaleString()} XLM`
                )}
              </span>
            </div>

            {/* Group info */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Group</span>
                <span className="font-medium text-gray-900">{group.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Min Contribution</span>
                <span className="font-medium text-gray-900">
                  {minContribution.toLocaleString()} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Treasury</span>
                <span className="font-mono text-xs text-gray-900">
                  {shortenAddress(CONTRACT_IDS.treasury || group.contractAddresses.treasury, 6)}
                </span>
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label
                htmlFor="contribute-amount"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Amount (USDC) <span className="text-red-500">*</span>
              </label>
              <input
                id="contribute-amount"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Minimum ${minContribution.toLocaleString()} USDC`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Period selector */}
            <div>
              <label
                htmlFor="contribute-period"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Contribution Cycle <span className="text-red-500">*</span>
              </label>
              <input
                id="contribute-period"
                type="number"
                min="1"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. 6"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {errors.period && (
                <p className="mt-1 text-xs text-red-600">{errors.period}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Current cycle: {getCurrentCycle()}. This is the savings cycle
                number you are contributing to.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!amount || !period}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                Submit Contribution
              </button>
            </div>
          </div>
        )}

        {step === "submitting" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
              <p className="text-sm text-gray-600">
                Building and signing Soroban transaction...
              </p>
              <div className="space-y-2 w-full">
                <StepItem
                  label="Simulating transaction"
                  status="done"
                />
                <StepItem
                  label="Signing with wallet"
                  status="in-progress"
                />
                <StepItem
                  label="Submitting to Stellar network"
                  status="pending"
                />
                <StepItem
                  label="Confirming transaction result"
                  status="pending"
                />
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {Number(amount).toLocaleString()} USDC Contributed
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Cycle #{period} — {group.name}
                </p>
              </div>
            </div>

            {txHash && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Transaction Hash
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="mt-1 font-mono text-xs text-gray-700 truncate">
                  {txHash}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Contribution failed
                </p>
                <p className="mt-1 text-xs text-red-700">{submitError}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setSubmitError(null);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
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

function StepItem({
  label,
  status,
}: {
  label: string;
  status: "done" | "in-progress" | "pending" | "error";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
      {status === "done" && (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
      )}
      {status === "in-progress" && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
      )}
      {status === "pending" && (
        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
      )}
      {status === "error" && (
        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
      )}
      <span
        className={
          status === "done"
            ? "text-green-800"
            : status === "error"
            ? "text-red-800"
            : "text-gray-500"
        }
      >
        {label}
      </span>
    </div>
  );
}