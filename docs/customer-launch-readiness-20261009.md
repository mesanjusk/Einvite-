# Customer launch readiness — 9 October 2026

## Intent
Ship nontechnical customer improvements without requiring an Instagram follow before creating, publishing, sharing or viewing an invitation. Do not remove the Instagram webhook, DM automation, follower-status code, data deletion route or account-linking code.

## Temporary server-side policy
- `INSTAGRAM_VALIDATION_ENABLED` is OFF unless its exact value is `true`.
- OFF: edit → publish never opens the Instagram follower dialog; Instagram lead/DМ flows can still issue links without follow checks; already-linked guest invitation URLs remain live rather than entering the `PAUSED` screen.
- ON: existing follow-verification requirements resume. Set this only after real Meta app/follow/DM production checks and review the product policy first.
- **Never** expose this as `NEXT_PUBLIC_*`. Admin UI follow toggles are preserved.

## Multiple invitations per customer
- PhoneLink.phone and InstagramLink.igUserId become non-unique, indexed lookups.
- Invitation ownership and private editTokenHash remain unique per invitation; nobody gains another invitation just by knowing their phone or handle.
- Production build's `scripts/db-sync.mjs` removes only the old single-field unique indexes on `phone_links.phone` and `instagram_links.igUserId`, then calls Prisma db push to build non-unique lookup indexes. No invitation records are deleted.
- An Instagram account with an unpublished invite reuses that draft; a published invitation stays intact when the account requests a new invite.
- Old single-use edit links and per-invitation cookies still work. Multiple invites under a phone are individually editable via separate private edit links, not a unified anonymous customer dashboard.
- Password recovery fails closed if multiple signed-in user accounts resolve from a single shared phone.
- Instagram GDPR/data-deletion logic covers every invitation linked to the user.

## Customer UX and resilience
- Quick setup inside the mobile Details sheet: names, wedding date, venue, ceremony details; bigger controls; Hindi/Marathi hints.
- Published Share shows the existing link instead of re-publishing or rotating the owner's token.
- Guests can open invitations when the analytics write fails.
- A database fetch failure is labelled `temporarily unavailable` rather than pretending there are no published themes.
- Keep theme previews, video reveals, Google Auth and existing edit-link mechanics.

## Verification
- PR CI: Prisma client generation, TypeScript, non-database Vitest tests, eslint.
- Vercel: confirm a READY production deployment from the merged commit and a healthy `/api/health` on `invite.sanjusk.in`.
- Must still smoke-test a real guest create/publish/share on the production DB and verify the released indexes, two invitations under one phone, multiple Instagram invitations, PDF/RSVP, and actual Meta DM with real accounts. No automated CI test can substitute for production API credentials.
- Integration suite `src/lib/actions/invitation.integration.test.ts` requires a disposable real MongoDB database and is not run in public PR CI. Run it separately before higher-volume rollout.
