🔴 P0 — Must fix BEFORE inviting real users (data integrity + security)
1. Mongo connection is broken in serverless
src/lib/mongodb.ts uses a module-level isConnected boolean that:

Doesn't return early on reuse (just logs then continues to reconnect)
Doesn't cache the promise (concurrent requests open multiple connections)
Will exhaust your Mongo connection pool on Vercel within hours
Fix: Use the cached-promise pattern with global._mongoose = { conn, promise }. This is the standard Next.js + Mongo pattern. You'll find it in every Next.js production template.

2. Rate limit is in-memory → useless on Vercel
src/lib/rateLimit.ts:27 — the author left a comment admitting this. Each Vercel lambda instance has its own buckets map. Attacker spawns 10 cold lambdas → gets 10× your limit. AI generation is your most expensive operation; this is a real cost risk.

Fix: Upstash Redis (free tier, perfect fit) + @upstash/ratelimit. 30 minutes of work, saves you from a $500 Gemini bill.

3. View count has no rate limit / no dedup
src/app/api/post/[username]/[slug]/view/route.ts — anyone (unauthenticated!) can spam this endpoint. Authors can inflate their own metrics. Bots will trivially break your trending algorithm.

Fix: Dedup by IP+slug+24h, ignore the author's own views, hash the IP for privacy. Or use a proper analytics pipeline (PostHog/Plausible) for view counts and let the DB number be a rough cache.

4. Like endpoint has a race condition
src/app/api/post/[username]/[slug]/like/route.ts:37-55 — read-then-write. Two rapid clicks can both see alreadyLiked = false and both push the like (idempotent via $addToSet) but the response shows a wrong count.

Fix: Use a single atomic operation: findOneAndUpdate with a pipeline [{ $set: { likes: { $cond: [...$in...] }}}], or just always run $addToSet and toggle via a separate path.

5. Self-fetching API antipattern
src/app/(app)/[username]/[slug]/page.tsx:16,95,105 fetches its own /api/... URL via process.env.NEXTAUTH_URL
src/app/post/page.tsx:80 does the same
This adds 200-400ms of latency per request, breaks during local SSR if NEXTAUTH_URL is set wrong, and double-counts cold starts. Call the DB function directly from server components, not your own HTTP route.

6. No env var validation
A bad/missing env var crashes randomly at request time instead of at build/boot. Use Zod to validate all envs in one place. Also: GOOGLE_GENETATIVE_AI is misspelled — fix while you're there.

7. No structured logging / error tracking
Right now you have console.log and console.error. On Vercel that goes to log retention you can't usefully search. When a paying user hits a 500, you'll have no idea.

Add Sentry (or BetterStack). 10-minute setup, free tier covers you for months.

8. AI generation has no content moderation
A user can prompt Gemini to write hateful/illegal content, save it, publish it under your domain at thebloggpt.com/{username}/whatever. You are liable for hosted content. Gemini has some refusals but they can be jailbroken; you also store raw user-edited content which bypasses Gemini entirely.

Fix: Run published content through Gemini's safety API (or OpenAI moderation, free) and queue for review if flagged. Add a "Report this post" button. Add a clear ToS clause (you already have one — verify it covers user-generated content).

🟠 P1 — Must add BEFORE charging money (revenue blockers)
9. Payments don't exist
src/config/plans.ts:33,51,69 — razorpayPlanId: "". Pricing page shows "Coming soon" disabled buttons. You can't earn from pricing until this ships.

Minimum viable:

Razorpay subscriptions (or Stripe — Stripe is better DX, Razorpay is better for India)
Webhook handler at /api/webhooks/razorpay with signature verification
Plan upgrade/downgrade/cancellation flow
Failed payment → planStatus: "past_due" → grace period → downgrade to free
Invoice emails
Customer portal (Stripe gives this free)
10. No email infrastructure
No welcome email, no "you hit your limit" notification, no usage warnings, no receipt emails. You can't legally bill people without email receipts.

Fix: Resend (best DX) + React Email. Set up:

Welcome on signup
"You used 80% of your AI quota this month"
"Your subscription renews in 3 days"
"Payment failed"
Transactional invoices
11. No admin tools
You have a role: "admin" field on User but no admin UI. When a user reports abuse / when payment fails / when you need to refund — you'll do it via mongo shell. That doesn't scale past 20 users.

Build minimal admin at /admin (gated by role):

User list + ban/unban
Reported posts queue + delete
Manual plan adjustment
Manual credit grants
12. No GDPR/data-deletion flow
"Delete my account" button doesn't exist. Required for: GDPR, India's DPDP Act, AdSense approval, App Store/Play Store if you ever wrap it.

🟡 P2 — Scale issues (will bite at 1k+ users)
13. Embedded arrays will break at scale
On src/models/Post.ts:46 likes is an array of ObjectIds. On src/models/User.ts:93-104 bookmarks, likes, followers, following are all arrays on the user doc.

