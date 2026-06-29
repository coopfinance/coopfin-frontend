 ```diff
--- a/src/types/index.ts
+++ b/src/types/index.ts
@@ -88,3 +88,22 @@
   totalLoansValue: number;
   totalDividendsDistributed: number;
 }
+
+export type NotificationType = "contribution" | "loan" | "vote" | "distribution";
+
+export interface Notification {
+  id: string;
+  recipient: string;
+  type: NotificationType;
+  title: string;
+  description: string;
+  read: boolean;
+  createdAt:ribs: string;
+  metadata?: Record<string, unknown>;
+}
+
+export interface NotificationResponse {
+  notifications: Notification[];
+  unreadCount: number;
+}
+
--- a/src/components/dashboard/recent-activity.tsx
+++ b/src/components/dashboard/recent-activity.tsx
@@ -0,0 +1,195 @@
+"use client";
+
+import { useState } from "react";
+import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
+import { formatDistanceToNow } from "date-fns";
+import { useWalletStore } from "@/store/wallet";
+import { Notification, NotificationType } from "@/types";
+
+const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
+
+const activityIcons: Record<NotificationType, string> = {
+  contribution: "💰",
+  loan: "🏧",
+  vote: "🗳️",
+  distribution: "📤",
+};
+
+const activityLabels: Record<NotificationType, string> = {
+  contribution: "Contribution",
+  loan: "Loan",
+  vote: "Vote",
+  distribution: "Distribution",
+};
+
+async function fetchNotifications(recipient: string): Promise<Notification[]> {
+  // TODO: connect to API
+  // const response = await fetch(`${API_URL}/api/notifications?recipient=${encodeURIComponent(recipient)}`);
+  // if (!response.ok) {
+  //   throw new Error("Failed to fetch notifications");
+  // }
+  // const data: NotificationResponse = await response.json();
+  // return data.notifications;
+
+  // Mock data for development
+  return [
+    {
+      id: "1",
+      recipient,
+      type: "contribution",
+      title: "New Contribution",
+      description: "Adaeze contributed 50 USDC to Eko Savings",
+      read: false,
+      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
+    },
+    {
+      id: "2",
+      recipient,
+      type: "loan",
+      title: "Loan Approved",
+      description: "Your loan request of 200 USDC has been approved",
+      read: false,
+      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
+    },
+    {
+      id: "3",
+      recipient,
+      type: "vote",
+      title: "Proposal Vote",
+      description: "New governance proposal: Increase contribution limit",
+      read: true,
+      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
+    },
+    {
+      id: "4",
+      recipient,
+      type: "distribution",
+      title: "Dividend Distribution",
+      description: "You received 12.5 USDC from Q3 profit distribution",
+      read: true,
+      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
+    },
+  ];
+}
+
+async function markNotificationAsRead(id: string): Promise<void> {
+  // TODO: connect to API
+  // const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
+  //   method: "PATCH",
+  // });
+  // if (!response.ok) {
+  //   throw new Error("Failed to mark notification as read");
+  // }
+  return Promise.resolve();
+}
+
+export function RecentActivity() {
+  const { address } = useWalletStore();
+  const queryClient = useQueryClient();
+  const [markingAll, setMarkingAll] = useState(false);
+
+  const {
+    data: notifications,
+    isLoading,
+    error,
+  } = useQuery({
+    queryKey: ["notifications", address],
+    queryFn: () => fetchNotifications(address!),
+    enabled: !!address,
+  });
+
+  const markAllReadMutation = useMutation({
+    mutationFn: async () => {
+      if (!notifications) return;
+      const unreadNotifications = notifications.filter((n) => !n.read);
+      await Promise.all(unreadNotifications.map((n) => markNotificationAsRead peer(n.id)));
+    },
+    onSuccess: () => {
+      queryClient.invalidate2.invalidateQueries({ queryKey: ["notifications", address] });
+    },
+  });
+
+  const handleMarkAllRead = async () => {
+    setMarkingAll(true);
+    try {
+      await markAllReadMutation.mutateAsync();
+    } finally {
+      setMarkingAll(false);
+    }
+  };
+
+  if (!address) {
+    return (
+      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
+        <p className="text-sm text-gray-500 dark:text-gray-400">
+          Connect your wallet to see activity
+        </p>
+      </div>
+    );
+  }
+
+  if (isLoading) {
+    return (
+      <div className="flex h-64 items-center justify-center">
+        <p className="text-sm text-gray-500">Loading activity...</p>
+      </div>
+    );
+  }
+
+  if (error) {
+    return (
+      <div className="flex h-64 items-center justify-center">
+        <p className="text-sm text-red-500">Failed to load activity</p>
+      </div>
+    );
+  }
+
+  if (!notifications || notifications.length === 0) {
+    return (
+      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
+        <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p