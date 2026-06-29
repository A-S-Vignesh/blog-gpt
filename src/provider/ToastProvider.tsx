"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// Type is conveyed by a vivid icon, not a tinted background — so the card can
// stay solid/high-contrast (white in light, dark-gray in dark) and always be
// readable, instead of pale-text-on-pale-bg.
const TOAST_STYLES: Record<ToastType, { icon: ReactNode; accent: string }> = {
  success: { icon: <FaCheckCircle />, accent: "text-green-500" },
  error: { icon: <FaTimesCircle />, accent: "text-red-500" },
  warning: { icon: <FaExclamationTriangle />, accent: "text-amber-500" },
  info: { icon: <FaInfoCircle />, accent: "text-blue-500" },
};

const ToastContext = createContext<any>(null);

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-5 right-5 z-9999 flex w-full max-w-xs flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="toast-anim pointer-events-auto flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 dark:ring-white/10"
          >
            <span
              className={`mt-0.5 shrink-0 text-lg ${TOAST_STYLES[toast.type].accent}`}
            >
              {TOAST_STYLES[toast.type].icon}
            </span>
            <span className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-100">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
