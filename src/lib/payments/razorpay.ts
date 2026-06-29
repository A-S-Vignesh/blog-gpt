import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";

let cachedClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (cachedClient) return cachedClient;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment.",
    );
  }
  cachedClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  return cachedClient;
}

export function getRazorpayPublicKey(): string {
  return process.env.RAZORPAY_KEY_ID || "";
}

/**
 * True only when Razorpay credentials are configured, i.e. checkout can
 * actually run. Used to hide/disable the upgrade CTAs (and reject the
 * create-subscription route) while payments are not yet live, so users never
 * hit a broken "Upgrade" button.
 */
export function isPaymentsEnabled(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
}

/**
 * Verify the HMAC signature returned by Razorpay Checkout
 * (after a successful subscription authentication).
 *
 * The signed payload is `${subscriptionId}|${paymentId}`.
 */
export function verifyCheckoutSignature(opts: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const expected = createHmac("sha256", keySecret)
    .update(`${opts.subscriptionId}|${opts.paymentId}`)
    .digest("hex");

  return constantTimeEqual(expected, opts.signature);
}

/**
 * Verify the webhook signature sent in the `x-razorpay-signature` header.
 * Razorpay signs the raw request body with the webhook secret.
 */
export function verifyWebhookSignature(opts: {
  rawBody: string;
  signature: string;
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(opts.rawBody)
    .digest("hex");

  return constantTimeEqual(expected, opts.signature);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
