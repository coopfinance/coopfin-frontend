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
import { ArrowRight, CircleDollarSign } from "lucide-react";

interface TreasuryChartProps {
  groupId?: string;
}

interface TreasuryDataPoint {
  period: string;
  totalContributions: number;
  loansOutstanding: number;
}

interface ApiContribution {
  amount: number;
  period: number | string;
  loansOutstanding?: number;
}

interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number;
}

interface TreasuryTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
}

const MOCK_TREASURY_DATA: TreasuryDataPoint[] = [
  { period: "Jan", totalContributions: 1_200, loansOutstanding: 250 },
  { period: "Feb", totalContributions: 2_450, loansOutstanding: 620 },
  { period: "Mar", totalContributions: 3_780, loansOutstanding: 900 },
  { period: "Apr", totalContributions: 5_050, loansOutstanding: 1_150 },
  { period: "May", totalContributions: 6_620, loansOutstanding: 1_420 },
  { period: "Jun", totalContributions: 8_100, loansOutstanding: 1_680 },
];

function isContribution(value: unknown): value is ApiContribution {
  if (!value || typeof value !== "object") return false;

  const contribution = value as Partial<ApiContribution>;
  return (
    typeof contribution.amount === "number" &&
    (typeof contribution.period === "number" ||
      typeof contribution.period === "string")
  );
}

function resolveContributions(payload: unknown): ApiContribution[] {
  if (Array.isArray(payload)) {
    return payload.filter(isContribution);
  }

  if (payload && typeof payload === "object" && "contributions" in payload) {
    const contributions = (payload as { contributions: unknown }).contributions;
    return Array.isArray(contributions)
      ? contributions.filter(isContribution)
      : [];
  }

  return [];
}

function normalizeContributionData(
  contributions: ApiContribution[],
): TreasuryDataPoint[] {
  let cumulativeContributions = 0;

  return contributions
    .sort((a, b) =>
      String(a.period).localeCompare(String(b.period), undefined, {
        numeric: true,
      }),
    )
    .map((contribution) => {
      cumulativeContributions += contribution.amount;

      return {
        period: String(contribution.period),
        totalContributions: cumulativeContributions,
        loansOutstanding: contribution.loansOutstanding ?? 0,
      };
    });
}

async function fetchTreasuryData(
  groupId?: string,
): Promise<TreasuryDataPoint[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl || !groupId) {
    return MOCK_TREASURY_DATA;
  }

  const response = await fetch(`${apiUrl}/api/groups/${groupId}/contributions`);

  if (!response.ok) {
    return MOCK_TREASURY_DATA;
  }

  const payload: unknown = await response.json();
  const contributions = resolveContributions(payload);

  return normalizeContributionData(contributions);
}

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function TreasuryTooltip({ active, label, payload }: TreasuryTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-gray-500">Period {label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-5 text-xs"
          >
            <span className="flex items-center gap-2 text-gray-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-gray-900">
              {formatUsd(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreasuryChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
          <div className="mt-2 h-3 w-52 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="h-9 w-9 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="mt-8 h-64 rounded-lg bg-gray-100 animate-pulse" />
    </div>
  );
}

function TreasuryEmptyState() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
          <CircleDollarSign className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          No contribution data yet
        </h3>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          Start tracking group contributions to see cumulative treasury growth
          here.
        </p>
        <a
          href="/groups"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          View groups
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export function TreasuryChart({ groupId }: TreasuryChartProps) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["treasury-chart", groupId ?? "mock"],
    queryFn: () => fetchTreasuryData(groupId),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <TreasuryChartSkeleton />;
  }

  if (data.length === 0) {
    return <TreasuryEmptyState />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Treasury Growth
          </h2>
          <p className="text-sm text-gray-500">
            Cumulative USDC contributions and active loan exposure
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
          <CircleDollarSign className="h-5 w-5 text-green-600" />
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="totalContributions"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="loansOutstanding" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={(value: number) =>
                `$${Math.round(value / 1_000)}k`
              }
              width={48}
            />
            <Tooltip content={<TreasuryTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="totalContributions"
              name="Total Contributions"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#totalContributions)"
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="loansOutstanding"
              name="Loans Outstanding"
              stroke="#d97706"
              strokeWidth={2}
              fill="url(#loansOutstanding)"
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
