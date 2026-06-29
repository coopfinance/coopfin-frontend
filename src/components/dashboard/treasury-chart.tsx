"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { TrendingUp } from "lucide-react";

const CONTRIBUTION_COLOR = "#16a34a";
const LOAN_COLOR = "#d97706";

interface TreasuryChartProps {
  groupId?: string;
}

interface ContributionPoint {
  period: number;
  contributions: number;
  loans: number;
}

interface ApiContribution {
  period: number;
  amount: number;
  loansOutstanding?: number;
}

interface ApiResponse {
  contributions: ApiContribution[];
}

const USDC = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

async function fetchContributions(groupId: string): Promise<ContributionPoint[]> {
  const { data } = await axios.get<ApiResponse>(`/api/groups/${groupId}/contributions`);
  const rows = data?.contributions ?? [];

  // Build cumulative contribution series sorted by period.
  const sorted = [...rows].sort((a, b) => a.period - b.period);
  let cumContrib = 0;
  return sorted.map((row) => {
    cumContrib += row.amount ?? 0;
    return {
      period: row.period,
      contributions: cumContrib,
      loans: row.loansOutstanding ?? 0,
    };
  });
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-gray-900">Period {label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey as string} className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {USDC.format(Number(entry.value ?? 0))} USDC
          </span>
        </p>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="h-64 w-full animate-pulse rounded-lg bg-gray-100"
      aria-label="Loading treasury chart"
      role="status"
    />
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
        <TrendingUp className="h-5 w-5 text-green-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">No treasury activity yet</p>
        <p className="mt-1 text-xs text-gray-500">
          Once members start contributing, balances will appear here.
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
      >
        Make first contribution
      </button>
    </div>
  );
}

export function TreasuryChart({ groupId }: TreasuryChartProps) {
  const enabled = Boolean(groupId);

  const { data, isLoading, isError } = useQuery<ContributionPoint[]>({
    queryKey: ["treasury-contributions", groupId],
    queryFn: () => fetchContributions(groupId as string),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const series = useMemo(() => data ?? [], [data]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Treasury balance</h3>
          <p className="text-xs text-gray-500">
            Cumulative contributions vs. outstanding loans
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: CONTRIBUTION_COLOR }}
            />
            Contributions
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: LOAN_COLOR }}
            />
            Loans
          </span>
        </div>
      </div>

      {!enabled || isLoading ? (
        <ChartSkeleton />
      ) : isError || series.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="contributionsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CONTRIBUTION_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CONTRIBUTION_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="loansFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LOAN_COLOR} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={LOAN_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `P${v}`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => USDC.format(v)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e5e7eb" }} />
              <Area
                type="monotone"
                dataKey="contributions"
                name="Total Contributions"
                stroke={CONTRIBUTION_COLOR}
                strokeWidth={2}
                fill="url(#contributionsFill)"
              />
              <Area
                type="monotone"
                dataKey="loans"
                name="Loans Outstanding"
                stroke={LOAN_COLOR}
                strokeWidth={2}
                fill="url(#loansFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
