"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle } from "lucide-react";
import { LoanCard } from "@/components/loans/loan-card";
import { LoanRequestModal } from "@/components/loans/loan-request-modal";
import { formatAmount } from "@/lib/stellar";
import type { Loan } from "@/types";

async function fetchLoans(): Promise<Loan[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans`);
  if (!res.ok) throw new Error("Failed to fetch loans");
  return res.json();
}

const STATUS_TABS = ["All", "Pending", "Approved", "Repaid", "Defaulted"] as const;

export default function LoansPage() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [showRequest, setShowRequest] = useState(false);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: fetchLoans,
    refetchInterval: 30_000,
  });

  const filtered = activeTab === "All"
    ? loans
    : loans.filter((l) => l.status === activeTab);

  const totalActive = loans
    .filter((l) => l.status === "Approved")
    .reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-sm text-gray-500">
            {loans.filter((l) => l.status === "Approved").length} active loans
            · ${formatAmount(totalActive)} outstanding
          </p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Request Loan
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab !== "All" && (
              <span className="ml-1.5 text-xs text-gray-400">
                ({loans.filter((l) => l.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
          <AlertCircle className="w-8 h-8" />
          <p>No {activeTab.toLowerCase()} loans found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}

      {showRequest && <LoanRequestModal onClose={() => setShowRequest(false)} />}
    </div>
  );
}
