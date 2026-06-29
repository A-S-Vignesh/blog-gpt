"use client";

import { useEffect } from "react";

// global-error replaces the root layout when an error is thrown in the layout
// itself, so it must render its own <html> and <body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error-boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#dc2626" }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: "1rem", maxWidth: "28rem", color: "#4b5563" }}>
          A critical error occurred while loading the page. Please try again.
        </p>
        {error.digest && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#9ca3af" }}>
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            background: "#2563eb",
            color: "#fff",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
