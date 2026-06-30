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
} from "recharts";
import { DollarSign } from "lucide-react";
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

async function fetchContributionData(groupId?: string): Promise<ChartDataPoint[]> {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/contributions`;
    
    if (groupId) {
      url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${groupId}/contributions`;
    } else {
      const groupsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups`);
      if (groupsRes.ok) {
        const groups = await groupsRes.json();
        if (Array.isArray(groups) && groups.length > 0) {
          const firstGroupId = groups[0].id;
          url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${firstGroupId}/contributions`;
        }
      }
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch contributions");
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Empty contributions");
    return data as ChartDataPoint[];
  } catch {
    return MOCK_DATA;
  }
}

interface TreasuryChartProps {
  groupId?: string;
}

export function TreasuryChart({ groupId }: TreasuryChartProps) {
  const { data = MOCK_DATA, isLoading } = useQuery<ChartDataPoint[]>({
    queryKey: ["treasury-chart", groupId],
    queryFn: () => fetchContributionData(groupId),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const hasData = data && data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Treasury Overview
        </h3>
      </div>
      {isLoading ? (
        <div className="h-64 space-y-3 flex flex-col justify-between py-2">
          <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
          <div className="h-48 w-full bg-gray-100 animate-pulse rounded" />
        </div>
      ) : !hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <DollarSign className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium mb-1">
            No contribution data yet
          </p>
          <p className="text-xs text-gray-400 max-w-[220px] mb-4">
            Start contributing to your cooperative to see treasury growth here.
          </p>
          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 transition-colors">
            Make Contribution
          </button>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "0.875rem",
                }}
                formatter={(value: number, name: string) => [
                  `$${formatAmount(value)}`,
                  name,
                ]}
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
        </div>
      )}
    </div>
  );
}
