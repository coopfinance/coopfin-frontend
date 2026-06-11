"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { ProposalCard } from "@/components/governance/proposal-card";
import { CreateProposalModal } from "@/components/governance/create-proposal-modal";
import type { Proposal } from "@/types";
import { clsx } from "clsx";

async function fetchProposals(): Promise<Proposal[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/governance/proposals`);
  if (!res.ok) throw new Error("Failed to fetch proposals");
  return res.json();
}

export default function GovernancePage() {
  const [filter, setFilter] = useState<string>("Active");
  const [showCreate, setShowCreate] = useState(false);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
    refetchInterval: 15_000,
  });

  const counts = {
    Active:   proposals.filter((p) => p.status === "Active").length,
    Passed:   proposals.filter((p) => p.status === "Passed").length,
    Failed:   proposals.filter((p) => p.status === "Failed").length,
    Executed: proposals.filter((p) => p.status === "Executed").length,
  };

  const filtered = filter === "All"
    ? proposals
    : proposals.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Governance</h1>
          <p className="text-sm text-gray-500">On-chain proposals and member voting via Stellar</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Proposal
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active",   count: counts.Active,   icon: Clock,        color: "text-blue-600  bg-blue-50"  },
          { label: "Passed",   count: counts.Passed,   icon: CheckCircle,  color: "text-green-600 bg-green-50" },
          { label: "Failed",   count: counts.Failed,   icon: XCircle,      color: "text-red-500   bg-red-50"   },
          { label: "Executed", count: counts.Executed, icon: CheckCircle,  color: "text-gray-600  bg-gray-100" },
        ].map(({ label, count, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={clsx(
              "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
              filter === label ? "border-brand-300 ring-2 ring-brand-100" : "border-gray-200 hover:border-gray-300"
            )}
          >
            <Icon className={clsx("w-5 h-5", color.split(" ")[0])} />
            <div>
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No {filter.toLowerCase()} proposals found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => <ProposalCard key={p.id} proposal={p} />)}
        </div>
      )}

      {showCreate && <CreateProposalModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
