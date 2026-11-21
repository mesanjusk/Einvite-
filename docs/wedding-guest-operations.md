# SK Digital — Wedding Guest Operations

Integrated into the existing invitation platform at /dashboard/manage/wedding.

## Features

- Import up to 500 guests per CSV (Excel → Save as CSV); recognizes Name, Phone, Email, Group, Party Size, Events, Travel Mode, Travel Details and Hotel.
- Deduplicates by normalized phone or by name + group for guests without phones.
- Guest-level family grouping, party size, ceremony segmentation, travel, accommodation and coordinator notes.
- Live RSVP and invitation-open status from the existing invitation guest records.
- Owner-authorized CSV export with formula-injection escaping.
- Meta Cloud API approved template sends for an invitation or follow-up reminder. The platform does not send free-form outbound messages outside the 24-hour WhatsApp window.
- No mass sending on import; sending must be initiated by an authenticated owner and occurs only for explicitly opted-in guests.

## Template setup

Set the following environment variables on the existing Vercel einvite project (or Render):

- WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID — existing WhatsApp Cloud API credentials.
- WHATSAPP_API_VERSION — optional, uses existing default.
- WHATSAPP_WEDDING_INVITE_TEMPLATE_NAME — approved utility template for wedding invitation.
- WHATSAPP_WEDDING_REMINDER_TEMPLATE_NAME — approved utility template for wedding reminder.
- WHATSAPP_WEDDING_TEMPLATE_LANGUAGE — optional approved locale code, default en.

Both templates must have exactly four body placeholders, in order:

1. Guest name
2. Couple names
3. Wedding date (India date)
4. Personalized invitation URL

Create and obtain Meta approval before activating sends. A successful request only means Meta accepted it, not that the phone received or opened it. Avoid placing private travel PNRs in message bodies.

## Safety and limitations

- Existing guests default to WhatsApp opt-out. Guests imported with the consent checkbox are opted in only when the business confirms it has documented permission. Opt-out can be revoked in Edit.
- Invitations must be published; a reminder requires a previously submitted invitation. Batch sends cap at 10 per click; duplicate same-kind sends are blocked for 12 hours on the server, and completed sends are disabled in the UI.
- Import and export are restricted to the signed-in invitation owner. RSVP collection remains unchanged.
- Wedding and travel notes are stored in existing MongoDB guest records; do not store identity documents, credentials or payment card details.
- Wedding Ops currently provides manual reminders and operator-entered travel information. WhatsApp document intake, ticket parsing, automatic scheduling and AI outbound voice calling are not integrated; they require approved webhook/media flows, a calling provider and consent.

## Rollout

The production build runs prisma generate and attempts prisma db push to reconcile indexes. Existing guest records are supported through optional fields. No guest data is deleted or rewritten by deployment.

Verify:
1. Import CSV and ensure no duplicates or malformed phones.
2. Confirm RSVP counts remain visible and existing personalized links open.
3. Save travel and accommodation details.
4. Check non-consented users cannot be messaged.
5. Test Meta templates with one consenting number before batch sends.
6. Export CSV and inspect columns.
