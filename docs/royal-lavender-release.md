# Royal Lavender customer release — October 9, 2026

Sanju selected option 1 and authorized one combined fix, PR merge and production deployment. The selected design uses lavender, ivory, gold details, a compact header, layered arched invitation artwork, restrained petals and a visual choose/personalize/share flow. Only published database designs are presented; no mockup themes are seeded.

All customer routes use a centred canvas with maximum width 430px on desktop and available width on phones. Admin routes retain their desktop workspace. Reveal videos, music, progress controls, editing footer, dialogs and settings sheets stay within the customer canvas, including scrollbar-lock compensation. Long content still scrolls normally.

The marketplace shares one artwork renderer: saved reveal poster or a still derived from the existing Cloudinary video, actual theme thumbnail/section artwork, then coded artwork if media fails. Playback is limited to visible cards, pauses offscreen/in background tabs and respects reduced motion/data saver. Preparing an editor uses a lightweight coded loader instead of another video download.

Customer design alternatives and draft creation/switching exclude unpublished website designs. An existing assigned design remains available to its authorized draft owner. Gallery reorder tolerates deleted photos and duplicate ids and filters updates by invitation ownership.

Verification completed before release:
- Production compilation, TypeScript validation and focused React lint passed.
- 372 tests passed initially; three media rendering tests and two design authorization cases were added and passed. The final targeted suite passed all 11 cases covering media fallback, visibility, reduced motion, gallery races and unpublished-design rejection.
- Browser checked the actual landing component at 320, 360, 390 and 430px iframe viewports with no horizontal overflow, plus the 430px frame on desktop.
- Real existing Cloudinary videos and derived JPEG posters loaded. Reveal, one-button editing, the narrow footer, section tools and time/venue controls were exercised in a disposable non-production fixture. Sheet and frame bounds matched exactly after correcting scrollbar lock.
- Temporary verification routes were removed before the final build and are excluded from the PR.

Release target: mesanjusk/Einvite-, production branch claude/new-session-mz697f; Vercel einvite project prj_GSMHWzt7BQRAiF0SZCRdEbVIhP0y, team sanju-sks-projects, domain invite.sanjusk.in. Feature branch feat/royal-lavender-mobile-20261009 has Git preview deployment disabled to conserve deployment quota.

Real Instagram follower/DM delivery, WhatsApp OTP, Gemini generation, uploads and published PDF delivery still need real-account verification. This UI release does not establish those external workflows or 1,000-user load readiness. No paid service, published test invitation or outbound message was used during implementation.
