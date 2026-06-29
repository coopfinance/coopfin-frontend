"use client";

import * as Toast from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { clsx } from "clsx";
import { useToastState, type ToastItem } from "@/hooks/use-toast";

const TOAST_STYLES: Record<
  ToastItem["variant"],
  { icon: typeof CheckCircle2; classes: string }
> = {
  success: {
    icon: CheckCircle2,
    classes: "border-green-200 bg-green-50 text-green-900",
  },
  error: {
    icon: AlertCircle,
    classes: "border-red-200 bg-red-50 text-red-900",
  },
  info: {
    icon: Info,
    classes: "border-blue-200 bg-blue-50 text-blue-900",
  },
};

export function Toaster() {
  const { toasts, removeToast } = useToastState();

  return (
    <Toast.Provider duration={5000} swipeDirection="right">
      {toasts.map((toast) => {
        const config = TOAST_STYLES[toast.variant];
        const Icon = config.icon;

        return (
          <Toast.Root
            key={toast.id}
            open
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
            className={clsx(
              "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg",
              config.classes,
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <Toast.Title
                className="text-sm font-semibold"
                {...(toast.variant === "error" ? { role: "alert" } : {})}
              >
                {toast.title}
              </Toast.Title>
              {toast.description && (
                <Toast.Description className="mt-1 text-xs opacity-80">
                  {toast.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close
              className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </Toast.Close>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 outline-none" />
    </Toast.Provider>
  );
}
