import type { IconType } from "react-icons";

/** One headline number. Shared by the advertiser and admin ad dashboards. */
export default function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: IconType;
  accent?: "default" | "positive" | "warning";
}) {
  const valueColor =
    accent === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-gray-900 dark:text-white";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
        {Icon && <Icon className="text-gray-400 dark:text-gray-500" />}
      </div>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}
