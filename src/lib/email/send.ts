import {
  getResendClient,
  getFromAddress,
  getReplyToAddress,
} from "@/lib/email/resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  /** Tag used for Resend analytics + future debugging. Keep stable per template. */
  tag?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Best-effort email send.
 *
 * Returns `{ ok: false, skipped: true }` (NOT throws) when Resend is not
 * configured, so transactional flows (signup, payments, deletions) can
 * complete in environments without email credentials. Always log the
 * result so we know when emails fail silently.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping email (tag=${input.tag ?? "none"})`,
    );
    return { ok: false, error: "Resend not configured", skipped: true };
  }

  try {
    const replyTo = getReplyToAddress();
    const result = await client.emails.send({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(replyTo ? { replyTo } : {}),
      ...(input.tag
        ? { tags: [{ name: "template", value: input.tag }] }
        : {}),
    });

    if (result.error) {
      console.error("[email] Resend returned error:", result.error);
      return { ok: false, error: result.error.message || "Resend error" };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (err: any) {
    console.error("[email] send failed:", err);
    return { ok: false, error: err?.message || "Unknown email error" };
  }
}
