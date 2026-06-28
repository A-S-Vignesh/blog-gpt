"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { PlanId, BillingCycle } from "@/config/plans";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay Checkout"));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

type Props = {
  plan: PlanId;
  cycle: BillingCycle;
  label: string;
  className?: string;
  disabled?: boolean;
  /** Where to send the user after a successful, verified payment. */
  successHref?: string;
};

export default function CheckoutButton({
  plan,
  cycle,
  label,
  className,
  disabled,
  successHref = "/settings?upgraded=1",
}: Props) {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadRazorpayScript().catch(() => {
      /* surfaced when the user clicks */
    });
  }, []);

  async function handleClick() {
    setError(null);
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/pricing`);
      return;
    }
    if (status === "loading" || disabled) return;

    setLoading(true);
    try {
      await loadRazorpayScript();
      if (!window.Razorpay) {
        throw new Error("Payment library could not be loaded.");
      }

      const res = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not start checkout.");
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "TheBlogGPT",
        description: `${data.planName} (${cycle})`,
        prefill: {
          name: data.userName || session?.user?.name || "",
          email: data.userEmail || session?.user?.email || "",
        },
        notes: { plan, cycle },
        theme: { color: "#2563eb" },
        handler: async (response: {
          razorpay_subscription_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verify = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (!verify.ok) {
              const v = await verify.json().catch(() => ({}));
              setError(
                v?.error || "Payment verification failed. Please contact support.",
              );
              return;
            }
            // Webhook flips the user.plan; redirect back so the new plan info
            // appears within seconds.
            router.push(successHref);
          } catch (err: any) {
            setError(err?.message || "Verification request failed.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        setError(resp?.error?.description || "Payment failed.");
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || disabled}
        className={
          className ??
          "block w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
        }
      >
        {loading ? "Loading…" : label}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
