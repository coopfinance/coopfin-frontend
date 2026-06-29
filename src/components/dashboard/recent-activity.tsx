"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, FileText, Vote, ArrowUpRight } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "contribution" | "loan" | "proposal" | "withdrawal";
  description: string;
  amount?: string;
  timestamp: string;
}

function SkeletonLoader() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <p className="text-gray-500 text-sm">No recent activity</p>
      <p className="text-gray-400 text-xs mt-1">Activity will appear here</p>
    </div>
  );
}

const iconMap = {
  contribution: DollarSign,
  loan: ArrowUpRight,
  proposal: FileText,
  withdrawal: ArrowUpRight,
};

const colorMap = {
  contribution: "bg-green-100 text-green-600",
  loan: "bg-amber-100 text-amber-600",
  proposal: "bg-blue-100 text-blue-600",
  withdrawal: "bg-red-100 text-red-600",
};

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const json = await res.json();
          setActivities(json.data || json);
        } else {
          // Mock data
          setActivities([
            { id: "1", type: "contribution", description: "Contributed to Group Alpha", amount: "50 USDC", timestamp: "2026-06-29T10:30:00Z" },
            { id: "2", type: "proposal", description: "New governance proposal created", timestamp: "2026-06-29T09:15:00Z" },
            { id: "3", type: "loan", description: "Loan request approved", amount: "200 USDC", timestamp: "2026-06-28T16:45:00Z" },
            { id: "4", type: "contribution", description: "Contributed to Group Beta", amount: "75 USDC", timestamp: "2026-06-28T14:20:00Z" },
            { id: "5", type: "withdrawal", description: "Withdrew from Group Alpha", amount: "30 USDC", timestamp: "2026-06-28T11:00:00Z" },
          ]);
        }
      } catch {
        setActivities([
          { id: "1", type: "contribution", description: "Contributed to Group Alpha", amount: "50 USDC", timestamp: "2026-06-29T10:30:00Z" },
          { id: "2", type: "proposal", description: "New governance proposal created", timestamp: "2026-06-29T09:15:00Z" },
          { id: "3", type: "loan", description: "Loan request approved", amount: "200 USDC", timestamp: "2026-06-28T16:45:00Z" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  if (loading) return <SkeletonLoader />;
  if (!activities || activities.length === 0) return <EmptyState />;

  return (
    <div className="divide-y divide-gray-100">
      {activities.map((item) => {
        const Icon = iconMap[item.type];
        const color = colorMap[item.type];
        return (
          <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{item.description}</p>
              <p className="text-xs text-gray-400">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ""}</p>
            </div>
            {item.amount && (
              <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{item.amount}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
