import { Resend } from "resend";

let cachedClient: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

export function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "The Blog GPT <no-reply@thebloggpt.com>"
  );
}

export function getReplyToAddress(): string | undefined {
  return process.env.RESEND_REPLY_TO || undefined;
}
