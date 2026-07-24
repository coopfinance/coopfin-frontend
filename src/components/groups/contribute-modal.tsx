"use client";

import { useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import {
  TransactionBuilder,
  Contract,
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import { SorobanRpc, Networks } from "@stellar/stellar-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { server, CONTRACT_IDS, parseAmount } from "@/lib/stellar";
import { useWallet } from "@/hooks/use-wallet";
import type { Group } from "@/types";

type TxState = "idle" | "signing" | "pending" | "success" | "error";

interface ContributeModalProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STELLAR_EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx";

export function ContributeModal({ group, open, onOpenChange }: ContributeModalProps) {
  const { address, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
  });
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const minContribution = group.rules.minContribution;
  const numericAmount = parseFloat(amount);
  const isAmountValid = !isNaN(numericAmount) && numericAmount >= minContribution;
  const treasuryContractId = group.contractAddresses.treasury || CONTRACT_IDS.treasury;

  const reset = useCallback(() => {
    setAmount("");
    setTxState("idle");
    setTxHash(null);
    setErrorMsg("");
  }, []);

  const handleClose = useCallback(() => {
    if (txState === "signing" || txState === "pending") return;
    reset();
    onOpenChange(false);
  }, [txState, reset, onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!address || !isAmountValid || !treasuryContractId) return;

    setTxState("signing");
    setErrorMsg("");
    setTxHash(null);

    try {
      const amountStroops = parseAmount(amount);
      const memberAddress = new Address(address);

      const contract = new Contract(treasuryContractId);

      // Build the contribute(member, amount, period) call
      const contributeArgs = [
        memberAddress.toScVal(),
        nativeToScVal(amountStroops, { type: "i128" }),
        nativeToScVal(period, { type: "string" }),
      ];

      // Fetch latest ledger for transaction building
      const latestLedger = await server.getLatestLedger();

      // Get the source account
      const sourceAccount = await server.getAccount(address);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: "10000",
        networkPassphrase: Networks.TESTNET,
        timebounds: {
          minTime: 0,
          maxTime: Math.floor(Date.now() / 1000) + 300,
        },
      })
        .addOperation(contract.call("contribute", ...contributeArgs))
        .build();

      // Simulate first to get the transaction data
      const simulated = await server.simulateTransaction(tx);

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      // Prepare the transaction with simulation results
      const preparedTx = SorobanRpc.assembleTransaction(tx, simulated).build();

      // Sign with wallet
      const signedXdr = await signTransaction(preparedTx.toXDR());
      const signedTx = xdr.Transaction.fromXDR(signedXdr, "base64");
      const transaction = TransactionBuilder.fromXDR(
        signedXdr,
        Networks.TESTNET
      );

      setTxState("pending");

      // Submit to the network
      const sendResponse = await server.sendTransaction(transaction);

      if (sendResponse.status === "ERROR") {
        throw new Error(
          `Transaction submission failed: ${sendResponse.errorResult?.result()?.toString() ?? "Unknown error"}`
        );
      }

      if (sendResponse.status === "TRY_AGAIN_LATER") {
        throw new Error("Network busy. Please try again later.");
      }

      // Poll for transaction result
      const hash = sendResponse.hash;
      setTxHash(hash);

      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;

        const txResult = await server.getTransaction(hash);

        if (txResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
          setTxState("success");
          // Invalidate queries to refresh group data
          await queryClient.invalidateQueries({ queryKey: ["groups"] });
          await queryClient.invalidateQueries({ queryKey: ["group", group.id] });
          await queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
          return;
        }

        if (txResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
          throw new Error("Transaction failed on-chain.");
        }

        // Still NOT_FOUND — keep polling
      }

      throw new Error("Transaction confirmation timed out. Check explorer for status.");
    } catch (err) {
      setTxState("error");
      if (err instanceof Error) {
        // Handle wallet rejection
        if (err.message.includes("reject") || err.message.includes("denied") || err.message.includes("cancel")) {
          setErrorMsg("Transaction was rejected by the wallet.");
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          setErrorMsg("Network error. Please check your connection and try again.");
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
    }
  }, [address, amount, period, isAmountValid, treasuryContractId, signTransaction, queryClient, group.id]);

  const isBusy = txState === "signing" || txState === "pending";

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
          <div className="rounded-xl border border-gray-200 bg-white shadow-xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Contribute to {group.name}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                  disabled={isBusy}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Wallet Info */}
            {address && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Wallet Address
                </p>
                <p className="mt-1 text-sm font-mono text-gray-700 truncate">
                  {address}
                </p>
              </div>
            )}

            {/* Success State */}
            {txState === "success" && txHash && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-2 py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="text-base font-semibold text-gray-900">
                    Contribution Successful!
                  </p>
                  <p className="text-sm text-gray-500">
                    Your contribution of {amount} USDC has been submitted.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Transaction Hash
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono text-gray-700 truncate">
                      {txHash.slice(0, 12)}...{txHash.slice(-8)}
                    </p>
                    <a
                      href={`${STELLAR_EXPLORER_BASE}/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 shrink-0"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* Error State */}
            {txState === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-2 py-4">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <p className="text-base font-semibold text-gray-900">
                    Transaction Failed
                  </p>
                  <p className="text-sm text-gray-500 max-w-xs">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setTxState("idle")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Form (idle / signing / pending) */}
            {txState !== "success" && txState !== "error" && (
              <>
                {/* Amount Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="amount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Amount (USDC)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={minContribution}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isBusy}
                    placeholder={`Min: ${minContribution} USDC`}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {amount && !isAmountValid && (
                    <p className="text-xs text-red-500">
                      Minimum contribution is {minContribution} USDC
                    </p>
                  )}
                </div>

                {/* Period Selector */}
                <div className="space-y-2">
                  <label
                    htmlFor="period"
                    className="text-sm font-medium text-gray-700"
                  >
                    Contribution Period
                  </label>
                  <input
                    id="period"
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    disabled={isBusy}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <p className="text-xs text-gray-400">
                    Current cycle auto-populated — editable if needed.
                  </p>
                </div>

                {/* Group Info */}
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Min Contribution</span>
                    <span className="font-medium text-gray-900">
                      {minContribution} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Group Balance</span>
                    <span className="font-medium text-gray-900">
                      {group.balance.toLocaleString()} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Contributed</span>
                    <span className="font-medium text-gray-900">
                      {group.totalContributions.toLocaleString()} USDC
                    </span>
                  </div>
                </div>

                {/* Loading indicator */}
                {isBusy && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {txState === "signing"
                        ? "Please sign the transaction in your wallet..."
                        : "Submitting to the network..."}
                    </span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!isAmountValid || isBusy || !address}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {txState === "signing" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Waiting for signature...
                    </>
                  )}
                  {txState === "pending" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  )}
                  {txState === "idle" && (
                    `Contribute ${amount ? `${amount} USDC` : ""}`
                  )}
                </button>

                {!address && (
                  <p className="text-xs text-center text-gray-400">
                    Connect your wallet to make a contribution.
                  </p>
                )}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ContributeModal;
