"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, X } from "lucide-react";
import {
  BASE_FEE,
  Contract,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";

import { useWallet } from "@/hooks/use-wallet";
import {
  STELLAR_NETWORK,
  formatAmount,
  networkPassphrase,
  parseAmount,
  server,
  simulateContractCall,
} from "@/lib/stellar";
import type { Group } from "@/types";

type TxStatus = "idle" | "signing" | "pending" | "success" | "error";

interface ContributeModalProps {
  group: Group;
  /** Optional override for the USDC SAC contract id. Falls back to env. */
  usdcContractId?: string;
  onClose: () => void;
}

const USDC_CONTRACT_ID =
  process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || "";

/** Compute the current contribution period (1-indexed) from group rules. */
function computeCurrentPeriod(group: Group): number {
  const start = new Date(group.createdAt).getTime();
  const now = Date.now();
  const periodMs = Math.max(1, group.rules.contributionPeriodDays) * 86_400_000;
  return Math.max(1, Math.floor((now - start) / periodMs) + 1);
}

function explorerTxUrl(hash: string): string {
  const net = STELLAR_NETWORK === "MAINNET" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

export function ContributeModal({
  group,
  usdcContractId = USDC_CONTRACT_ID,
  onClose,
}: ContributeModalProps) {
  const queryClient = useQueryClient();
  const { address, connect, isConnecting, signTransaction } = useWallet();

  const initialPeriod = useMemo(() => computeCurrentPeriod(group), [group]);
  const [amount, setAmount] = useState<string>(
    (group.rules.minContribution / 10_000_000).toString()
  );
  const [period, setPeriod] = useState<number>(initialPeriod);

  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Load wallet USDC balance via SAC `balance(Address)` simulation.
  useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      if (!address || !usdcContractId) return;
      setLoadingBalance(true);
      setBalanceError(null);
      try {
        const result = (await simulateContractCall(
          usdcContractId,
          "balance",
          [new Address(address).toScVal()],
          address
        )) as bigint | number | null;
        if (cancelled) return;
        setBalance(result == null ? 0n : BigInt(result as bigint));
      } catch (err) {
        if (cancelled) return;
        setBalanceError(
          err instanceof Error ? err.message : "Failed to load balance"
        );
      } finally {
        if (!cancelled) setLoadingBalance(false);
      }
    }
    loadBalance();
    return () => {
      cancelled = true;
    };
  }, [address, usdcContractId]);

  // ---- Validation -------------------------------------------------------
  const amountStroops = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    try {
      return parseAmount(amount);
    } catch {
      return null;
    }
  }, [amount]);

  const minStroops = BigInt(group.rules.minContribution);

  const validationError = useMemo(() => {
    if (amountStroops === null) return "Enter a valid amount";
    if (amountStroops < minStroops) {
      return `Minimum contribution is ${formatAmount(minStroops)} USDC`;
    }
    if (balance !== null && amountStroops > balance) {
      return "Amount exceeds wallet balance";
    }
    if (!Number.isInteger(period) || period < 1) {
      return "Period must be a positive integer";
    }
    return null;
  }, [amountStroops, minStroops, balance, period]);

  const treasuryId = group.contractAddresses?.treasury;
  const canSubmit =
    !!address &&
    !!treasuryId &&
    validationError === null &&
    (status === "idle" || status === "error");

  // ---- Submission -------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    if (!address || !treasuryId || amountStroops === null) return;
    setError(null);
    setTxHash(null);
    try {
      // 1. Build
      const account = await server.getAccount(address);
      const contract = new Contract(treasuryId);
      const op = contract.call(
        "contribute",
        new Address(address).toScVal(),
        nativeToScVal(amountStroops, { type: "i128" }),
        nativeToScVal(period, { type: "u32" })
      );

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(60)
        .build();

      // 2. Prepare (simulate + assemble footprint/auth)
      const prepared = await server.prepareTransaction(tx);

      // 3. Sign
      setStatus("signing");
      const signedXdr = await signTransaction(prepared.toXDR());
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

      // 4. Submit
      setStatus("pending");
      const sendResponse = await server.sendTransaction(signedTx);
      if (sendResponse.status === "ERROR") {
        throw new Error(
          `Submit failed: ${JSON.stringify(sendResponse.errorResult)}`
        );
      }
      const hash = sendResponse.hash;
      setTxHash(hash);

      // 5. Poll
      const deadline = Date.now() + 60_000;
      let getResp = await server.getTransaction(hash);
      while (
        getResp.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND &&
        Date.now() < deadline
      ) {
        await new Promise((r) => setTimeout(r, 2_000));
        getResp = await server.getTransaction(hash);
      }

      if (getResp.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        setStatus("success");
        // Refresh related queries so balances/history update.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["groups"] }),
          queryClient.invalidateQueries({ queryKey: ["group", group.id] }),
          queryClient.invalidateQueries({
            queryKey: ["contributions", group.id],
          }),
        ]);
      } else if (
        getResp.status === SorobanRpc.Api.GetTransactionStatus.FAILED
      ) {
        throw new Error("Transaction failed on-chain");
      } else {
        throw new Error("Transaction not confirmed before timeout");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Contribution failed");
    }
  }, [
    address,
    treasuryId,
    amountStroops,
    period,
    signTransaction,
    queryClient,
    group.id,
  ]);

  // ---- Render -----------------------------------------------------------
  const submitting = status === "signing" || status === "pending";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Contribute to {group.name}</h2>
            <p className="text-xs text-gray-500">
              Send USDC to the group treasury on Stellar{" "}
              {STELLAR_NETWORK === "MAINNET" ? "Mainnet" : "Testnet"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === "success" && txHash ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <p className="font-medium">Contribution confirmed 🎉</p>
              <p className="mt-1">
                {formatAmount(amountStroops ?? 0n)} USDC sent for period {period}.
              </p>
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-green-700 hover:underline break-all"
              >
                View on Stellar Expert <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Wallet / balance */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
              {address ? (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Wallet balance</span>
                    <span className="font-medium text-gray-900">
                      {loadingBalance
                        ? "Loading…"
                        : balance !== null
                        ? `${formatAmount(balance)} USDC`
                        : balanceError
                        ? "Unavailable"
                        : "—"}
                    </span>
                  </div>
                  {!usdcContractId && (
                    <p className="mt-1 text-xs text-amber-600">
                      USDC contract id not configured (NEXT_PUBLIC_USDC_CONTRACT_ID).
                    </p>
                  )}
                </>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {isConnecting ? "Connecting…" : "Connect wallet"}
                </button>
              )}
            </div>

            {/* Amount */}
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Amount (USDC)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={group.rules.minContribution / 10_000_000}
                step="0.0000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-gray-500">
                Minimum: {formatAmount(minStroops)} USDC
              </span>
            </label>

            {/* Period */}
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </span>
              <input
                type="number"
                min={1}
                step={1}
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-gray-500">
                Current cycle: {initialPeriod}
              </span>
            </label>

            {/* Validation / errors */}
            {address && validationError && (
              <p className="text-xs text-red-600">{validationError}</p>
            )}
            {status === "error" && error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 break-words">
                {error}
              </div>
            )}
            {!treasuryId && (
              <p className="text-xs text-red-600">
                Group is missing a treasury contract address.
              </p>
            )}

            {/* Status pill */}
            {submitting && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                {status === "signing"
                  ? "Waiting for wallet signature…"
                  : "Submitting and waiting for confirmation…"}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing…" : "Contribute"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContributeModal;
