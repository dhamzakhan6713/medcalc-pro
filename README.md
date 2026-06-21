# MedCalc Pro

A clinical calculator suite with 20 calculators, Supabase auth, Stripe Pro subscriptions, AI explanations (Anthropic API), and PDF export.

## What's included

- **20 calculators** across renal, cardiology, respiratory, neurology, hepatology, metabolic, obstetric, paediatric, and critical care — see `lib/calculators/registry-part1.ts` and `registry-part2.ts`
- **Free vs Pro gating** — most calculators are free; SOFA score is Pro-only as an example of how to add more
- **Auth** — email/password + Google OAuth via Supabase
- **Stripe subscriptions** — Checkout + webhook that automatically updates plan status
- **AI explanations** — calls Claude via the Anthropic API, 3 free uses then Pro-gated
- **PDF export** — Pro feature, branded report with signature line
- **SEO** — every calculator is a static, crawlable page with metadata + JSON-LD

## Setup (in order)

### 1. Supabase
1. Create a project at supabase.com
2. Go to SQL Editor → paste the entire contents of `supabase/schema.sql` → Run
3. Go to Authentication → Providers → enable Google (optional but recommended)
4. Go to Project Settings → API → copy your URL, anon key, and service role key into `.env.local`

### 2. Stripe
1. Create a Stripe account, switch to test mode while developing
2. Create a Product called "Pro" with two prices: monthly ($9) and annual ($79) — copy both price IDs
3. Go to Developers → Webhooks → Add endpoint → URL: `https://yourdomain.com/api/webhook` → select events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook signing secret into `.env.local`
5. For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`

### 3. Anthropic
1. Get an API key from console.anthropic.com
2. Add it to `.env.local` as `ANTHROPIC_API_KEY`

### 4. Environment variables
Copy `.env.example` to `.env.local` and fill in every value from steps 1-3.

### 5. Install and run
```bash
npm install
npm run dev
```
Visit http://localhost:3000

### 6. Deploy
1. Push this repo to GitHub
2. Import it into Vercel
3. Add all the same environment variables in Vercel's project settings (use your production Stripe keys and webhook secret here, not test mode)
4. Update `NEXT_PUBLIC_SITE_URL` to your real domain
5. Update your Stripe webhook endpoint URL to point at your production domain

## Before you launch — verify the clinical content

Every calculator's formula is implemented from its cited reference in `reference:` field. As a clinician, your most valuable 2 hours on this project are:
1. Open every calculator in `registry-part1.ts` and `registry-part2.ts`
2. Run a known test case through each one (a textbook example with a known answer)
3. Confirm the result and interpretation match what you'd expect clinically

This is the one step that makes this product trustworthy — and it's the one step only a real doctor can actually do.

## Adding a new calculator

Add an entry to the `Calculator[]` array in either registry file, following the existing shape. It will automatically appear on the homepage, get its own SEO page, and be searchable — no other code changes needed.

## Adding more Pro calculators

Set `tier: 'pro'` on any calculator object. The UI automatically shows a paywall to free users and unlocks it for Pro/Team users.
