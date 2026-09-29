'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ToastInput, ToastItem, ToastTone } from './types';
import { ToastViewport } from './ToastViewport';

type ToastApi = {
  push: (input: ToastInput) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
};

export type { ToastApi };

const ToastContext = createContext<ToastApi | null>(null);

let idSeq = 0;
function nextId() {
  idSeq += 1;
  return `toast-${Date.now()}-${idSeq}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId();
      const tone: ToastTone = input.tone ?? 'info';
      const durationMs = input.durationMs ?? (tone === 'error' ? 5000 : 3500);
      const item: ToastItem = {
        id,
        title: input.title,
        message: input.message,
        tone,
        durationMs,
      };
      setItems((prev) => [...prev.slice(-4), item]);
      if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs);
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      dismiss,
      success: (message, title = 'تم بنجاح') =>
        push({ message, title, tone: 'success' }),
      error: (message, title = 'فشل العملية') =>
        push({ message, title, tone: 'error' }),
      info: (message, title) => push({ message, title, tone: 'info' }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast يجب استخدامه داخل ToastProvider');
  }
  return ctx;
}
