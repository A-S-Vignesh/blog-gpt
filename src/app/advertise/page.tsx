import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import {
  FaBullhorn,
  FaChartLine,
  FaCheckCircle,
  FaShieldAlt,
  FaBolt,
  FaArrowRight,
} from "react-icons/fa";
import { authOptions } from "@/lib/authOptions";
import {
  AD_DURATIONS,
  AD_PLACEMENTS,
  MIN_CAMPAIGN_DAYS,
  entryPriceCents,
  formatCentsShort,
  quotePrice,
} from "@/config/ads";

const FROM_PRICE = formatCentsShort(entryPriceCents());

export const metadata: Metadata = {
  title: "Advertise on The Blog GPT",
  description: `Reach readers who come to The Blog GPT for AI, technology, and writing. Book a placement by the day from ${FROM_PRICE} — one flat price, live in 24 hours.`,
  alternates: { canonical: "https://thebloggpt.com/advertise" },
  openGraph: {
    title: "Advertise on The Blog GPT",
    description: `Sponsor a slot by the day from ${FROM_PRICE}. Pick a placement, pick how long, pay once. No CPM, no bidding, no spend to babysit.`,
    url: "https://thebloggpt.com/advertise",
    type: "website",
  },
};

const STEPS = [
  {
    icon: FaBullhorn,
    title: "Pick a slot and a length",
    body: "Choose a placement, choose how many days, write your creative. You see the exact price as you go. Takes about three minutes.",
  },
  {
    icon: FaShieldAlt,
    title: "We review it",
    body: "A human checks every campaign, usually within 24 hours. Nothing runs until it's approved — and you're not charged until then either.",
  },
  {
    icon: FaBolt,
    title: "It goes live",
    body: "Pay once and your ad runs every day you booked. If review or checkout runs past your start date, we shift the start so you keep every day.",
  },
  {
    icon: FaChartLine,
    title: "Watch it work",
    body: "Impressions, clicks, CTR and days remaining, updated as they happen, in your own dashboard.",
  },
];

export default async function AdvertisePage() {
  const session = await getServerSession(authOptions);
  const startHref = session?.user?._id
    ? "/advertise/new"
    : "/auth/signin?callbackUrl=%2Fadvertise%2Fnew";

  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-200 px-4 py-16 sm:py-24 dark:border-gray-800">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            <FaBullhorn /> Advertise with us
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Put your product in front of
            <span className="text-blue-600"> readers who build things</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            The Blog GPT readers come for writing about AI, technology, and
            software. Sponsor a slot by the day from{" "}
            <strong className="text-gray-900 dark:text-white">
              {FROM_PRICE}
            </strong>{" "}
            — one flat price, self-serve, reviewed by a human.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={startHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              Start a campaign <FaArrowRight />
            </Link>
            <Link
              href="/advertise/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              My dashboard
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            No contract, no auto-renewal, no bidding. From{" "}
            {MIN_CAMPAIGN_DAYS} days.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <step.icon />
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    STEP {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RATE CARD ────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 px-4 py-16 dark:border-gray-800">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Placements &amp; pricing
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600 dark:text-gray-400">
            One flat price per day. No CPM, no bidding, no minimum spend to burn
            through — you book a slot for a number of days and that is the whole
            cost.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {Object.values(AD_PLACEMENTS).map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-2xl border border-gray-200 p-6 transition hover:border-blue-400 dark:border-gray-800 dark:hover:border-blue-600"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {p.name}
                </h3>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  {p.surface}
                </p>

                <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCentsShort(p.dayRateCents)}
                  <span className="text-sm font-normal text-gray-500">
                    {" "}
                    / day
                  </span>
                </p>

                <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-400">
                  {p.description}
                </p>

                <dl className="mt-5 space-y-1.5 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
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
                            <span className="ml-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              −{option.discountPercent}%
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
                  Only{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {p.maxConcurrent}
                  </strong>{" "}
                  advertiser{p.maxConcurrent === 1 ? "" : "s"} share this slot at
                  a time, so the days you buy stay worth buying.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMISES ─────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 px-4 py-16 dark:border-gray-800">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            What we promise
          </h2>
          <ul className="mt-6 space-y-4">
            {[
              [
                "The price you see is the price you pay",
                "One charge, up front, for the days you booked. Nothing is metered, nothing renews, and there is never a second invoice.",
              ],
              [
                "You get every day you paid for",
                "If review or checkout runs past your start date, we move the start to the day you pay rather than quietly clipping the run short.",
              ],
              [
                "We're honest about the numbers",
                "We're a young site, so we won't pretend to guarantee impressions. You get the slot, and a dashboard showing exactly what it delivered — the same reader seeing your ad again within the hour is counted once, not twenty times.",
              ],
              [
                "Slots are limited on purpose",
                "Only a couple of advertisers share a placement at a time, so a flat day rate isn't quietly split a dozen ways. Every campaign is reviewed by a person, which also means the ads next to yours have been.",
              ],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <FaCheckCircle className="mt-1 shrink-0 text-green-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl bg-gray-900 p-8 text-center dark:bg-gray-800">
            <h3 className="text-xl font-bold text-white">
              Ready when you are
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              Build a campaign now — you can save it as a draft and submit it
              whenever you like.
            </p>
            <Link
              href={startHref}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Start a campaign <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
