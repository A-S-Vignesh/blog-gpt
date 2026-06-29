"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

// Overridable so forks send analytics to their own property; falls back to the
// canonical thebloggpt.com measurement id for the primary deployment.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-VWS6MTPDHT";

/**
 * GDPR-compliant analytics loader.
 *
 * - Defaults to OFF and only loads GA / Vercel Analytics after the user has
 *   explicitly accepted analytics cookies (read from localStorage).
 * - Listens for the "cookieConsentUpdated" event from CookiesBox so accepting
 *   starts analytics immediately, with no page reload.
 * - Crucially, handles WITHDRAWAL: once the third-party scripts are injected
 *   they can't be cleanly torn down at runtime (gtag/dataLayer and Vercel's
 *   injected script persist). So when consent flips from granted -> denied we
 *   set Google's kill switch and reload into a clean, analytics-free state.
 *   This is what makes "Reject" actually stop tracking.
 */
function readAnalyticsConsent(): boolean {
  try {
    const consent = JSON.parse(localStorage.getItem("cookieConsent") || "{}");
    return consent.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Delete the cookies Google Analytics already wrote (`_ga`, `_ga_<id>`, and the
 * legacy `_gid`/`_gat`). GA sets them on the registrable domain, so we expire
 * each one across every domain/path variant it might have used. Required by
 * GDPR when a user withdraws (or never granted) analytics consent — otherwise
 * the identifiers linger even after tracking stops.
 */
function clearAnalyticsCookies(): void {
  if (typeof document === "undefined") return;

  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter(
      (n) =>
        n.startsWith("_ga") || n.startsWith("_gid") || n.startsWith("_gat"),
    );
  if (names.length === 0) return;

  const host = window.location.hostname;
  const domainVariants = new Set<string>(["", host, `.${host}`]);
  const parts = host.split(".");
  if (parts.length > 2) {
    domainVariants.add(`.${parts.slice(-2).join(".")}`); // registrable domain
  }

  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
  for (const name of names) {
    for (const domain of domainVariants) {
      document.cookie =
        `${name}=; expires=${expired}; path=/` +
        (domain ? `; domain=${domain}` : "");
    }
  }
}

export default function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false);
  // Tracks the live value without re-subscribing the event listener.
  const enabledRef = useRef(false);

  useEffect(() => {
    const apply = (value: boolean) => {
      enabledRef.current = value;
      setEnabled(value);
    };

    const initialConsent = readAnalyticsConsent();
    // No consent (never granted, or previously withdrawn): make sure no GA
    // cookies are left lying around from an earlier session.
    if (!initialConsent) clearAnalyticsCookies();
    apply(initialConsent);

    const onConsentChange = () => {
      const next = readAnalyticsConsent();

      // Consent withdrawn after analytics had loaded: stop tracking for real —
      // flip GA's kill switch, delete the cookies it already set, and reload
      // into a clean, analytics-free state.
      if (enabledRef.current && !next) {
        (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] =
          true;
        clearAnalyticsCookies();
        window.location.reload();
        return;
      }

      apply(next);
    };

    window.addEventListener("cookieConsentUpdated", onConsentChange);
    return () =>
      window.removeEventListener("cookieConsentUpdated", onConsentChange);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Loaded only after explicit analytics consent. */}
      <GoogleAnalytics gaId={GA_ID} />
      <VercelAnalytics />
    </>
  );
}
