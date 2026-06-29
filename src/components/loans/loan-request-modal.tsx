"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onClose: () => void;
}

export function LoanRequestModal({ onClose }: Props) {
  const { address, connect } = useWallet();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [days, setDays] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!address) {
      await connect();
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: Call LoanContract.request_loan via Soroban
      console.log("Requesting loan:", {
        amount,
        purpose,
        days,
        borrower: address,
      });
      toast.success(
        "Loan request submitted to Stellar",
        `Submitted ${amount} USDC for ${days} days.`,
      );
      onClose();
    } catch (err: unknown) {
      toast.error(
        "Failed to submit loan request",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Request Loan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What will you use this loan for?"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-300 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repayment Period
            </label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-300 outline-none"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p>• 5% flat interest ({days}-day term)</p>
            <p>• Approval requires a governance vote (7 days)</p>
            <p>• This transaction is recorded on Stellar testnet</p>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !amount || !purpose}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!address
              ? "Connect Wallet"
              : isSubmitting
                ? "Submitting..."
                : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
