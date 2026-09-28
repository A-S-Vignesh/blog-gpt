import Link from "next/link";
import type { IconType } from "react-icons";

type Props = {
  label: string;
  value: number;
  /**
   * Overrides how `value` is printed. Needed for money: values are stored in
   * cents, and the default `toLocaleString()` would render $123.45 as "12,345".
   * `value` is still the number the alert styling keys off.
   */
  display?: string;
  icon: IconType;
  /** Small line under the value — e.g. "+12 this week". */
  hint?: string;
  /** Turns the card into a link to the screen that acts on it. */
  href?: string;
  /** Draws attention when the number represents a queue that needs work. */
  alert?: boolean;
};

/** One dashboard counter. Server component — no interactivity to hydrate. */
export default function StatCard({
  label,
  value,
  display,
  icon: Icon,
  hint,
  href,
  alert = false,
}: Props) {
  const needsAttention = alert && value > 0;

  const body = (
    <div
      className={`h-full rounded-xl border p-4 transition ${
        needsAttention
          ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      } ${href ? "hover:border-blue-400 dark:hover:border-blue-600" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
        <Icon
          className={
            needsAttention
              ? "text-red-500"
              : "text-gray-400 dark:text-gray-500"
          }
        />
      </div>
      <p
        className={`mt-2 text-3xl font-bold ${
          needsAttention
            ? "text-red-600 dark:text-red-400"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {display ?? value.toLocaleString()}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
