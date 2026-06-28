"use client";

import { useEffect, useRef } from "react";
import { FaExclamationTriangle, FaSpinner } from "react-icons/fa";

type Variant = "danger" | "default";

type Props = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible confirmation dialog.
 *
 * - Locks page scroll while open.
 * - Closes on ESC and on backdrop click (unless `loading`).
 * - Focuses the safe option (Cancel) by default — destructive variants must
 *   never have the destructive button auto-focused.
 * - Supports a `loading` state so the parent can show progress without
 *   closing the dialog before the operation completes.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Lock body scroll while modal is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-focus the Cancel button so an accidental Enter doesn't delete.
    cancelBtnRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        // Click on the backdrop closes (but not on the dialog itself).
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-start gap-4 mb-4">
          {variant === "danger" && (
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${confirmClass}`}
          >
            {loading && <FaSpinner className="animate-spin" />}
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
