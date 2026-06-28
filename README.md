# 🧠 TheBlogGPT

An open-source, full-stack blogging platform with AI-assisted writing. Users sign in, draft posts in a rich text editor, optionally generate a draft or cover image with AI, and publish to a public profile with likes, bookmarks, comments, and following.

🔗 **Live:** [thebloggpt.com](https://thebloggpt.com)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **Write & publish** — create, edit, and delete posts in a [Tiptap](https://tiptap.dev) rich text editor (headings, code blocks, tables, images).
- **AI assistance** — generate a draft from a prompt, or generate a cover image, powered by Google Gemini.
- **Social layer** — public profiles, follow/unfollow, likes, bookmarks, and threaded comments.
- **Discovery** — explore feed, trending and related posts, tag pages, and search.
- **Accounts** — Google sign-in, profile settings, plan/usage billing page, and self-service account deletion with a grace period.
- **SEO** — per-post metadata, Open Graph/Twitter cards, JSON-LD, canonical URLs, sitemap, and permanent redirects for legacy URLs.
- **Privacy** — GDPR/ePrivacy cookie consent (opt-in analytics) and legal pages.

## 🔒 Production-grade by design

This isn't a toy demo — the codebase includes the hardening a public, paid product needs:

- **Layered auth** — an optimistic proxy gate (`src/proxy.ts`) plus per-route server-side session + ownership checks; banned/deleting accounts are re-validated within minutes, not at JWT expiry.
- **Abuse controls** — a durable, MongoDB-backed rate limiter on every write/cost endpoint (works across serverless instances, unlike in-memory limiters).
- **AI cost safety** — atomic reserve-then-refund quota accounting so concurrent requests can't exceed a plan's allowance; per-minute/day caps and prompt-size limits.
- **Content moderation** — Gemini text moderation on posts and Gemini-vision moderation on uploaded images.
- **Secrets hygiene** — field-whitelisted profile updates (no mass-assignment), secrets stripped from API responses, escaped JSON-LD, and security headers.
- **Data integrity** — denormalized counters kept atomic, unique compound indexes on relations, and a complete account-deletion cascade.

## 🛠️ Tech stack

| Area | Tech |
|------|------|
| Framework | Next.js 16 (App Router, React 19, React Compiler) |
| Styling | Tailwind CSS v4, Tailwind Typography |
| State / data | Redux Toolkit, TanStack Query |
| Editor | Tiptap |
| Database | MongoDB + Mongoose |
| Auth | NextAuth v4 (Google OAuth, JWT sessions) |
| AI | Google Gemini (`@google/genai`) — text + image |
| Images | Cloudinary |
| Email | Resend (transactional) |
| Payments | Razorpay (subscriptions) |
| Analytics | Google Analytics + Vercel Analytics (consent-gated) |
| Hosting | Vercel (with Cron) |

## 🚀 Getting started

**Prerequisites:** Node.js 20+, a MongoDB database (e.g. MongoDB Atlas), and a Google OAuth client. AI, image, email, and payment features each need their own provider key (see below).

```bash
# 1. Clone
git clone https://github.com/A-S-Vignesh/blog-gpt.git
cd blog-gpt

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local   # then fill in the values below

# 4. Run
npm run dev                  # http://localhost:3000
```

## 🔑 Environment variables

Create `.env.local` (and set the same in your host's dashboard for production).

### Required — core app
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Full site URL (e.g. `https://thebloggpt.com`; `http://localhost:3000` in dev) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_GENETATIVE_AI` | Google Gemini API key (powers AI text + image + moderation) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Required for email (Resend)
| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key — without it, emails are silently skipped |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `TheBlogGPT <no-reply@yourdomain.com>` |
| `RESEND_REPLY_TO` | _(optional)_ reply-to address |

### Required for scheduled jobs (Vercel Cron)
| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Bearer token protecting the cron routes (deletion + plan downgrade) |

### Optional
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID (set your own when forking) |
| `USE_ATLAS_SEARCH` | `true` to use MongoDB Atlas Search for search |
| `ATLAS_SEARCH_INDEX` | Atlas Search index name |

### Payments (Razorpay) — only when enabling paid plans
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
`RAZORPAY_PLAN_PRO_MONTHLY`, `RAZORPAY_PLAN_PRO_YEARLY`,
`RAZORPAY_PLAN_BUSINESS_MONTHLY`, `RAZORPAY_PLAN_BUSINESS_YEARLY`

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run migrate` | One-off: migrate legacy user plan fields |
| `npm run migrate:username-index` | One-off: create the case-insensitive username index |

## ⏰ Scheduled jobs

Two Vercel Crons are defined in [`vercel.json`](vercel.json) (both protected by `CRON_SECRET`):

- `/api/cron/process-deletions` — permanently deletes accounts whose grace period has elapsed.
- `/api/cron/downgrade-plans` — downgrades canceled subscriptions to free once their paid period ends.

## 📧 Transactional email

Email (via Resend, in `src/lib/email/`) fires on: **welcome** (first sign-in), the **account-deletion** lifecycle (initiated / canceled / completed), and the **subscription** lifecycle (activated / canceled / payment failed — only once Razorpay is live).

## 🗂️ Project structure

```
src/
├── app/                # App Router: pages, layouts, and API routes
│   ├── api/            # Route handlers (posts, users, AI, payments, cron…)
│   └── (app)/          # Authenticated app shell (feed, profile, billing…)
├── components/         # UI components
├── lib/                # Data access, AI, email, payments, auth, rate limiting
├── models/             # Mongoose models
├── config/             # Plans, system instructions
└── utils/              # Helpers (tags, usernames, reserved words…)
```

## ☁️ Deployment

Designed for **Vercel**. Set every environment variable in the project settings, ensure your MongoDB allows connections from Vercel, add your production domain to the Google OAuth authorized redirect URIs, and verify your sender domain in Resend. See [`LAUNCH.md`](LAUNCH.md) for the full go-live checklist.

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss substantial changes first. Before submitting a PR, run `npm run typecheck` and `npm run lint` — both should pass clean.

## 📄 License

MIT — free to use, modify, and share. See `LICENSE`.

## 🙋 Author

Built by **Vignesh A S** · GitHub [@A-S-Vignesh](https://github.com/A-S-Vignesh)

If this project is useful to you, please consider giving it a ⭐.
