import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import {
  FaBullhorn,
  FaChartLine,
  FaCheck,
  FaShieldAlt,
  FaBolt,
  FaArrowRight,
  FaTag,
  FaCalendarCheck,
  FaLayerGroup,
} from "react-icons/fa";
import { authOptions } from "@/lib/authOptions";
import {
  AD_DURATIONS,
  AD_PLACEMENTS,
  MIN_CAMPAIGN_DAYS,
  entryPriceCents,
  formatCentsShort,
  quotePrice,
  type AdPlacement,
} from "@/config/ads";

// Everything below is derived from the rate card in config/ads.ts, so a price
// change there can never leave this page quoting a stale number.
// Cheapest whole booking (shortest run on the cheapest slot), e.g. "$14".
const FROM_PRICE = formatCentsShort(entryPriceCents());
// Cheapest DAY rate, e.g. "$2". Keep the two apart: "from $14 / day" would
// overstate the price sevenfold.
const FROM_DAY_RATE = formatCentsShort(
  Math.min(...Object.values(AD_PLACEMENTS).map((p) => p.dayRateCents)),
);
const MAX_SHARED = Math.max(
  ...Object.values(AD_PLACEMENTS).map((p) => p.maxConcurrent),
);
const BEST_DEAL = AD_DURATIONS.reduce((best, d) =>
  d.discountPercent > best.discountPercent ? d : best,
);

// Copy rule for this site: no em dashes in rendered text.
const DESCRIPTION = `Reach readers on The Blog GPT. Book a placement from ${FROM_DAY_RATE} a day, campaigns from ${FROM_PRICE}. One flat price, no bidding, reviewed by a person within about 24 hours.`;

export const metadata: Metadata = {
  title: "Advertise on The Blog GPT",
  description: DESCRIPTION,
  alternates: { canonical: "https://thebloggpt.com/advertise" },
  openGraph: {
    title: "Advertise on The Blog GPT",
    description: `Sponsor a slot from ${FROM_DAY_RATE} a day. Pick a placement, pick how long, pay once. No CPM, no bidding, no spend to babysit.`,
    url: "https://thebloggpt.com/advertise",
    type: "website",
    // A page-level openGraph replaces the root one wholesale, so the image has
    // to be restated or shares of this page go out without a picture.
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Advertise on The Blog GPT",
      },
    ],
  },
};

const STEPS = [
  {
    icon: FaBullhorn,
    title: "Pick a spot and a length",
    body: "Choose a placement and how many days, then write your ad. You see the exact price as you go. It takes about three minutes.",
  },
  {
    icon: FaShieldAlt,
    title: "We review it",
    body: "A person checks every campaign, usually within 24 hours. Nothing runs and nothing is charged until it's approved.",
  },
  {
    icon: FaBolt,
    title: "Pay once, go live",
    body: "Pay for the days you booked and your ad starts running. If review runs past your start date, the start moves so you keep every day.",
  },
  {
    icon: FaChartLine,
    title: "Watch it work",
    body: "See views, clicks, click rate and days left in your own dashboard, updated as they happen.",
  },
];

const PROMISES = [
  {
    icon: FaTag,
    title: "The price you see is the price you pay",
    body: "One charge, up front, for the days you booked. Nothing is metered, nothing renews, and there is never a second invoice.",
  },
  {
    icon: FaCalendarCheck,
    title: "You get every day you paid for",
    body: "If review or checkout runs past your start date, we move the start to the day you pay instead of cutting your run short.",
  },
  {
    icon: FaChartLine,
    title: "Honest numbers",
    body: "We're a young site, so we don't promise a set number of views. Your dashboard shows exactly what your ad delivered, and a reader who sees it twice in the same hour counts once.",
  },
  {
    icon: FaLayerGroup,
    title: "Limited slots, real review",
    body: `At most ${MAX_SHARED} advertisers share a placement at a time, so your day rate isn't split a dozen ways. A person reviews every campaign, so the ads next to yours have been checked too.`,
  },
];

const FAQS = [
  {
    q: "When am I charged?",
    a: "Only after a person approves your campaign. You pay once, up front, for the days you booked. Submitting a campaign for review is free.",
  },
  {
    q: "What if my campaign isn't approved?",
    a: "We tell you why, and you pay nothing. You can edit the campaign and submit it again.",
  },
  {
    q: "Does my ad renew automatically?",
    a: "No. It runs for the days you booked and then stops. Book again whenever you like.",
  },
  {
    q: "Can I save my campaign and finish later?",
    a: "Yes. Save it as a draft and submit it for review whenever you're ready.",
  },
  {
    q: "What currency are prices in?",
    a: "All prices are in US dollars (USD).",
  },
];

