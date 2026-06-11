import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "green" | "blue" | "amber" | "red";
  subtitle?: string;
  change?: { value: number; isPositive: boolean };
}

const colorMap = {
  green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
  blue:  { bg: "bg-blue-50",  icon: "text-blue-600",  border: "border-blue-100"  },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
  red:   { bg: "bg-red-50",   icon: "text-red-600",   border: "border-red-100"   },
};

export function StatCard({ title, value, icon: Icon, color = "green", subtitle, change }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className={clsx("bg-white rounded-xl border p-5 flex items-start gap-4", colors.border)}>
      <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
        <Icon className={clsx("w-5 h-5", colors.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {change && (
          <p className={clsx("text-xs mt-1", change.isPositive ? "text-green-600" : "text-red-500")}>
            {change.isPositive ? "↑" : "↓"} {Math.abs(change.value)}% this month
          </p>
        )}
      </div>
    </div>
  );
}
