"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

export function useToastState() {
  return useToastStore((state) => ({
    toasts: state.toasts,
    removeToast: state.removeToast,
  }));
}

export function toastSuccess(title: string, description?: string) {
  return useToastStore.getState().addToast({
    title,
    description,
    variant: "success",
  });
}

export function toastError(title: string, description?: string) {
  return useToastStore.getState().addToast({
    title,
    description,
    variant: "error",
  });
}

export function toastInfo(title: string, description?: string) {
  return useToastStore.getState().addToast({
    title,
    description,
    variant: "info",
  });
}

export function useToast() {
  return {
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
  };
}