/* ─────────────────────────────── visuals ─────────────────────────────── */

/** Grey stand-in for a normal post card inside the mock-ups. */
function GhostPost({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800/60">
      {!compact && (
        <div className="mb-2 h-10 rounded-md bg-gray-100 dark:bg-gray-700/70" />
      )}
      <div className="h-2 w-4/5 rounded bg-gray-200 dark:bg-gray-600" />
      <div className="mt-1.5 h-1.5 w-full rounded bg-gray-100 dark:bg-gray-700" />
      <div className="mt-1 h-1.5 w-2/3 rounded bg-gray-100 dark:bg-gray-700" />
    </div>
  );
}

/** The highlighted "this is where your ad goes" block, with a name tag. */
function AdBlock({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <div className="relative rounded-lg border-2 border-blue-500 bg-blue-50 p-2.5 shadow-sm shadow-blue-500/20 dark:bg-blue-950/50">
      <span className="absolute -top-2.5 right-2 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        {label}
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        Sponsored
      </span>
      <div className="mt-1 h-2 w-3/4 rounded bg-blue-300 dark:bg-blue-700" />
      {!small && (
        <div className="mt-1 h-1.5 w-full rounded bg-blue-200 dark:bg-blue-800" />
      )}
      <div className="mt-1.5 h-1.5 w-10 rounded bg-blue-500" />
    </div>
  );
}

/** Hero illustration: the feed with both feed-page ad spots lit up. */
function HeroMockup() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-linear-to-tr from-blue-500/25 via-indigo-500/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 flex-1 truncate rounded-md bg-gray-100 px-3 py-1 text-[10px] text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            thebloggpt.com/feed
          </span>
        </div>
        <div className="flex gap-3 p-4 pt-5">
          <div className="flex-1 space-y-4">
            <GhostPost />
            <AdBlock label="In-feed" />
            <GhostPost compact />
          </div>
          <div className="w-[38%] space-y-4">
            <AdBlock label="Sidebar" small />
            <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800/60">
              <div className="h-2 w-1/2 rounded bg-gray-200 dark:bg-gray-600" />
              <div className="mt-1.5 h-1.5 w-full rounded bg-gray-100 dark:bg-gray-700" />
              <div className="mt-1 h-1.5 w-5/6 rounded bg-gray-100 dark:bg-gray-700" />
              <div className="mt-1 h-1.5 w-2/3 rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small diagram on each rate card showing where that placement appears. */
