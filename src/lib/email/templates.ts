const SITE_NAME = "TheBlogGPT";
const SITE_URL = "https://thebloggpt.com";
// Absolute URL (emails can't use relative paths). 2000x353 source, shown at 32px tall.
const LOGO_URL = "https://thebloggpt.com/assets/images/BlackLogo.png";

/**
 * Minimal, mobile-friendly HTML email layout.
 * Inline-CSS only because email clients ignore <style> tags reliably.
 */
function layout({
  title,
  preheader,
  bodyHtml,
  cta,
}: {
  title: string;
  preheader: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
}): string {
  const ctaBlock = cta
    ? `
      <tr>
        <td style="padding:24px 32px 8px 32px;">
          <a href="${cta.url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-family:Arial,Helvetica,sans-serif;font-size:15px;">${cta.label}</a>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
                <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" alt="${SITE_NAME}" width="181" height="32" style="display:block;border:0;outline:none;text-decoration:none;height:32px;width:181px;" /></a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;color:#374151;">
                ${bodyHtml}
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td style="padding:24px 32px 32px 32px;color:#6b7280;font-size:12px;line-height:1.6;">
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px 0;" />
                You received this email because of an action on your ${SITE_NAME} account.<br/>
                <a href="${SITE_URL}/settings" style="color:#6b7280;text-decoration:underline;">Manage your account</a> &middot;
                <a href="${SITE_URL}/privacy-policy" style="color:#6b7280;text-decoration:underline;">Privacy</a> &middot;
                <a href="${SITE_URL}/terms-of-use" style="color:#6b7280;text-decoration:underline;">Terms</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function welcomeEmail(opts: { name: string }) {
  const safeName = escapeHtml(opts.name);
  return {
    subject: `Welcome to ${SITE_NAME}, ${safeName}!`,
    html: layout({
      title: `Welcome to ${SITE_NAME}`,
      preheader: "Your account is ready. Let's generate your first AI blog.",
      bodyHtml: `
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;">Welcome, ${safeName} 👋</h1>
        <p style="margin:0 0 12px 0;">Your account is ready. Here's what you can do:</p>
        <ul style="margin:0 0 16px 20px;padding:0;">
          <li>Generate blog posts with AI in under 5 minutes</li>
          <li>Publish under your own author page</li>
          <li>Rank on Google with built-in SEO</li>
        </ul>
        <p style="margin:0 0 0 0;">You have <strong>5 free AI generations per month</strong>. Upgrade anytime for more.</p>
      `,
      cta: { label: "Create your first post", url: `${SITE_URL}/post/generate` },
    }),
  };
}

export function subscriptionActivatedEmail(opts: {
  planName: string;
  amount: number;
  currency: string;
  renewsAt: Date | null;
}) {
  const renews = opts.renewsAt
    ? opts.renewsAt.toUTCString()
    : "the next billing cycle";
  return {
    subject: `Your ${SITE_NAME} ${opts.planName} plan is active`,
    html: layout({
      title: `${opts.planName} plan activated`,
      preheader: `You're now on the ${opts.planName} plan.`,
      bodyHtml: `
        <h1 style="margin:0 0 16px 0;font-size:22px;">${escapeHtml(opts.planName)} plan activated</h1>
        <p style="margin:0 0 12px 0;">Your subscription is active. Thanks for supporting ${SITE_NAME}!</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;width:100%;">
          <tr>
            <td style="padding:12px 16px;background:#f9fafb;font-weight:600;width:40%;">Plan</td>
            <td style="padding:12px 16px;">${escapeHtml(opts.planName)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background:#f9fafb;font-weight:600;border-top:1px solid #e5e7eb;">Amount</td>
            <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">${opts.amount} ${escapeHtml(opts.currency)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background:#f9fafb;font-weight:600;border-top:1px solid #e5e7eb;">Renews</td>
            <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">${escapeHtml(renews)}</td>
          </tr>
        </table>
      `,
      cta: { label: "Manage subscription", url: `${SITE_URL}/settings` },
    }),
  };
}

