# AI Wedding Invitation Studio

A SaaS for generating premium, animated digital wedding invitation websites:
an AI wizard turns a couple's details into a full multi-section invite
(envelope reveal, invitation letter, countdown, timeline, gallery, venue,
RSVP, thank-you) rendered through a shared theme/animation engine, with a
dashboard for guest management, analytics, billing, and deployment.

The original single-couple invite this repo started from (Vite + React, no
backend) still lives at [`legacy-invite/`](legacy-invite/), unmodified and
independently runnable.

## Database: MongoDB (not Postgres)

This project runs on **Prisma 6 + MongoDB**, not Prisma 7/Postgres. That's a
deliberate downgrade, not an oversight: Prisma 7 has no MongoDB connector at
all, and there is no upgrade path from Mongo into it. Prisma 6.x is the last
— and still fully supported and maintained — classic-ORM line with MongoDB
support. (The eventual successor, Prisma Next, has MongoDB in Early Access,
but Early Access isn't something to put under a production deploy that's
already under time pressure.)

Practical consequences of being on MongoDB specifically:

- Every model's `id` is a MongoDB `ObjectId` (`@default(auto()) @map("_id")
  @db.ObjectId`), and every foreign-key-shaped field (`userId`,
  `invitationId`, etc.) is typed `@db.ObjectId` too. You cannot hand-write a
  human-readable string into an `id` field — Mongo will reject it as a
  malformed ObjectId. (`MusicTrack.title` is `@unique` specifically so the
  seed script has something sane to upsert against instead of `id`.)
- No `prisma migrate` — MongoDB is schema-less from Prisma's point of view.
  The only sync command is `prisma db push` (`npm run db:push`).
  `db:migrate`/`db:deploy` scripts were removed because they simply don't
  work against this provider.
- Transactions require a **replica set**, even a single-node one for local
  dev — a standalone `mongod` will fail on anything Prisma tries to wrap in
  a transaction. `docker-compose.yml` starts one automatically. Atlas
  clusters (including the free tier) are replica sets by default.
- This project doesn't use `@prisma/adapter-*` driver adapters — those are
  the Prisma 7 SQL pattern. MongoDB stays on the classic `prisma-client-js`
  generator with `url = env("DATABASE_URL")` directly in the schema.

**Honesty note on verification**: the build sandbox this was migrated in
has no outbound access to `fastdl.mongodb.org` (confirmed via the egress
proxy's own status endpoint — a policy block, not a transient failure), so
a local MongoDB binary couldn't be downloaded to test against, and the
migration was not run against a real Atlas cluster either (using
credentials that had been pasted into chat for testing would be worse than
not testing at all). What *is* verified: the schema passes `prisma
validate`, the client generates cleanly, `tsc --noEmit` and `eslint` are
clean, the full `next build` succeeds both with and without `DATABASE_URL`
set, and all 63 non-database-dependent Vitest tests pass. The 6 Postgres-era
integration tests that write real rows and assert on them
(`src/lib/actions/invitation.integration.test.ts`) could not be re-verified
against live MongoDB here — run `npm test` yourself against a real
`DATABASE_URL` before trusting that suite fully. If something in the
ObjectId/ordering details is off, that's the first place to look.

## What's real vs. what needs your keys

Every code path below is genuine — real Prisma queries, real Stripe/Auth.js/
Cloudinary SDK calls, no mocked data — but several integrations are gated on
credentials only you can provide. Nothing fakes success when a key is
missing; each feature says plainly in the UI when it isn't configured yet.

| Area | Status |
|---|---|
| Auth (Credentials, Google OAuth, Resend magic link) | **Works today.** Google/Resend providers only register if their env vars are set. |
| Database (MongoDB via Prisma 6) | Schema valid, client generates, build succeeds — **not re-verified against a live MongoDB** in this environment (see note above). Was fully verified end-to-end against real Postgres before the migration; the query logic itself didn't change, only the schema's id/relation typing. |
| Dashboard (all 14 nav sections) | Every page is a real DB-backed page, not a mock — same caveat as above applies to actually exercising them. |
| AI copywriting wizard | Without `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` it falls back to a deterministic template generator — the UI labels which one produced the copy. This part doesn't touch the database and was unaffected by the migration. |
| Theme engine (11 themes) | Colors/fonts/decoration flow through CSS custom properties — the rendering logic is DB-agnostic and was verified pre-migration; the seed data path is untested against Mongo (see note above). |
| Public invitation page + RSVP | Code path unchanged by the migration beyond id typing; verified against Postgres pre-migration, not re-verified against Mongo. |
| Media uploads | Needs `CLOUDINARY_*` env vars. |
| Billing (Stripe Checkout + portal + webhook) | Needs `STRIPE_*` env vars. Webhook handler is real (subscription upsert on `checkout.session.completed`, status sync on `customer.subscription.updated/deleted`). |
| Custom domains | Needs `VERCEL_API_TOKEN` + `VERCEL_PROJECT_ID` (calls the real Vercel Domains API). |
| Analytics | Views, shares, RSVP submits, device type, and map-link clicks are recorded server-side. Country geolocation and click-heatmaps are **not built**. |
| Section builder (`/dashboard/builder`) | Drag-reorder (`@dnd-kit`), hide, lock, duplicate, delete, undo/redo (Zustand), live device preview — the store/UI logic doesn't touch the database at all except the final save, which shares the same not-re-verified caveat. |
| Admin CRUD (`/admin/themes`, `/admin/music`, `/admin/users`) | Create/edit/delete themes, music tracks, user roles — same caveat. |

**Not attempted in this pass**: real-time collaborative editing, and a
visual regression / e2e (Playwright) test layer on top of the Vitest suite.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · Radix primitives (hand-built as Shadcn-style components —
`ui.shadcn.com`'s CLI registry was unreachable from the build sandbox, so
`src/components/ui/*` is written directly against `@radix-ui/*` + `cva`,
matching the same API) · Zustand · React Hook Form + Zod · Prisma 6 +
MongoDB · Auth.js v5 · Cloudinary · Resend · Stripe · Docker.

## Getting started

```bash
cp .env.example .env
# Fill in at least DATABASE_URL and AUTH_SECRET (openssl rand -base64 32).
# Everything else is optional — each feature degrades gracefully without it.

docker compose up -d db      # local MongoDB replica set, or point DATABASE_URL at Atlas
npm install
npm run db:push              # applies prisma/schema.prisma (MongoDB: no migrations, push only)
npm run db:seed              # seeds the 11 themes, default templates, music catalog
npm run dev
```

Open http://localhost:3000, sign up, and run the wizard at
`/dashboard/invitations/new`.

### MongoDB Atlas instead of local Docker

Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas),
add a database user, allow your IP (or `0.0.0.0/0` for local dev), and copy
the connection string into `DATABASE_URL`:

```
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/wedding_studio?retryWrites=true&w=majority"
```

Atlas clusters — including the free M0 tier — are replica sets by default,
so no extra configuration is needed for Prisma's transaction requirement.

### Making an account an admin

`/admin` requires `role = ADMIN` on the user's document — there's no UI for
this yet (bootstrapping problem: the first admin has to be granted by hand).
Using `mongosh` (or Atlas's web-based data browser):

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "ADMIN" } });
```

## Project structure

```
prisma/schema.prisma         Full data model (MongoDB) — auth, billing,
                              invitations, events, guests, RSVPs, media,
                              analytics, themes
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
   Node config split (middleware can't load Prisma directly — this tripped
   the build once and is fixed via `auth.config.ts`).
3. **Database** — full Prisma schema. Originally built and verified
   end-to-end against a real local Postgres instance; migrated to MongoDB
   afterward (schema/typing changes only — see the MongoDB section above
   for what is and isn't re-verified).
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
    lock logic, a `db.ts` resilience test, and integration tests that run
    the real server actions against a real database — written and verified
    against Postgres; needs re-verification against MongoDB (see above).
16. **Section builder** — `/dashboard/builder`: drag-reorder (`@dnd-kit`),
    hide/lock/duplicate/delete, undo/redo (Zustand), live device preview
    reusing the same `InviteExperience` the public page renders, saved to
    `Invitation.sectionConfig`.

## Testing

```bash
npm test          # runs once
npm run test:watch
```

The integration suite (`src/lib/actions/*.integration.test.ts`) needs a
reachable `DATABASE_URL` — same one your dev server uses — since it writes
real documents and asserts on them, then cleans up in `afterAll`. Everything
else runs in isolation with mocked fetch/auth/env and passes regardless of
database provider.

## Security notes

- `npm audit` may report advisories depending on the exact dependency tree
  at install time — worth checking before shipping.
- Stripe webhook signature verification is implemented — don't skip setting
  `STRIPE_WEBHOOK_SECRET` in production.
- RSVP submission is intentionally open (no auth) since guests don't have
  accounts — it's rate-limited by nothing right now; add rate limiting
  before exposing a high-traffic invitation publicly.
- `src/lib/db.ts` constructs the Prisma client lazily behind a Proxy rather
  than eagerly at module scope. Constructing eagerly used to crash the
  *entire* build the moment `DATABASE_URL` was missing — Next's build-time
  route introspection imports every route module, including ones that
  never touch the database. The Proxy defers construction to the first
  real query and rejects (rather than throws synchronously) when
  unconfigured, so both try/catch and `.catch()` chains work as callers
  expect. Covered by `src/lib/db.test.ts`. This still applies unchanged
  after the MongoDB migration — verified by building with `DATABASE_URL`
  unset both before and after.

## Deploying to Vercel

1. Provision MongoDB — Atlas's free M0 tier works fine to start. Copy its
   connection string.
2. Set `DATABASE_URL` (the Atlas connection string) and `AUTH_SECRET`
   (`openssl rand -base64 32`) in your Vercel project's environment
   variables. Everything else in `.env.example` is optional; features
   degrade gracefully without it.
3. From your machine, point `DATABASE_URL` at that same database and run
   `npm run db:push && npm run db:seed` once, so the dashboard has themes
   and music to show.
4. Deploy. The build doesn't require a database connection to succeed (see
   the `db.ts` note above), but the app won't be useful until step 3 is
   done against the database it's actually running against.
5. Double-check your Vercel project's **Framework Preset** is "Next.js" and
   its **Output Directory** setting isn't manually overridden to something
   else (e.g. `dist`, left over from a project originally linked to a
   different framework) — Next's build output lives in `.next`, and a
   stale override will fail deployment with a "No Output Directory found"
   error even after a successful build.