function PlacementPreview({ id }: { id: AdPlacement }) {
  const frame =
    "h-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 pt-4 dark:border-gray-700 dark:bg-gray-900";

  if (id === "sidebar") {
    return (
      <div className={frame} aria-hidden="true">
        <div className="flex gap-2.5">
          <div className="flex-1 space-y-2.5">
            <GhostPost compact />
            <GhostPost compact />
          </div>
          <div className="w-[40%]">
            <AdBlock label="Here" small />
          </div>
        </div>
      </div>
    );
  }

  if (id === "feed") {
    return (
      <div className={frame} aria-hidden="true">
        <div className="space-y-2.5">
          <GhostPost compact />
          <AdBlock label="Here" small />
          <GhostPost compact />
        </div>
      </div>
    );
  }

  return (
    <div className={frame} aria-hidden="true">
      <div className="h-2.5 w-3/5 rounded bg-gray-300 dark:bg-gray-600" />
      <div className="mt-2 space-y-1">
        <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-1.5 w-11/12 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-4">
        <AdBlock label="Here" small />
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-1.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

/* ──────────────────────────────── page ───────────────────────────────── */

export default async function AdvertisePage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user?._id;
  const startHref = signedIn
    ? "/advertise/new"
    : "/auth/signin?callbackUrl=%2Fadvertise%2Fnew";

  const stats = [
    { value: FROM_DAY_RATE, unit: "/ day", label: "Starting price" },
    { value: "~24h", unit: "", label: "Typical review time" },
    {
      value: String(MAX_SHARED),
      unit: "max",
      label: "Advertisers sharing a slot",
    },
    {
      value: `${BEST_DEAL.discountPercent}%`,
      unit: "off",
      label: `Bookings of ${BEST_DEAL.days}+ days`,
    },
  ];

  return (
    <div className="bg-white dark:bg-dark-100">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray-200 px-4 py-14 sm:py-20 dark:border-gray-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-blue-50/80 to-transparent dark:from-blue-950/30"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <FaBullhorn /> Advertise with us
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
              Put your product where{" "}
              <span className="text-blue-600 dark:text-blue-400">
                readers are paying attention
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600 lg:mx-0 dark:text-gray-400">
              Sponsor a spot on The Blog GPT from{" "}
              <strong className="text-gray-900 dark:text-white">
                {FROM_DAY_RATE} a day
              </strong>
              , with campaigns starting at {FROM_PRICE} for a week. One flat
              price, no bidding, and every ad is checked by a person before it
              runs.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={startHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
              >
                Start a campaign <FaArrowRight />
              </Link>
              <Link
                href={signedIn ? "/advertise/dashboard" : "#placements"}
                className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {signedIn ? "My campaigns" : "See placements and prices"}
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-600 lg:justify-start dark:text-gray-400">
              {[
                "No contract",
                "No auto-renewal",
                `From ${MIN_CAMPAIGN_DAYS} days`,
              ].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <FaCheck className="text-xs text-green-600 dark:text-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── QUICK FACTS ──────────────────────────────────────────────── */}
      <section className="border-b border-gray-200 px-4 py-10 dark:border-gray-800">
        <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col text-center">
              <dt className="order-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                {s.label}
              </dt>
              <dd className="text-3xl font-bold text-gray-900 dark:text-white">
                {s.value}
                {s.unit && (
                  <span className="ml-1 text-base font-medium text-gray-500 dark:text-gray-400">
                    {s.unit}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-600 dark:text-gray-400">
            Four steps from idea to live ad. You stay in control the whole way.
          </p>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/60"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                    <step.icon />
                  </span>
                  <span className="text-4xl font-bold text-gray-200 dark:text-gray-800">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── RATE CARD ────────────────────────────────────────────────── */}
      <section
        id="placements"
        className="scroll-mt-24 border-t border-gray-200 bg-gray-50 px-4 py-16 sm:py-20 dark:border-gray-800 dark:bg-gray-950/40"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Placements and pricing
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600 dark:text-gray-400">
            One flat price per day. No CPM, no bidding, no budget to burn
            through. You book a spot for a number of days and that is the whole
            cost. All prices in USD.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {Object.values(AD_PLACEMENTS).map((p) => (
              <div
                key={p.id}
                className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600"
              >
                {p.id === "feed" && (
                  <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Most visible
                  </span>
                )}

                <PlacementPreview id={p.id} />

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {p.surface}
                    </p>
                  </div>
                  <p className="text-right text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCentsShort(p.dayRateCents)}
                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                      per day
                    </span>
                  </p>
                </div>

                <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-400">
                  {p.description}
                </p>

                <dl className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
                  {AD_DURATIONS.map((option) => {
                    const quote = quotePrice(p.id, option.days);
                    return (
                      <div
                        key={option.days}
                        className="flex items-baseline justify-between"
                      >
                        <dt className="text-gray-600 dark:text-gray-400">
                          {option.label}
                          {option.discountPercent > 0 && (
                            <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                              Save {option.discountPercent}%
                            </span>
                          )}
                        </dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">
                          {formatCentsShort(quote.priceCents)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
                  At most{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {p.maxConcurrent}
                  </strong>{" "}
                  advertiser{p.maxConcurrent === 1 ? "" : "s"} share this spot
                  at a time, so the days you buy stay worth buying.
                </p>

                <Link
                  href={startHref}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                >
                  Book {p.name.toLowerCase()} <FaArrowRight className="text-xs" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMISES ─────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 px-4 py-16 sm:py-20 dark:border-gray-800">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            What we promise
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {PROMISES.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-gray-200 p-6 dark:border-gray-800"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  <item.icon />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 px-4 py-16 sm:py-20 dark:border-gray-800">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Questions advertisers ask
          </h2>
          <div className="mt-10 divide-y divide-gray-200 rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900 dark:text-white">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="text-xl leading-none text-gray-400 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Something else?{" "}
            <Link
              href="/contact"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 px-6 py-14 text-center shadow-xl sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="relative text-3xl font-bold text-white">
            Ready when you are
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-blue-100">
            Build your campaign now. You can save it as a draft and submit it
            whenever you like, and you only pay once it&apos;s approved.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={startHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50 sm:w-auto"
            >
              Start a campaign <FaArrowRight />
            </Link>
            {signedIn && (
              <Link
                href="/advertise/dashboard"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                My campaigns
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
