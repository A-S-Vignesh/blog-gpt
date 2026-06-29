import { Metadata } from "next";
import CancelDeleteClient from "@/components/account/CancelDeleteClient";

export const metadata: Metadata = {
  title: "Cancel account deletion | TheBlogGPT",
  robots: { index: false, follow: false },
};

export default async function CancelDeletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="min-h-screen bg-white dark:bg-dark-100 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Cancel account deletion
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Click the button below to cancel your scheduled account deletion.
          Your data will not be removed.
        </p>
        <CancelDeleteClient token={token ?? ""} />
      </div>
    </main>
  );
}
