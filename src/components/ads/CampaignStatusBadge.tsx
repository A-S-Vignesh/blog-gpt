/**
 * Status pill shared by every campaign surface.
 *
 * The label is deliberately plainer than the stored value — an advertiser
 * shouldn't have to decode `pending_review`, and "In review" tells them the
 * one thing they want to know.
 */
const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  pending_review: {
    label: "In review",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  },
  rejected: {
    label: "Needs changes",
    className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  },
  active: {
    label: "Live",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  paused: {
    label: "Paused",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  },
  completed: {
    label: "Finished",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  },
  archived: {
    label: "Archived",
    className:
      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  },
};

const SCHEDULED = {
  label: "Scheduled",
  className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
};

export default function CampaignStatusBadge({
  status,
  paymentStatus,
}: {
  status: string;
  paymentStatus?: string;
}) {
  // Approved AND paid means it is only waiting for its start date (the hourly
  // job flips it to active then), so say that instead of a bare "Approved".
  const meta =
    status === "approved" && paymentStatus === "paid"
      ? SCHEDULED
      : (STATUS_META[status] ?? STATUS_META.draft);
  // An approved campaign that hasn't been paid for isn't running yet, and
  // saying only "Approved" would leave the advertiser waiting on us.
  const awaitingPayment =
    status === "approved" && paymentStatus === "unpaid";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}
      >
        {meta.label}
      </span>
      {awaitingPayment && (
        <span className="rounded-full bg-amber-700 px-2 py-0.5 text-xs font-semibold text-white">
          Payment due
        </span>
      )}
      {paymentStatus === "refunded" && (
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          Refunded
        </span>
      )}
    </span>
  );
}
