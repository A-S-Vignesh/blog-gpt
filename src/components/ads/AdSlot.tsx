"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdPlacement } from "@/config/ads";

type ServedAd = {
  id: string;
  campaignId: string;
  headline: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  placement: AdPlacement;
};

/**
 * Renders one ad, or nothing at all.
 *
 * Two behaviours matter for reporting honesty:
 *
 *  - The impression is recorded only once the card is actually ON SCREEN
 *    (IntersectionObserver, 50% visible), not when it mounts. Nothing is
 *    metered any more — the advertiser paid a flat day rate either way — so
 *    this is no longer about billing at all. It is about the number we show
 *    them being true: counting cards that rendered below the fold and were
 *    never seen would inflate the one figure they use to judge whether the
 *    slot was worth it.
 *  - Clicks go through /api/ads/click/[id], which records the click and then
 *    redirects. The destination never reaches the browser until then, so it
 *    cannot be scraped out of the feed.
 *
 * When there is no eligible campaign this renders null — no placeholder, no
 * layout shift, no "advertisement" label hanging over empty space.
 */
export default function AdSlot({
  placement,
  className = "",
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/serve?placement=${placement}`)
      .then((r) => (r.ok ? r.json() : { ad: null }))
      .then((data) => {
        if (!cancelled) setAd(data?.ad ?? null);
      })
      .catch(() => {
        // A failed ad fetch is not worth surfacing to a reader.
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  useEffect(() => {
    if (!ad || !ref.current || recorded.current) return;

    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !recorded.current) {
            recorded.current = true;
            observer.disconnect();
            // Fire-and-forget beacon; the response carries nothing we need.
            void fetch("/api/ads/impression", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adId: ad.id }),
              keepalive: true,
            }).catch(() => {});
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad]);

  if (!ad) return null;

  const isSidebar = ad.placement === "sidebar";

  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 ${className}`}
    >
      <Link
        href={`/api/ads/click/${ad.id}`}
        target="_blank"
        // noopener/noreferrer: the destination is advertiser-controlled, so it
        // must never get a window.opener handle back into the reader's tab.
        rel="noopener noreferrer nofollow sponsored"
        className="block"
      >
        {ad.imageUrl && !isSidebar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl}
            alt=""
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        )}

        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Sponsored
            </span>
          </div>

          <div className={isSidebar && ad.imageUrl ? "flex gap-3" : ""}>
            {ad.imageUrl && isSidebar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.imageUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold leading-snug text-gray-900 dark:text-white">
                {ad.headline}
              </h3>
              {ad.body && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {ad.body}
                </p>
              )}
            </div>
          </div>

          <span className="mt-3 inline-block text-sm font-semibold text-blue-600 dark:text-blue-400">
            {ad.ctaLabel} →
          </span>
        </div>
      </Link>
    </div>
  );
}
