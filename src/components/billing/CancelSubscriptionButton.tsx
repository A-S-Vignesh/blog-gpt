"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Cancel-subscription control for the billing page. POSTs to the existing
 * /api/payments/cancel endpoint (cancel at cycle end), then refreshes the
 * server component so the new "canceled — access until …" state renders.
 */
export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not cancel. Please try again.");
        setLoading(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Cancel your subscription? You&apos;ll keep access until the end of your
        current billing period, then move to the Free plan. No refund is issued
        for the current period.
      </p>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={cancel}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={loading}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-60"
        >
          Keep my plan
        </button>
      </div>
    </div>
  );
}
