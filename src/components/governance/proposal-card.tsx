"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { shortenAddress } from "@/lib/stellar";
import type { Proposal } from "@/types";
import { clsx } from "clsx";

const TYPE_LABELS: Record<Proposal["type"], string> = {
  LoanApproval: "Loan Approval", TreasurySpend: "Treasury Spend",
  AddMember: "Add Member", RemoveMember: "Remove Member",
  UpdateRule: "Update Rule", General: "General",
};

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [hasVoted, setHasVoted] = useState(false);
  const total = proposal.votesFor + proposal.votesAgainst;
  const forPct = total > 0 ? Math.round((proposal.votesFor / total) * 100) : 0;
  const isActive = proposal.status === "Active";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
            #{proposal.id} · {TYPE_LABELS[proposal.type]}
          </span>
          <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium",
            proposal.status === "Active"   && "bg-blue-50 text-blue-700",
            proposal.status === "Passed"   && "bg-green-50 text-green-700",
            proposal.status === "Failed"   && "bg-red-50 text-red-500",
            proposal.status === "Executed" && "bg-gray-100 text-gray-600",
          )}>
            {proposal.status}
          </span>
        </div>
        {isActive && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Ends {formatDistanceToNow(new Date(proposal.deadline), { addSuffix: true })}</span>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{proposal.title}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{proposal.description}</p>
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span className="text-green-600 font-medium">✓ {proposal.votesFor} For ({forPct}%)</span>
          <span className="text-red-500 font-medium">✗ {proposal.votesAgainst} Against ({100 - forPct}%)</span>
        </div>
        <div className="h-2 bg-red-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: `${forPct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Quorum: {total}/{proposal.quorum} required
          {total >= proposal.quorum && <span className="text-green-600 ml-1">✓ Reached</span>}
        </p>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <User className="w-3 h-3" />
          <span>{shortenAddress(proposal.proposer)}</span>
        </div>
        {isActive && !hasVoted && (
          <div className="flex gap-2">
            <button onClick={() => setHasVoted(true)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
              <ThumbsUp className="w-3 h-3" /> For
            </button>
            <button onClick={() => setHasVoted(true)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
              <ThumbsDown className="w-3 h-3" /> Against
            </button>
          </div>
        )}
        {hasVoted && <span className="text-xs text-gray-400 italic">Vote recorded on Stellar</span>}
      </div>
    </div>
  );
}
