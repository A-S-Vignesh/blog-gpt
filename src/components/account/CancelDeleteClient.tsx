"use client";

import { useState } from "react";
import Link from "next/link";

export default function CancelDeleteClient({ token }: { token: string }) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleCancel() {
    if (!token) {
      setState({
        kind: "error",
        message: "This link is missing the cancellation token.",
      });
      return;
    }
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/account/delete/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          kind: "error",
          message: data?.error || "Could not cancel deletion.",
        });
        return;
      }
      setState({ kind: "success" });
    } catch (err: any) {
      setState({
        kind: "error",
        message: err?.message || "Network error.",
      });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="space-y-4">
        <p className="text-green-700 dark:text-green-400 font-medium">
          Your account deletion has been canceled. Your data is safe.
        </p>
        <Link
          href="/auth/signin"
          className="block w-full text-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={state.kind === "loading"}
        className="block w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
      >
        {state.kind === "loading" ? "Canceling…" : "Cancel deletion"}
      </button>
      {state.kind === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          {state.message}
        </p>
      )}
    </div>
  );
}