export function paymentFailedEmail(opts: { planName: string }) {
  return {
    subject: `Action needed: Payment failed for your ${SITE_NAME} subscription`,
    html: layout({
      title: "Payment failed",
      preheader: "We couldn't charge your saved payment method.",
      bodyHtml: `
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#991b1b;">Payment failed</h1>
        <p style="margin:0 0 12px 0;">We tried to charge your saved payment method for your ${escapeHtml(opts.planName)} plan and it didn't go through.</p>
        <p style="margin:0 0 12px 0;"><strong>What happens next:</strong> we'll retry automatically. To avoid losing access, please update your payment method.</p>
      `,
      cta: { label: "Update payment method", url: `${SITE_URL}/settings` },
    }),
  };
}

export function subscriptionCanceledEmail(opts: {
  planName: string;
  accessUntil: Date | null;
}) {
  const until = opts.accessUntil
    ? opts.accessUntil.toUTCString()
    : "the end of the current billing period";
  return {
    subject: `Your ${SITE_NAME} ${opts.planName} subscription was canceled`,
    html: layout({
      title: "Subscription canceled",
      preheader: "Your subscription was canceled.",
      bodyHtml: `
        <h1 style="margin:0 0 16px 0;font-size:22px;">Subscription canceled</h1>
        <p style="margin:0 0 12px 0;">Your ${escapeHtml(opts.planName)} subscription was canceled. You'll keep access until <strong>${escapeHtml(until)}</strong>, then your account will move back to Free.</p>
        <p style="margin:0;">Sorry to see you go. If there's something we can fix, just reply to this email.</p>
      `,
      cta: { label: "Resubscribe", url: `${SITE_URL}/pricing` },
    }),
  };
}

export function accountDeletionInitiatedEmail(opts: {
  name: string;
  scheduledFor: Date;
  cancelToken: string;
}) {
  const when = opts.scheduledFor.toUTCString();
  const cancelUrl = `${SITE_URL}/account/cancel-delete?token=${encodeURIComponent(opts.cancelToken)}`;
  return {
    subject: `Your ${SITE_NAME} account deletion is scheduled`,
    html: layout({
      title: "Account deletion scheduled",
      preheader: `Your account will be permanently deleted on ${when}.`,
      bodyHtml: `
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#991b1b;">Account deletion scheduled</h1>
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.name)},</p>
        <p style="margin:0 0 12px 0;">You requested to delete your ${SITE_NAME} account. We've scheduled it for permanent deletion on <strong>${escapeHtml(when)}</strong>.</p>
        <p style="margin:0 0 12px 0;"><strong>What will be deleted:</strong></p>
        <ul style="margin:0 0 16px 20px;padding:0;">
          <li>Your profile, posts, comments, likes, and bookmarks</li>
          <li>All images you uploaded</li>
          <li>Any active subscription (will be canceled)</li>
        </ul>
        <p style="margin:0;">If you didn't request this or change your mind, you can cancel any time before the deletion runs.</p>
      `,
      cta: { label: "Cancel deletion", url: cancelUrl },
    }),
  };
}

export function accountDeletionCanceledEmail(opts: { name: string }) {
  return {
    subject: `Your ${SITE_NAME} account deletion was canceled`,
    html: layout({
      title: "Deletion canceled",
      preheader: "Your account will not be deleted.",
      bodyHtml: `
        <h1 style="margin:0 0 16px 0;font-size:22px;">Deletion canceled ✅</h1>
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.name)},</p>
        <p style="margin:0;">We've canceled the scheduled deletion of your account. Your data is safe.</p>
      `,
      cta: { label: "Open dashboard", url: `${SITE_URL}/feed` },
    }),
  };
}

export function accountDeletionCompletedEmail(opts: { name: string }) {
  return {
    subject: `Your ${SITE_NAME} account has been deleted`,
    html: layout({
      title: "Account deleted",
      preheader: "Your account and all data have been permanently removed.",
      bodyHtml: `
        <h1 style="margin:0 0 16px 0;font-size:22px;">Account deleted</h1>
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.name)},</p>
        <p style="margin:0 0 12px 0;">As you requested, your account and all associated data have been permanently deleted from ${SITE_NAME}.</p>
        <p style="margin:0;">Thanks for being part of the community. You're welcome back any time.</p>
      `,
    }),
  };
}
