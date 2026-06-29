"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  CreditCard,
  DollarSign,
  Inbox,
  Loader2,
  Send,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/hooks/use-wallet";
import type { Notification, NotificationType } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const activityIcons: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  contribution: { icon: DollarSign, className: "bg-green-50 text-green-600" },
  loan: { icon: CreditCard, className: "bg-amber-50 text-amber-600" },
  vote: { icon: Vote, className: "bg-blue-50 text-blue-600" },
  distribution: { icon: Send, className: "bg-purple-50 text-purple-600" },
};

function isUnread(notification: Notification) {
  return notification.isRead === false || !notification.readAt;
}

function getActivityDescription(notification: Notification) {
  if (notification.description) return notification.description;

  const actor = notification.actorName ?? notification.actor ?? "Someone";
  const group = notification.groupName ? ` to ${notification.groupName}` : "";
  const amount = notification.amount
    ? ` ${notification.amount} ${notification.currency ?? "USDC"}`
    : "";

  switch (notification.type) {
    case "contribution":
      return `${actor} contributed${amount}${group}`;
    case "loan":
      return `${actor} requested a loan${amount}${group}`;
    case "vote":
      return `${actor} cast a vote${group}`;
    case "distribution":
      return `${actor} received a distribution${amount}${group}`;
    default:
      return "New activity";
  }
}

function getRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return formatDistanceToNow(date, { addSuffix: true });
}

async function fetchNotifications(address: string): Promise<Notification[]> {
  const res = await fetch(`${API_BASE}/api/notifications?recipient=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");

  const payload = (await res.json()) as Notification[] | { notifications?: Notification[] };
  return Array.isArray(payload) ? payload : payload.notifications ?? [];
}

async function markNotificationRead(id: string) {
  const res = await fetch(`${API_BASE}/api/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });

  if (!res.ok) throw new Error("Failed to mark notification as read");
}

export function RecentActivity() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const queryKey = ["notifications", address];
  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(address ?? ""),
    enabled: Boolean(address),
    refetchInterval: 30_000,
  });

  const unreadNotifications = notifications.filter(isUnread);
  const markAllRead = useMutation({
    mutationFn: () => Promise.all(unreadNotifications.map((item) => markNotificationRead(item.id))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <section className="bg-white rounded-xl border border-gray-200 h-80 flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-green-600 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900 truncate">Recent Activity</h2>
        </div>
        {unreadNotifications.length > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 disabled:opacity-60"
          >
            {markAllRead.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {!address && (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-gray-500">
          Connect your wallet to see activity
        </div>
      )}

      {address && isLoading && (
        <div className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading activity
        </div>
      )}

      {address && isError && (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-red-500">
          Could not load recent activity
        </div>
      )}

      {address && !isLoading && !isError && notifications.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-sm text-gray-500">
          <Inbox className="w-8 h-8 text-gray-300 mb-2" />
          No recent activity
        </div>
      )}

      {address && !isLoading && !isError && notifications.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {notifications.map((notification) => {
            const icon = activityIcons[notification.type] ?? activityIcons.contribution;
            const Icon = icon.icon;

            return (
              <div key={notification.id} className="px-5 py-4 border-b border-gray-100 last:border-b-0 flex gap-3">
                <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", icon.className)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-700 leading-5 flex-1">
                      {getActivityDescription(notification)}
                    </p>
                    {isUnread(notification) && (
                      <span className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0" aria-label="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{getRelativeTime(notification.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
