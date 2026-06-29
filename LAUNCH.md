# 🚀 Launch checklist

Work top to bottom. Everything above "Smoke test" must be true before you point real users at the site.

## 1. Environment variables (production)

Set in your host (Vercel → Project → Settings → Environment Variables), `Production` scope.

**Core (required):**
- [ ] `MONGODB_URI`
- [ ] `NEXTAUTH_SECRET` (random; `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` = `https://thebloggpt.com`
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_GENETATIVE_AI` (Gemini key)
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Email (required):**
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL` = a verified sender on your domain

**Cron (required):**
- [ ] `CRON_SECRET` (random; the same value Vercel Cron will send as a Bearer token)

**Optional:**
- [ ] `NEXT_PUBLIC_GA_ID` (your own GA property)
- [ ] `USE_ATLAS_SEARCH` / `ATLAS_SEARCH_INDEX` (if using Atlas Search)

> ⏸️ **Razorpay is deferred** — paid plans, the billing checkout, and subscription emails stay dormant until you set the Razorpay vars (see §6). The free tier and everything else work without them.

## 2. Third-party setup

- [ ] **Google OAuth** — add `https://thebloggpt.com/api/auth/callback/google` to the authorized redirect URIs (and the production domain to authorized JavaScript origins).
- [ ] **MongoDB** — allow connections from your host (Atlas: add `0.0.0.0/0` or Vercel's egress), and confirm the user has read/write.
- [ ] **Resend** — sender domain verified with SPF/DKIM/DMARC. _(Done.)_
- [ ] **Cloudinary** — `blog-gpt/posts` upload folder is reachable with the API key.

## 3. Database one-time migrations

Run once against the production database:

```bash
npm run migrate:username-index   # case-insensitive unique username index
npm run migrate                  # legacy plan-field migration (safe if already applied)
```

## 4. Cron jobs

- [ ] `vercel.json` registers both crons (`process-deletions`, `downgrade-plans`).
- [ ] `CRON_SECRET` is set so the routes accept Vercel's scheduled requests (they return 503 without it).

## 5. Smoke test (on a Vercel Preview with production-like env)

Walk through each once — these are the paths a real user hits first:

- [ ] **Sign in** with Google → first sign-in creates the account and sends a welcome email.
- [ ] **Generate** a draft from a prompt → content returns; a credit is consumed (and refunded if it errors).
- [ ] **Publish** a post with an uploaded cover image → appears on your public profile; image passes moderation.
- [ ] **Engage** — like, bookmark, comment on a post; counts update and persist on refresh.
- [ ] **Account settings** — edit profile; saving without re-entering the Gemini key does **not** wipe it.
- [ ] **Delete account** → confirm the deletion email; cancel it and confirm the cancellation email.
- [ ] **Cookie banner** — reject analytics → confirm GA does not load; accept → confirm it does.
- [ ] **404 / private routes** — visiting `/settings` while logged out redirects to sign-in.

## 6. After deploy

- [ ] Submit `https://thebloggpt.com/sitemap.xml` in Google Search Console.
- [ ] Spot-check an old `/post/{slug}` URL → 308 redirects to `/{username}/{slug}`.
- [ ] Confirm `robots.txt` disallows `/api/`, `/settings`, `/billing`, etc.

## 7. Recommended next (not blocking launch)

- [ ] **Error monitoring** — add Sentry (server + edge + client) so production errors aren't write-only `console.*`.
- [ ] **Payments (when ready)** — set the Razorpay vars (§1), create the plans, point the webhook at `/api/payments/webhook` in **live** mode, then re-run the smoke test for subscribe → cancel → downgrade.
- [ ] **Admin moderation** — a small queue to review posts flagged `pending`.
- [ ] **Payment reconciliation** — a fallback that polls Razorpay in case a webhook is missed.

---

_Status: code-side launch blockers (security, legal, content safety, account lifecycle) are resolved. The items above are deployment configuration and optional hardening._
