"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

export default function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const consent = JSON.parse(localStorage.getItem("cookieConsent") || "{}");

    if (consent.analytics === true) {
      setEnabled(true);
    }
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Google Analytics (Next.js recommended way) */}
      <GoogleAnalytics gaId="G-VWS6MTPDHT" />

      {/* Vercel Analytics component (2025 recommended way) */}
      <VercelAnalytics />
    </>
  );
}
