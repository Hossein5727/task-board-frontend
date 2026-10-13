"use client";

import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ToastContext = createContext<((type: ToastType, message: string) => void) | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = ++nextId;
      setToasts((all) => [...all.slice(-2), { id, type, message }]);
      setTimeout(() => dismiss(id), type === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            {toast.type === "success" ? (
              <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden="true" />
            ) : (
              <ExclamationCircleIcon className="mt-0.5 size-5 shrink-0 text-rose-400" aria-hidden="true" />
            )}
            <p className="flex-1 leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-zinc-400 hover:text-white"
              aria-label="بستن اعلان"
            >
              <XMarkIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return show;
}
