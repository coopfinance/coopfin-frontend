 ```diff
--- a/src/components/dashboard/recent-activity.tsx
+++ b/src/components/dashboard/recent-activity.tsx
@@ -1,7 +1,163 @@
+"use client";
+
+import { useState } from "react";
+import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
+import { formatDistanceToNow } from "date-fns";
+import { useWalletStore } from "@/store/wallet-store";
+import { Notification } from "@/types";
+
+const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
+
+const activityIcons: Record<string, string> = {
+  contribution: "💰",
+  loan: "🏧",
+  vote: "🗳️",
+  distribution: "📤",
+};
+
+const activityLabels: Record<string, string> = {
+  contribution: "Contribution",
+  loan: "Loan",
+  vote: "Vote",
+  distribution: "Distribution",
+};
+
+async function fetchNotifications(recipient: string): Promise<Notification[]> {
+  // TODO: connect to API
+  // const response = await fetch(`${API_URL}/api/notifications?recipient=${recipient}`);
+  // if (!response.ok) {
+  //   throw new Error("Failed to fetch notifications");
+  // }
+  // return response.json();
+
+  // Mock data for development
+  return [
+    {
+      id: "1",
+      recipient,
+      type: "contribution",
+      description: "Adaeze contributed 50 USDC to Eko Savings",
+      read: false,
+      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
+    },
+    {
+      id: "2",
+      recipient,
+      type: "loan",
+      description: "Loan request of 200 USDC approved by governance",
+      read: false,
+      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
+    },
+    {
+      id: "3",
+      recipient,
+      type: "vote",
+      description: "New proposal: Increase minimum contribution to 100 USDC",
+      read: true,
+      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
+    },
+    {
+      id: "4",
+      recipient,
+      type: "distribution",
+      description: "Q1 profit distribution of 500 USDC sent to members",
+      read: true,
+      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
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
+  console.log(`Marked notification ${id} as read`);
+}
+
 export function RecentActivity() {
-    return (
-      <div className="p-4 border rounded-xl bg-card text-card-foreground">
-        <p className="text-sm text-muted-foreground">Recent activity feed coming soon...</p>
-      </div>
-    );
-  }
+  const { address } = useWalletStore();
+  const queryClient = useQueryClient();
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
+      await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id)));
+    },
+    onSuccess: () => {
+      queryClient.invalidateQueries({ queryKey: ["notifications", address] });
+    },
+  });
+
+  if (!address) {
+    return (
+      <div className="p-4 border rounded-xl bg-card text-card-foreground">
+        <p className="text-sm text-muted-foreground">Connect your wallet to see activity</p>
+      </div>
+    );
+  }
+
+  if (isLoading) {
+    return (
+      <div className="p-4 border rounded-xl bg-card text-card-foreground">
+        <p className="text-sm text-muted-foreground">Loading activity...</p>
+      </div>
+    );
+  }
+
+  if (error || !notifications || notifications.length === 0) {
+    return (
+      <div className="p-4 border rounded-xl bg-card text-card-foreground">
+        <p className="text-sm text-muted-foreground">No recent activity</p>
+      </div>
+    );
+  }
+
+  const hasUnread = notifications.some((n) => !n.read);
+
+  return (
+    <div className="border rounded-xl bg-card text-card-foreground flex flex-col">
+      <div className="flex items-center justify-between p-4 pb-2">
+        <h3 className="font-semibold text-sm">Recent Activity</h3>
+        {hasUnread && (
+          <button
+            onClick={() => markAllReadMutation.mutate()}
+            className="text-xs text-primary hover:underline disabled:opacity-50"
+            disabled={markAllReadMutation.isPending}
+          >
+            Mark all read
+          </button>
+        )}
+      </div>
+      <div className="flex-1 overflow-y-auto max-h-[400px]">
+        {notifications.map((notification, index) => (
+          <div key={notification.id}>
+            <div className="flex items-start gap-3 p-4 py-3 hover:bg-accent/50 transition-colors">
+              <span className="text-lg flex-shrink-0 mt-0.5" role="img" aria-label={activityLabels[notification.type]}>
+                {activityIcons[notification.type]}
+              </span>
+              <div className="flex-1 min-w-0">
+                <p className="text-sm leading-relaxed">{notification.description}</p>
+                <p className="text-xs