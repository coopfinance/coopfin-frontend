"use client";

import { CreditCard, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { formatAmount, shortenAddress } from "@/lib/stellar";
import { formatDistanceToNow } from "date-fns";
import type { Loan } from "@/types";
import { clsx } from "clsx";

const statusConfig: Record<
  Loan["status"],
  { label: string; icon: React.ElementType; color: string }
> = {
  Pending:   { label: "Pending",   icon: Clock,          color: "text-amber-600 bg-amber-50 border-amber-200"  },
  Approved:  { label: "Active",    icon: CheckCircle,    color: "text-green-600 bg-green-50 border-green-200"  },
  Repaid:    { label: "Repaid",    icon: CheckCircle,    color: "text-blue-600  bg-blue-50  border-blue-200"   },
  Rejected:  { label: "Rejected",  icon: XCircle,        color: "text-red-500   bg-red-50   border-red-200"    },
  Defaulted: { label: "Defaulted", icon: AlertTriangle,  color: "text-red-600   bg-red-50   border-red-200"    },
};

export function LoanCard({ loan }: { loan: Loan }) {
  const cfg = statusConfig[loan.status];
  const StatusIcon = cfg.icon;
  const repaymentPct = loan.amount > 0
    ? Math.min(100, Math.round((loan.amountRepaid / loan.amount) * 100))
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Loan #{loan.id}</p>
            <p className="text-xs text-gray-400">{shortenAddress(loan.borrower)}</p>
          </div>
        </div>
        <div className={clsx("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium", cfg.color)}>
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-400">Loan Amount</p>
          <p className="text-sm font-semibold text-gray-900">${formatAmount(loan.amount * 10_000_000)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Interest</p>
          <p className="text-sm font-semibold text-gray-900">{loan.interestBps / 100}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Due</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatDistanceToNow(new Date(loan.repaymentDue), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Repaid</span>
          <span>${formatAmount(loan.amountRepaid * 10_000_000)} / ${formatAmount(loan.amount * 10_000_000)} ({repaymentPct}%)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${repaymentPct}%` }}
          />
        </div>
      </div>

      {loan.purpose && (
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50">
          Purpose: {loan.purpose}
        </p>
      )}
    </div>
  );
}
