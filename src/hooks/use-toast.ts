import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const genId = () => Math.random().toString(36).substring(2, 9);

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, title) => {
    const id = genId();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, title }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const useToast = () => {
  const toasts = useToastStore((s) => s.toasts);
  const addToast = useToastStore((s) => s.addToast);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return {
    toasts,
    toast: {
      success: (msg: string, title?: string) => addToast('success', msg, title),
      error: (msg: string, title?: string) => addToast('error', msg, title),
      info: (msg: string, title?: string) => addToast('info', msg, title),
    },
    dismissToast,
  };
};

export type { Toast, ToastType };
