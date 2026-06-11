"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TreasuryChart } from "@/components/dashboard/treasury-chart";
import { formatAmount } from "@/lib/stellar";
import type { DashboardStats } from "@/types";

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your cooperative finances on Stellar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Groups"
          value={stats?.totalGroups ?? 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Members"
          value={stats?.totalMembers ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Contributions"
          value={`$${formatAmount(stats?.totalContributions ?? 0)}`}
          icon={DollarSign}
          color="green"
          subtitle="USDC on Stellar"
        />
        <StatCard
          title="Active Loans"
          value={stats?.totalLoansActive ?? 0}
          icon={CreditCard}
          color="amber"
          subtitle={`$${formatAmount(stats?.totalLoansValue ?? 0)} total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TreasuryChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
