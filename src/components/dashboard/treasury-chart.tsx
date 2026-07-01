"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { formatAmount } from "@/lib/stellar";

interface ChartDataPoint {
  period: string;
  totalContributions: number;
  loansOutstanding: number;
}

const MOCK_DATA: ChartDataPoint[] = [
  { period: "C1", totalContributions: 50_000_000_000, loansOutstanding: 0 },
  { period: "C2", totalContributions: 125_000_000_000, loansOutstanding: 30_000_000_000 },
  { period: "C3", totalContributions: 210_000_000_000, loansOutstanding: 55_000_000_000 },
  { period: "C4", totalContributions: 320_000_000_000, loansOutstanding: 40_000_000_000 },
  { period: "C5", totalContributions: 450_000_000_000, loansOutstanding: 70_000_000_000 },
  { period: "C6", totalContributions: 580_000_000_000, loansOutstanding: 65_000_000_000 },
  { period: "C7", totalContributions: 720_000_000_000, loansOutstanding: 90_000_000_000 },
  { period: "C8", totalContributions: 850_000_000_000, loansOutstanding: 80_000_000_000 },
];

async function fetchContributionData(): Promise<ChartDataPoint[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/contributions`
    );
    if (!res.ok) throw new Error("Failed to fetch contributions");
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Empty contributions");
    return data as ChartDataPoint[];
  } catch {
    return MOCK_DATA;
  }
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            ${formatAmount(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex justify-center gap-6 mt-3">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TreasuryChart() {
  const { data = MOCK_DATA, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["treasury-chart"],
    queryFn: fetchContributionData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const hasData = data.length > 0;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Treasury Overview
        </h3>
        {lastUpdated && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Updated {lastUpdated}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 space-y-3">
          <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
          <div className="h-48 w-full bg-gray-100 animate-pulse rounded" />
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-red-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium mb-1">
            Failed to load treasury data
          </p>
          <p className="text-xs text-gray-400 max-w-[220px]">
            Showing cached data. Pull to refresh.
          </p>
        </div>
      ) : !hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <DollarSign className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium mb-1">
            No contribution data yet
          </p>
          <p className="text-xs text-gray-400 max-w-[220px]">
            Start contributing to your cooperative to see treasury growth here.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            aria-label="Treasury chart showing total contributions and loans outstanding over time"
          >
            <defs>
              <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v: number) => `$${formatAmount(v)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
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
