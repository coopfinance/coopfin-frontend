"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import clsx from "clsx";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DashboardStats {
  totalGroups: number;
  totalMembers: number;
  totalContributions: number;
  totalLoansActive: number;
  totalLoansValue: number;
  totalDividendsDistributed: number;
}

interface Member {
  address: string;
  displayName?: string;
  totalContributed: number;
  joinedAt: string;
  isActive: boolean;
  loanBalance: number;
}

interface Group {
  id: string;
  name: string;
  description: string;
  admin: string;
  members: Member[];
  totalContributions: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  rules: Record<string, unknown>;
  contractAddresses: Record<string, string>;
}

interface Loan {
  id: number;
  borrower: string;
  amount: number;
  interestBps: number;
  repaymentDue: string;
  amountRepaid: number;
  status: "Pending" | "Approved" | "Repaid" | "Rejected" | "Defaulted";
  purpose: string;
  requestedAt: string;
  approvedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Brand colours                                                       */
/* ------------------------------------------------------------------ */

const BRAND = {
  green: "#16a34a",
  blue: "#2563eb",
  amber: "#d97706",
  purple: "#7c3aed",
  red: "#dc2626",
};

const LOAN_STATUS_COLORS: Record<Loan["status"], string> = {
  Pending: BRAND.amber,
  Approved: BRAND.blue,
  Repaid: BRAND.green,
  Rejected: BRAND.red,
  Defaulted: BRAND.purple,
};

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_CONTRIBUTIONS = [
  { month: "Jan", contributions: 12000 },
  { month: "Feb", contributions: 15500 },
  { month: "Mar", contributions: 18200 },
  { month: "Apr", contributions: 21000 },
  { month: "May", contributions: 24800 },
  { month: "Jun", contributions: 28500 },
  { month: "Jul", contributions: 32000 },
  { month: "Aug", contributions: 36400 },
  { month: "Sep", contributions: 39200 },
  { month: "Oct", contributions: 43800 },
  { month: "Nov", contributions: 47600 },
  { month: "Dec", contributions: 52000 },
];

const MOCK_LOAN_DISTRIBUTION = [
  { name: "Approved", value: 12 },
  { name: "Pending", value: 5 },
  { name: "Repaid", value: 28 },
  { name: "Rejected", value: 3 },
  { name: "Defaulted", value: 2 },
];

const MOCK_MEMBER_GROWTH = [
  { month: "Jan", newMembers: 4 },
  { month: "Feb", newMembers: 7 },
  { month: "Mar", newMembers: 5 },
  { month: "Apr", newMembers: 9 },
  { month: "May", newMembers: 11 },
  { month: "Jun", newMembers: 6 },
  { month: "Jul", newMembers: 8 },
  { month: "Aug", newMembers: 10 },
  { month: "Sep", newMembers: 7 },
  { month: "Oct", newMembers: 12 },
  { month: "Nov", newMembers: 9 },
  { month: "Dec", newMembers: 14 },
];

const MOCK_TOP_MEMBERS: (Member & { groupName: string })[] = [
  { address: "0xABC1…F23a", displayName: "Alice Chen", totalContributed: 18200, joinedAt: "2024-01-15", isActive: true, loanBalance: 0, groupName: "Savings Circle A" },
  { address: "0xDEF2…A91c", displayName: "Bob Martinez", totalContributed: 15600, joinedAt: "2024-02-20", isActive: true, loanBalance: 3200, groupName: "Savings Circle A" },
  { address: "0xGHI3…7E2b", displayName: "Carol Johnson", totalContributed: 14300, joinedAt: "2024-01-08", isActive: true, loanBalance: 0, groupName: "Investment Group B" },
  { address: "0xJKL4…C05d", displayName: "David Kim", totalContributed: 12100, joinedAt: "2024-03-12", isActive: true, loanBalance: 1500, groupName: "Investment Group B" },
  { address: "0xMNO5…9B3e", displayName: "Eva Rodriguez", totalContributed: 10800, joinedAt: "2024-02-05", isActive: false, loanBalance: 0, groupName: "Savings Circle A" },
  { address: "0xPQR6…2D4f", displayName: "Frank Liu", totalContributed: 9400, joinedAt: "2024-04-18", isActive: true, loanBalance: 5000, groupName: "Investment Group B" },
  { address: "0xSTU7…6C8a", displayName: "Grace Patel", totalContributed: 8700, joinedAt: "2024-05-22", isActive: true, loanBalance: 0, groupName: "Microloan Group C" },
  { address: "0xVWX8…1E9b", displayName: "Henry Brown", totalContributed: 7200, joinedAt: "2024-06-10", isActive: true, loanBalance: 2800, groupName: "Microloan Group C" },
];

const MOCK_STATS: DashboardStats = {
  totalGroups: 3,
  totalMembers: 48,
  totalContributions: 285000,
  totalLoansActive: 12,
  totalLoansValue: 86000,
  totalDividendsDistributed: 14200,
};

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function fetchGroups(): Promise<Group[]> {
  const res = await fetch("/api/groups");
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 h-64 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color: string;
  payload: Record<string, unknown>;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      {label && <p className="mb-1 text-xs font-semibold text-gray-700">{label}</p>}
      {payload.map((entry, idx) => (
        <p key={idx} className="text-xs text-gray-600">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium">{entry.name}:</span>{" "}
          {formatter && typeof entry.value === "number"
            ? formatter(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty State                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center text-gray-400">
      <svg
        className="mb-2 h-10 w-10"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 17v-2m3 2V9m3 8v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat Card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Number formatter                                                     */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

/* ------------------------------------------------------------------ */
/* Sort Icon                                                           */
/* ------------------------------------------------------------------ */

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) {
    return (
      <svg className="ml-1 inline h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return (
    <svg className="ml-1 inline h-3.5 w-3.5" fill="none" stroke={BRAND.green} viewBox="0 0 24 24" style={{ color: BRAND.green }}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={direction === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

type SortKey = "displayName" | "totalContributed" | "loanBalance" | "joinedAt" | "groupName";
type SortDir = "asc" | "desc";

export default function AnalyticsPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: fetchStats,
    retry: 1,
  });

  const {
    data: groups,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    retry: 1,
  });

  const [sortKey, setSortKey] = useState<SortKey>("totalContributed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  /* ------------------ Derive data from groups ------------------ */

  const contributionsData = useMemo(() => MOCK_CONTRIBUTIONS, []);

  const loanDistribution = useMemo(() => MOCK_LOAN_DISTRIBUTION, []);

  const memberGrowth = useMemo(() => MOCK_MEMBER_GROWTH, []);

  const topMembers = useMemo(() => {
    if (groups && groups.length > 0) {
      const all: (Member & { groupName: string })[] = [];
      for (const g of groups) {
        for (const m of g.members) {
          all.push({ ...m, groupName: g.name });
        }
      }
      // If API returns real members, use them; otherwise fallback
      if (all.length > 0) return all;
    }
    return MOCK_TOP_MEMBERS;
  }, [groups]);

  const sortedMembers = useMemo(() => {
    const arr = [...topMembers];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "displayName":
          cmp = (a.displayName ?? a.address).localeCompare(b.displayName ?? b.address);
          break;
        case "totalContributed":
          cmp = a.totalContributed - b.totalContributed;
          break;
        case "loanBalance":
          cmp = a.loanBalance - b.loanBalance;
          break;
        case "joinedAt":
          cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
          break;
        case "groupName":
          cmp = a.groupName.localeCompare(b.groupName);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [topMembers, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const useMock = statsError || groupsError || (!statsLoading && !stats);

  const effectiveStats: DashboardStats = stats ?? MOCK_STATS;

  /* ------------------ Render ------------------ */

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track contributions, loan performance, and member growth across all groups.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[88px] animate-pulse rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-3 h-6 w-20 rounded bg-gray-100" />
                </div>
              ))
            : (
              <>
                <StatCard label="Total Groups" value={formatNumber(effectiveStats.totalGroups)} color={BRAND.green} />
                <StatCard label="Total Members" value={formatNumber(effectiveStats.totalMembers)} color={BRAND.blue} />
                <StatCard label="Contributions" value={formatCurrency(effectiveStats.totalContributions)} color={BRAND.amber} />
                <StatCard label="Active Loans" value={formatNumber(effectiveStats.totalLoansActive)} color={BRAND.purple} />
                <StatCard label="Loans Value" value={formatCurrency(effectiveStats.totalLoansValue)} color={BRAND.red} />
                <StatCard label="Dividends" value={formatCurrency(effectiveStats.totalDividendsDistributed)} color={BRAND.green} />
              </>
            )}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Contributions Over Time */}
          {statsLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Contributions Over Time
                </h2>
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Monthly
                </span>
              </div>
              {contributionsData.length === 0 ? (
                <EmptyState message="No contribution data yet." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={contributionsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => formatCurrency(v)}
                    />
                    <Tooltip
                      content={<ChartTooltip formatter={formatCurrency} />}
                    />
                    <Line
                      type="monotone"
                      dataKey="contributions"
                      name="Contributions"
                      stroke={BRAND.green}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: BRAND.green }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Loan Distribution */}
          {statsLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Loan Distribution
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  By Status
                </span>
              </div>
              {loanDistribution.length === 0 ? (
                <EmptyState message="No loan data yet." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={loanDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {loanDistribution.map((entry, idx) => {
                        const status = entry.name as Loan["status"];
                        const color = LOAN_STATUS_COLORS[status] ?? BRAND.gray;
                        return <Cell key={idx} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip />}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", color: "#6b7280" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Member Growth */}
          {groupsLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Member Growth
                </h2>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  New / Month
                </span>
              </div>
              {memberGrowth.length === 0 ? (
                <EmptyState message="No member growth data yet." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={memberGrowth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                    />
                    <Bar
                      dataKey="newMembers"
                      name="New Members"
                      fill={BRAND.blue}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Summary card */}
          {statsLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Overview
                </h2>
              </div>
              <dl className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <dt className="text-sm text-gray-500">Avg. Contribution / Member</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {effectiveStats.totalMembers > 0
                      ? formatCurrency(
                          Math.round(effectiveStats.totalContributions / effectiveStats.totalMembers)
                        )
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <dt className="text-sm text-gray-500">Avg. Loan Value</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {effectiveStats.totalLoansActive > 0
                      ? formatCurrency(
                          Math.round(effectiveStats.totalLoansValue / effectiveStats.totalLoansActive)
                        )
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <dt className="text-sm text-gray-500">Loan-to-Deposit Ratio</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {effectiveStats.totalContributions > 0
                      ? `${((effectiveStats.totalLoansValue / effectiveStats.totalContributions) * 100).toFixed(1)}%`
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <dt className="text-sm text-gray-500">Dividend Yield</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {effectiveStats.totalContributions > 0
                      ? `${((effectiveStats.totalDividendsDistributed / effectiveStats.totalContributions) * 100).toFixed(2)}%`
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Avg. Members / Group</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {effectiveStats.totalGroups > 0
                      ? (effectiveStats.totalMembers / effectiveStats.totalGroups).toFixed(1)
                      : "—"}
                  </dd>
                </div>
              </dl>
              {useMock && (
                <p className="mt-4 text-xs text-gray-400">
                  * Showing mock data — API unavailable
                </p>
              )}
            </div>
          )}
        </div>

        {/* Top Contributing Members Table */}
        <div className="mt-6">
          {groupsLoading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Top Contributing Members
                </h2>
                <span className="text-xs text-gray-400">
                  {sortedMembers.length} member{sortedMembers.length !== 1 ? "s" : ""}
                </span>
              </div>

              {sortedMembers.length === 0 ? (
                <EmptyState message="No members found." />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th
                            className="cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            onClick={() => handleSort("displayName")}
                          >
                            Member
                            <SortIcon active={sortKey === "displayName"} direction={sortDir} />
                          </th>
                          <th
                            className="cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            onClick={() => handleSort("groupName")}
                          >
                            Group
                            <SortIcon active={sortKey === "groupName"} direction={sortDir} />
                          </th>
                          <th
                            className="cursor-pointer px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                            onClick={() => handleSort("totalContributed")}
                          >
                            Total Contributed
                            <SortIcon active={sortKey === "totalContributed"} direction={sortDir} />
                          </th>
                          <th
                            className="cursor-pointer px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                            onClick={() => handleSort("loanBalance")}
                          >
                            Loan Balance
                            <SortIcon active={sortKey === "loanBalance"} direction={sortDir} />
                          </th>
                          <th
                            className="cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            onClick={() => handleSort("joinedAt")}
                          >
                            Joined
                            <SortIcon active={sortKey === "joinedAt"} direction={sortDir} />
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedMembers.map((m) => (
                          <tr
                            key={m.address}
                            className="transition-colors hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap px-3 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {m.displayName ?? m.address}
                              </div>
                              {m.displayName && (
                                <div className="text-xs text-gray-400">
                                  {m.address}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">
                              {m.groupName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold" style={{ color: BRAND.green }}>
                              {formatCurrency(m.totalContributed)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right text-sm text-gray-600">
                              {m.loanBalance > 0 ? formatCurrency(m.loanBalance) : "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">
                              {new Date(m.joinedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={clsx(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                  m.isActive
                                    ? "bg-green-50 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                )}
                              >
                                {m.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {sortedMembers.map((m) => (
                      <div
                        key={m.address}
                        className="rounded-lg border border-gray-100 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {m.displayName ?? m.address}
                            </p>
                            <p className="text-xs text-gray-400">{m.groupName}</p>
                          </div>
                          <span
                            className={clsx(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              m.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            )}
                          >
                            {m.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                          <div>
                            <p className="text-xs text-gray-400">Contributed</p>
                            <p className="text-sm font-semibold" style={{ color: BRAND.green }}>
                              {formatCurrency(m.totalContributed)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Loan Balance</p>
                            <p className="text-sm text-gray-600">
                              {m.loanBalance > 0 ? formatCurrency(m.loanBalance) : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Joined {new Date(m.joinedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
