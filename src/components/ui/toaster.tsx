"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { useToast } from "@/hooks/use-toast";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

const variantConfig = {
  success: {
    icon: CheckCircle,
    className: "border-green-500/50 bg-green-50 text-green-900",
    iconClassName: "text-green-600",
  },
  error: {
    icon: XCircle,
    className: "border-red-500/50 bg-red-50 text-red-900",
    iconClassName: "text-red-600",
  },
  info: {
    icon: Info,
    className: "border-blue-500/50 bg-blue-50 text-blue-900",
    iconClassName: "text-blue-600",
  },
};

export function Toaster() {
  const { toasts, dismissToast } = useToast();

  return (
    <ToastPrimitives.Provider swipeDirection="right" duration={5000}>
      {toasts.map((t) => {
        const config = variantConfig[t.type];
        const Icon = config.icon;

        return (
          <ToastPrimitives.Root
            key={t.id}
            duration={5000}
            onOpenChange={(open) => {
              if (!open) dismissToast(t.id);
            }}
            className={cn(
              "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=open]:duration-300",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=closed]:duration-200",
              config.className
            )}
            role={t.type === "error" ? "alert" : "status"}
          >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClassName)} aria-hidden="true" />

            <div className="flex-1 space-y-1">
              {t.title && (
                <ToastPrimitives.Title className="text-sm font-semibold leading-tight">
                  {t.title}
                </ToastPrimitives.Title>
              )}
              <ToastPrimitives.Description className="text-sm leading-snug opacity-90">
                {t.message}
              </ToastPrimitives.Description>
            </div>

            <ToastPrimitives.Close
              className={cn(
                "absolute right-2 top-2 rounded-md p-1 opacity-60 transition-opacity",
                "hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2"
              )}
              aria-label="Close notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </ToastPrimitives.Close>
          </ToastPrimitives.Root>
        );
      })}

      <ToastPrimitives.Viewport
        className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[400px]"
      />
    </ToastPrimitives.Provider>
  );
}

export default Toaster;
