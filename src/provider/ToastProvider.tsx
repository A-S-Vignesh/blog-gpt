"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

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

      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-4 py-3 rounded-md shadow-md border w-72
              animate-slideIn fadeOut
              transition-all duration-300
              ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-600 dark:text-green-300 dark:border-green-400"
                  : toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-600 dark:text-red-300 dark:border-red-400 dark:bg-dark-100"
                  : toast.type === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:text-yellow-300 dark:border-yellow-400"
                  : "bg-blue-50 border-blue-200 text-blue-600 dark:text-blue-300 dark:border-blue-400"
              }
            `}
          >
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
