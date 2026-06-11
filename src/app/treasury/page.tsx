"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatAmount } from "@/lib/stellar";

export default function TreasuryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Treasury</h1>
        <p className="text-sm text-gray-500">On-chain USDC treasury balances across all groups</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Treasury Balance" value="$0.00" icon={DollarSign} color="green" subtitle="USDC on Stellar" />
        <StatCard title="Total Contributions (YTD)" value="$0.00" icon={TrendingUp} color="blue" />
        <StatCard title="Active Groups" value="0" icon={Users} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4 text-gray-900">Recent Transactions</h2>
        <div className="space-y-3">
          {[
            { type: "in",  label: "Monthly contribution — Adaeze O.", amount: 50,  time: "2 min ago" },
            { type: "out", label: "Loan disbursement — Chidi M.",     amount: 200, time: "1 hr ago"  },
            { type: "in",  label: "Loan repayment — Emeka T.",        amount: 75,  time: "3 hrs ago" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === "in" ? "bg-green-50" : "bg-red-50"
                }`}>
                  {tx.type === "in"
                    ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    : <ArrowUpRight className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.label}</p>
                  <p className="text-xs text-gray-400">{tx.time}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${
                tx.type === "in" ? "text-green-600" : "text-red-500"
              }`}>
                {tx.type === "in" ? "+" : "-"}${formatAmount(tx.amount * 10_000_000)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
