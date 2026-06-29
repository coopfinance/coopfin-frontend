"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useWalletStore } from "@/store/wallet-store";
import { Notification } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const activityIcons: Record<string, string> = {
  contribution: "💰",
  loan: "🏧",
  vote: "🗳️",
  distribution: "📤",
};

async function fetchNotifications(recipient: string): Promise<Notification[]> {
  const res = await fetch(`${API_URL}/api/notifications?recipient=${recipient}`);
  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return res.json();
}

async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

export function RecentActivity() {
  const { publicKey } = useWalletStore();
  const queryClient = useQueryClient();
  const [markingAll, setMarkingAll] = useState(false);

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", publicKey],
    queryFn: () => fetchNotifications(publicKey!),
    enabled: !!publicKey,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", publicKey] });
    },
  });

  const handleMarkAllRead = async () => {
    if (!notifications) return;
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    setMarkingAll(true);
    try {
      await Promise.all(
        unreadNotifications.map((n) => markNotificationRead(n.id))
      );
      queryClient.invalidateQueries({ queryKey: ["notifications", publicKey] });
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications?.some((n) => !n.read) ?? false;

  if (!publicKey) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Recent Activity
        </h3>
        <p className="text-muted-foreground text-sm">
          Connect your wallet to see activity
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Recent Activity
        </h3>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (error || !notifications || notifications.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Recent Activity
        </h3>
        <p className="text-muted-foreground text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Recent Activity
        </h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs text-primary hover:text-primary/80 disabled:opacity-50 font-medium"
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-0 max-h-[400px]">
        {notifications.map((notification, index) => (
          <div key={notification.id}>
            <div className="flex items-start gap-3 py-3">
              <span className="text-lg flex-shrink-0 mt-0.5">
                {activityIcons[notification.type] || "📋"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-card-foreground leading-relaxed">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!notification.read && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </div>
            {index < notifications.length - 1 && (
              <div className="border-b border-border/60" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import type { Notification } from "@/types";

// TODO: Replace with real API responses once backend is ready
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "mock-1",
    recipient: "",
    type: "contribution",
    description: "Adaeze contributed 50 USDC to Eko Savings",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "mock-2",
    recipient: "",
    type: "loan",
    description: "Chidi applied for a 200 USDC loan",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "mock-3",
    recipient: "",
    type: "vote",
    description: "Voting ended for Proposal #12",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "mock-4",
    recipient: "",
    type: "distribution",
    description: "50 USDC distributed to your account",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

async function fetchNotifications(recipient: string): Promise<Notification[]> {
  // TODO: connect to API
  if (!recipient) return MOCK_NOTIFICATIONS;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?recipient=${encodeURIComponent(recipient)}`
    );
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];
    return data as Notification[];
  } catch {
    // TODO: connect to API — returning mock data on error
    return MOCK_NOTIFICATIONS;
  }
}

async function markNotificationAsRead(id: string): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH" }
  );
  if (!res.ok) throw new Error("Failed to mark notification as read");
}

const ACTIVITY_CONFIG: Record<string, { icon: typeof DollarSign; color: string; bg: string }> = {
  contribution: { icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  loan: { icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
  vote: { icon: ThumbsUp, color: "text-blue-600", bg: "bg-blue-50" },
  distribution: { icon: Send, color: "text-purple-600", bg: "bg-purple-50" },
};

export function RecentActivity() {
  const { address, connect } = useWallet();
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["notifications", address],
    queryFn: () => fetchNotifications(address ?? ""),
    enabled: !!address,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const hasUnread = data.some((n) => !n.read);

  if (!address) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 h-64 flex flex-col items-center justify-center text-center gap-3">
        <Wallet className="w-8 h-8 text-gray-300" />
        <p className="text-sm text-gray-500">Connect your wallet to see activity</p>
        <button
          type="button"
          onClick={connect}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 underline"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 animate-pulse rounded" />
              <div className="h-2 w-16 bg-gray-100 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-64 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        {hasUnread && (
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              data.filter((n) => !n.read).forEach((n) => mutation.mutate(n.id));
            }}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto -mx-5 px-5">
        {data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-400">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((notification) => {
              const config = ACTIVITY_CONFIG[notification.type] || ACTIVITY_CONFIG.contribution;
              const Icon = config.icon;
              return (
                <div key={notification.id} className="flex items-start gap-3 py-3">
                  <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", config.bg)}>
                    <Icon className={clsx("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{notification.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
