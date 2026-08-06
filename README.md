# AI Wedding Invitation Studio

A SaaS for generating premium, animated digital wedding invitation websites:
an AI wizard turns a couple's details into a full multi-section invite
(envelope reveal, invitation letter, countdown, timeline, gallery, venue,
RSVP, thank-you) rendered through a shared theme/animation engine, with a
dashboard for guest management, analytics, billing, and deployment.

The original single-couple invite this repo started from (Vite + React, no
backend) still lives at [`legacy-invite/`](legacy-invite/), unmodified and
independently runnable.

## What's real vs. what needs your keys

Every code path below is genuine — real Prisma queries, real Stripe/Auth.js/
Cloudinary SDK calls, no mocked data — but several integrations are gated on
credentials only you can provide. Nothing fakes success when a key is
missing; each feature says plainly in the UI when it isn't configured yet.

| Area | Status |
|---|---|
| Auth (Credentials, Google OAuth, Resend magic link) | **Works today.** Google/Resend providers only register if their env vars are set. |
| Database (Postgres via Prisma) | **Works today.** Full schema, verified against a real local Postgres instance — see below. |
| Dashboard (all 14 nav sections) | **Works today.** Every page is a real DB-backed page, not a mock. |
| AI copywriting wizard | **Works today**, with a caveat: without `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` it falls back to a deterministic template generator — the UI labels which one produced the copy. |
| Theme engine (11 themes) | **Works today.** Colors/fonts/decoration flow through CSS custom properties — verified end-to-end from wizard → DB → public page. |
| Public invitation page + RSVP | **Works today.** Verified: create → publish → view → submit RSVP → row lands in Postgres. |
| Media uploads | Needs `CLOUDINARY_*` env vars. |
| Billing (Stripe Checkout + portal + webhook) | Needs `STRIPE_*` env vars. Webhook handler is real (subscription upsert on `checkout.session.completed`, status sync on `customer.subscription.updated/deleted`). |
| Custom domains | Needs `VERCEL_API_TOKEN` + `VERCEL_PROJECT_ID` (calls the real Vercel Domains API). |
| Analytics | Views, shares, RSVP submits, device type, and map-link clicks are real, recorded server-side. Country geolocation and click-heatmaps are **not built** — they need a geo-IP service and a client-side event pipeline beyond this pass. |
| Section builder (`/dashboard/builder`) | **Works today.** Drag-reorder (`@dnd-kit`), hide, lock, duplicate, delete, undo/redo (Zustand), live device preview, save to `Invitation.sectionConfig` — verified end-to-end against a real Postgres, including the locked-section guard. |
| Admin CRUD (`/admin/themes`, `/admin/music`, `/admin/users`) | **Works today.** Create/edit/delete themes (colors, fonts, default section order) and music tracks, promote/demote user roles — no longer seed-script-only. |

**Not attempted in this pass**: real-time collaborative editing, and a
visual regression / e2e (Playwright) test layer on top of the Vitest suite.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · Radix primitives (hand-built as Shadcn-style components —
`ui.shadcn.com`'s CLI registry was unreachable from the build sandbox, so
`src/components/ui/*` is written directly against `@radix-ui/*` + `cva`,
matching the same API) · Zustand (available; not yet needed by any screen) ·
React Hook Form + Zod · Prisma 7 + PostgreSQL · Auth.js v5 · Cloudinary ·
Resend · Stripe · Docker.

## Getting started

```bash
cp .env.example .env
# Fill in at least DATABASE_URL and AUTH_SECRET (openssl rand -base64 32).
# Everything else is optional — each feature degrades gracefully without it.

docker compose up -d db      # local Postgres, or point DATABASE_URL at your own
npm install
npm run db:push              # applies prisma/schema.prisma
npm run db:seed              # seeds the 11 themes, default templates, music catalog
npm run dev
```

Open http://localhost:3000, sign up, and run the wizard at
`/dashboard/invitations/new`.

### Local Postgres without Docker

If Docker's not available in your environment, any Postgres 14+ works —
just point `DATABASE_URL` at it before `db:push`/`db:seed`. Example on a
Debian/Ubuntu host with `postgresql` installed:

```bash
sudo service postgresql start
sudo -u postgres psql -c "CREATE ROLE studio WITH LOGIN PASSWORD 'studio' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE wedding_studio OWNER studio;"
```

### Making an account an admin

`/admin` requires `role = ADMIN` on the `users` row — there's no UI for
this yet (bootstrapping problem: the first admin has to be granted by hand):

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## Project structure

```
prisma/schema.prisma         Full data model — auth, billing, invitations,
                              events, guests, RSVPs, media, analytics, themes
prisma/seed.ts                11 themes + default templates + music catalog
src/app/(auth)/               Sign in / sign up
src/app/dashboard/            The studio: wizard, templates, media, AI
                               generator, music, guests, RSVP, analytics,
                               theme editor, deploy, settings, billing
src/app/admin/                Platform-wide overview (admin-only)
src/app/invite/[slug]/        The public invitation page + dynamic OG image
src/app/api/                  AI generation, Stripe, Cloudinary upload,
                               RSVP export, analytics tracking, custom domains
src/components/ui/            Hand-built Shadcn-style primitives (Radix + cva)
src/components/animation/     Reusable Framer Motion primitives: fade/slide/
                               zoom/parallax/blur-reveal/shimmer/confetti/
                               petals/sparkles/scroll-progress
src/components/invite/        The theme rendering engine — envelope, hero,
                               countdown, timeline, gallery, venue, RSVP,
                               thank-you, all driven by CSS custom properties
                               (--inv-primary, --inv-accent, …) so any theme
                               reskins every section without new components
src/lib/                      auth.ts, db.ts, ai/, email/, media/, stripe.ts,
                               vercel.ts, actions/ (server actions), validations/
```

