"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign } from "lucide-react";
import { formatAmount } from "@/lib/stellar";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface ChartDataPoint {
  period: string;
  totalContributions: number;
  loansOutstanding: number;
}

interface TreasuryChartProps {
  groupId?: string;
}

interface ContributionRecord {
  period?: string | number;
  month?: string;
  cycle?: string | number;
  amount?: number;
  totalContributions?: number;
  cumulativeContributions?: number;
  loansOutstanding?: number;
  timestamp?: string;
}

const DEMO_DATA: ChartDataPoint[] = [
  { period: "C1", totalContributions: 50_000_000_000, loansOutstanding: 0 },
  {
    period: "C2",
    totalContributions: 125_000_000_000,
    loansOutstanding: 30_000_000_000,
  },
  {
    period: "C3",
    totalContributions: 210_000_000_000,
    loansOutstanding: 55_000_000_000,
  },
  {
    period: "C4",
    totalContributions: 320_000_000_000,
    loansOutstanding: 40_000_000_000,
  },
  {
    period: "C5",
    totalContributions: 450_000_000_000,
    loansOutstanding: 70_000_000_000,
  },
  {
    period: "C6",
    totalContributions: 580_000_000_000,
    loansOutstanding: 65_000_000_000,
  },
  {
    period: "C7",
    totalContributions: 720_000_000_000,
    loansOutstanding: 90_000_000_000,
  },
  {
    period: "C8",
    totalContributions: 850_000_000_000,
    loansOutstanding: 80_000_000_000,
  },
];

function isContributionRecord(value: unknown): value is ContributionRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.period === "string" ||
    typeof record.period === "number" ||
    typeof record.month === "string" ||
    typeof record.cycle === "string" ||
    typeof record.cycle === "number" ||
    typeof record.amount === "number" ||
    typeof record.totalContributions === "number" ||
    typeof record.cumulativeContributions === "number"
  );
}

function formatPeriod(record: ContributionRecord, index: number): string {
  if (record.period !== undefined) return String(record.period);
  if (record.month) return record.month;
  if (record.cycle !== undefined) return String(record.cycle);
  if (record.timestamp) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      year: "numeric",
    }).format(new Date(record.timestamp));
  }

  return `C${index + 1}`;
}

function normalizeContributionData(data: unknown): ChartDataPoint[] {
  if (!Array.isArray(data)) {
    return [];
  }

  let runningContributions = 0;

  return data.filter(isContributionRecord).map((record, index) => {
    runningContributions += record.amount ?? 0;

    return {
      period: formatPeriod(record, index),
      totalContributions:
        record.totalContributions ??
        record.cumulativeContributions ??
        runningContributions,
      loansOutstanding: record.loansOutstanding ?? 0,
    };
  });
}

async function fetchContributionData(groupId: string): Promise<ChartDataPoint[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${groupId}/contributions`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch group contributions");
  }

  const data: unknown = await res.json();
  return normalizeContributionData(data);
}

function formatTooltipValue(value: ValueType, name: NameType): [string, string] {
  const amount = typeof value === "number" ? value : Number(value);
  return [
    Number.isFinite(amount) ? `${formatAmount(amount)} USDC` : String(value),
    String(name),
  ];
}

export function TreasuryChart({ groupId }: TreasuryChartProps) {
  const hasGroupId = Boolean(groupId);
  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ["treasury-chart", groupId],
    queryFn: () => {
      if (!groupId) {
        return Promise.resolve([]);
      }

      return fetchContributionData(groupId);
    },
    enabled: hasGroupId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // TODO: wire groupId from dashboard route/API when dashboard has a selected group.
  const data = hasGroupId ? fetchedData : DEMO_DATA;
  const hasData = data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Treasury Overview
          </h3>
          <p className="text-xs text-gray-500">
            Cumulative USDC balance by contribution period
          </p>
        </div>
        {!hasGroupId && (
          <span className="w-fit rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
            Demo data
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="h-64 space-y-3">
          <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
          <div className="h-48 w-full bg-gray-100 animate-pulse rounded" />
        </div>
      ) : !hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <DollarSign className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium mb-1">
            No contribution data yet
          </p>
          <p className="text-xs text-gray-400 max-w-[220px]">
            Start recording group contributions to see treasury growth and loan
            balances here.
          </p>
          <p className="mt-3 text-xs font-medium text-green-600">
            Add the first USDC contribution to populate this chart.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="colorContributions"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(value: number) => formatAmount(value, 0)}
            />
            <Tooltip
              labelFormatter={(label) => `Period: ${String(label)}`}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "0.875rem",
              }}
              formatter={formatTooltipValue}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
            />
            <Area
              type="monotone"
              dataKey="totalContributions"
              name="Total Contributions"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#colorContributions)"
            />
            <Area
              type="monotone"
              dataKey="loansOutstanding"
              name="Loans Outstanding"
              stroke="#d97706"
              strokeWidth={2}
              fill="url(#colorLoans)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