Mongo doc cap is 16MB. A single popular post with 50k likes → ~1.2MB of one doc → slow reads on every page load. A user who follows 5k people → cascading bloat. Add a separate Like, Follow, Bookmark collection with { userId, targetId, createdAt } and an index. This refactor is painful later; do it before you have data.

14. Search is regex on Mongo
src/app/api/post/route.ts:46-53 — RegExp query on title/excerpt/tags. Works for 100 posts. At 10k posts every search will take seconds and burn CPU.

Fix: Mongo Atlas Search (free tier) gives you actual full-text indexing with one config change. Or Meilisearch/Algolia.

15. No caching headers on API
No Cache-Control, no ETag. Every blog list hits Mongo. Slap s-maxage=60, stale-while-revalidate=300 on read-only endpoints.

16. No CDN strategy for images
Cloudinary handles transforms but you're not using f_auto,q_auto or responsive variants. <Image> component should be doing the heavy lifting. Verify all <img> are <Image> from next/image.

17. Trending algo isn't a real algo
You probably sort by likesCount or similar. Build a proper decay: score = (likes + 2*comments + 0.1*views) * exp(-age_in_days / 7). Run it periodically and cache results in Redis. Otherwise old viral posts dominate forever.

18. No background jobs / queues
Image generation is sync — user waits 10-20s
Email sends are sync
Sitemap regen, trending recompute, all sync
Fix: Upstash QStash or Inngest. Both have generous free tiers and slot into Vercel cleanly.

19. Comments are unmoderated
src/models/Comment.ts — no sanitization shown, no spam check, no profanity filter. First spammer will dump 1000 comments. Add: same sanitizeHtml pass + rate limit + Akismet (free for low volume) or your own classifier.

20. Database has no backups configured (verify)
If you're on Atlas free tier, you get nothing. Move to M10+ before you have paying customers, or set up mongodump to S3 on a cron.

🟢 P3 — Polish & growth features
21. Missing user-facing features
Drafts autosave (Tiptap supports it — wire it up)
Bookmarks UI — you have the data model, no UI
Follow UI — same
Notifications — when someone likes/comments/follows you
Reading progress bar + TOC on long posts (huge engagement boost)
Estimated read time on cards ✓ you have this
Social share buttons ✓ react-share is installed
Comments on posts — model exists, is UI wired?
Author dashboard — views, likes, top posts, traffic sources
22. Onboarding is too thin
Right now: Google login → drop into feed. No tour, no "write your first post" prompt, no profile completion nudge. Add a one-time "Let's set up your profile" flow: pick username (suggest from name), add bio, follow 3 suggested authors. Day-1 retention will double.

23. No referral / virality loop
Every published post should have an attractive author footer card
"Powered by Blog-GPT" badge on free plan (you mention this exists in pricing copy — verify it's actually rendered)
"Invite 3 friends, get 20 extra AI credits" — single highest-ROI growth lever for solo SaaS
24. No A/B testing
Pricing experiments, onboarding flow tests, CTA copy — all need this. PostHog (free) or GrowthBook.

25. No CI/CD / tests
No .github/workflows, no test files. You're one bad commit from breaking prod. Minimum:

GitHub Actions: npm run build + npm run lint + tsc --noEmit on PR
A handful of Vitest tests on the API routes (auth, rate limit, slugify, sanitization)
Playwright smoke test: signup → create post → publish → view
26. Accessibility audit
Run Lighthouse on the homepage. AI editor likely has focus management issues. Fix at least: keyboard nav, ARIA on toggles, contrast on dark mode.

27. Performance
Run Lighthouse — aim for 90+ on every public page
Defer non-critical scripts (Vercel Analytics is fine, but CookiesBox + Toast both client-rendered)
next/font is in use ✓
Bundle analyzer — your @tiptap/* is heavy; lazy-load the editor on /post/create route, don't bundle into root layout
28. Legal hardening
Privacy policy needs to mention Cloudinary, Google Auth, Gemini, Vercel Analytics, Razorpay (when added)
ToS needs UGC indemnification + DMCA process
Add a real /dmca page
Cookies banner needs proper consent grouping (you have a CookiesBox — verify it actually blocks scripts pre-consent)
29. Observability checklist
Sentry (errors)
PostHog or Plausible (product analytics)
Vercel Analytics (you have ✓)
BetterStack (uptime + status page)
Slack webhook for critical errors
⚡ The 2-week sprint to "real SaaS"
If I were you, here's what I'd do in order (estimated effort):

Week 1 — Foundation

Fix Mongo connection + env validation (2h)
Move rate limit to Upstash Redis (3h)
Fix the URL/canonical/sitemap bug from previous response (2h)
Add Sentry (1h)
Fix view spam + like race condition (2h)
Drop self-fetching from SSR pages (3h)
Add Resend + welcome/usage emails (4h)
Week 2 — Money + Trust

Razorpay integration end-to-end (1 day)
Pricing page → working subscriptions
Admin panel MVP (1 day)
Account deletion + GDPR (½ day)
Content moderation pipeline (½ day)
CI: lint + build + 5 smoke tests (½ day)
After this, you can charge money, sleep at night, and start the growth/SEO work I described last turn.