## Module status

Built and verified in this pass, in the order the original spec asked for:

1. **Project setup** — Next.js 15 + TS + Tailwind v4, enterprise folder
   structure, Docker + docker-compose, Prettier, `.env.example`.
2. **Auth** — Auth.js v5, Credentials + Google + Resend magic link, edge/
   Node config split (middleware can't load `pg`/Prisma directly — this
   tripped the build once and is fixed via `auth.config.ts`).
3. **Database** — full Prisma schema, verified against a real local
   Postgres (`db push` + seed both ran clean).
4. **Dashboard** — all 14 sidebar sections, each a real page.
5. **Template + Animation engine** — CSS-custom-property theme bridge,
   11 seeded themes, reusable motion primitives.
6. **AI Generator** — wizard + standalone tool, Anthropic/OpenAI/template
   fallback chain.
7. **Media system** — Cloudinary upload with auto WebP/AVIF + resize.
8. **RSVP** — public form, guest management, CSV export, email
   notification to the couple.
9. **Theme system** — one-click theme swap + per-invitation color override.
10. **Music** — library + autoplay-after-interaction + mute toggle.
11. **SEO** — dynamic OG image (`next/og`), sitemap, robots, per-invitation
    metadata.
12. **Deployment** — publish flow, QR code, share links, Vercel custom
    domain API integration.
13. **Admin panel** — platform stats, user list, plus full theme/music/user
    CRUD at `/admin/themes`, `/admin/music`, `/admin/users`.
14. **Billing** — Stripe Checkout, billing portal, webhook-driven
    subscription sync.
15. **Testing** — Vitest: schema validation, the AI provider fallback
    chain (mocked fetch), theme CSS-var mapping, component tests, a
    countdown-hook test with fake timers, the builder store's undo/redo/
    lock logic, a `db.ts` resilience test (see the security note on the
    build-time fix below), and integration tests that run the real server
    actions (`createInvitationAction`, `publishInvitationAction`,
    `submitRsvpAction`, `deleteInvitationAction`) against a real Postgres
    and assert on the resulting rows — including slug-collision handling
    and the cross-user delete-authorization check.
16. **Section builder** — `/dashboard/builder`: drag-reorder (`@dnd-kit`),
    hide/lock/duplicate/delete, undo/redo (Zustand), live device preview
    reusing the same `InviteExperience` the public page renders, saved to
    `Invitation.sectionConfig`. Verified in-browser end to end, including
    that a locked section's hide/delete/drag are actually disabled and
    that the saved layout round-trips through Postgres correctly.

## Testing

```bash
npm test          # runs once
npm run test:watch
```

The integration suite (`src/lib/actions/*.integration.test.ts`) needs a
reachable `DATABASE_URL` — same one your dev server uses — since it writes
real rows and asserts on them, then cleans up in `afterAll`. Everything
else runs in isolation with mocked fetch/auth/env.

## Security notes

- `npm audit` reports 3 known advisories in Next 15.5.x's bundled `postcss`/
  `sharp` (fixed upstream in Next 16, which wasn't used here to match the
  requested "Next.js 15"). Worth revisiting before shipping.
- Stripe webhook signature verification is implemented — don't skip setting
  `STRIPE_WEBHOOK_SECRET` in production.
- RSVP submission is intentionally open (no auth) since guests don't have
  accounts — it's rate-limited by nothing right now; add rate limiting
  before exposing a high-traffic invitation publicly.
- `src/lib/db.ts` used to construct the Prisma client eagerly at module
  scope, which crashed the *entire* build the moment `DATABASE_URL` was
  missing — Next's build-time route introspection imports every route
  module, including ones that never touch the database. `db` is now a
  Proxy that defers construction to the first real query and rejects
  (rather than throws synchronously) when unconfigured, so both
  try/catch and `.catch()` chains work as callers expect. Covered by
  `src/lib/db.test.ts`.

## Deploying to Vercel

1. Provision Postgres (this project only supports Postgres — Prisma 7 has
   no MongoDB connector, and there's no upgrade path from Mongo to bring
   one in). Vercel Postgres, Neon, and Supabase all work and give you a
   connection string in about a minute.
2. Set `DATABASE_URL` (and `AUTH_SECRET` — `openssl rand -base64 32`) in
   your Vercel project's environment variables. Everything else in
   `.env.example` is optional; features degrade gracefully without it.
3. From your machine, point `DATABASE_URL` at that same database and run
   `npm run db:push && npm run db:seed` once, so the dashboard has themes
   and music to show.
4. Deploy. The build no longer requires a database connection to succeed
   (see the `db.ts` note above), but the app won't be useful until step 3
   is done against the database it's actually running against.
