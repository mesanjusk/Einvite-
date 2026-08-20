/**
 * Wiping everything the public side has made, and nothing the admin has.
 *
 * The distinction this draws is the whole point of it: an account being
 * cleaned out for a fresh campaign wants the invitations, the guests, the
 * RSVPs and the Instagram claim history gone, and absolutely does not want
 * to re-upload forty themes, the music library and the PDF templates
 * afterwards. Those are the admin's own work and they are never touched here.
 *
 * The scope is declared rather than described, so the button can show the
 * same two lists the code acts on and neither can drift into a lie.
 */

import { db } from "@/lib/db";

export type ResetGroup = { label: string; detail: string };

/** Wiped, always. */
export const RESET_WIPES: ResetGroup[] = [
  {
    label: "Invitations",
    detail:
      "Every invitation and everything under it — ceremonies, family lists, photos, guests, RSVPs, analytics, deployments and generated videos.",
  },
  {
    label: "Access links",
    detail:
      "WhatsApp phone links and Instagram links, so every /e/ edit link ever sent stops opening.",
  },
  {
    label: "Instagram claim history",
    detail:
      "Who claimed which reel, cached follower status, button-flow progress, and the comment and DM logs.",
  },
];

/** Never touched. */
export const RESET_KEEPS: ResetGroup[] = [
  {
    label: "Content library",
    detail:
      "Website themes and their colourways, PDF themes and templates, video templates, and the music library.",
  },
  {
    label: "Instagram automation setup",
    detail:
      "Reel automations, DM rules and the button-flow wording — the campaign itself, as opposed to who has been through it.",
  },
  {
    label: "Accounts",
    detail:
      "User logins and their subscriptions, unless you tick the box to clear non-admin accounts too.",
  },
];

export type ResetOptions = {
  /**
   * Also delete non-admin user accounts. Admins are always kept — a reset
   * that locks the person doing it out of the dashboard is not a reset.
   */
  includeUserAccounts: boolean;
};

export type ResetSummary = {
  invitations: number;
  phoneLinks: number;
  instagramLinks: number;
  instagramLeads: number;
  instagramProfiles: number;
  instagramFlowStates: number;
  instagramCommentLogs: number;
  instagramMessageLogs: number;
  guests: number;
  rsvps: number;
  analyticsEvents: number;
  deployments: number;
  media: number;
  videos: number;
  users: number;
};

/**
 * Deletes the lot and reports what went.
 *
 * Invitations go first because every child of an invitation cascades with
 * it — that one call takes the events, family, photos, guests, RSVPs,
 * analytics, deployment and videos with it. The sweeps that follow catch
 * rows orphaned by earlier deletions elsewhere, which is why they run even
 * though the cascade "should" have covered them; a stray guest list left
 * behind by a half-finished delete months ago is exactly what a reset is
 * supposed to clear.
 */
export async function resetUserData(options: ResetOptions): Promise<ResetSummary> {
  const invitations = await db.invitation.deleteMany({});

  const [
    guests,
    rsvps,
    analyticsEvents,
    deployments,
    media,
    videos,
    phoneLinks,
    instagramLinks,
    instagramLeads,
    instagramProfiles,
    instagramFlowStates,
    instagramCommentLogs,
    instagramMessageLogs,
  ] = await Promise.all([
    db.guest.deleteMany({}),
    db.rsvp.deleteMany({}),
    db.analyticsEvent.deleteMany({}),
    db.deployment.deleteMany({}),
    db.media.deleteMany({}),
    db.invitationVideo.deleteMany({}),
    db.phoneLink.deleteMany({}),
    db.instagramLink.deleteMany({}),
    db.instagramLead.deleteMany({}),
    db.instagramProfile.deleteMany({}),
    db.instagramFlowState.deleteMany({}),
    db.instagramCommentLog.deleteMany({}),
    db.instagramMessageLog.deleteMany({}),
  ]);

  // Admins are excluded by role rather than by id: clearing accounts should
  // not depend on remembering to spare the person clicking the button, and a
  // second admin is as much a keeper as the first.
  const users = options.includeUserAccounts
    ? await db.user.deleteMany({ where: { role: { not: "ADMIN" } } })
    : { count: 0 };

  return {
    invitations: invitations.count,
    phoneLinks: phoneLinks.count,
    instagramLinks: instagramLinks.count,
    instagramLeads: instagramLeads.count,
    instagramProfiles: instagramProfiles.count,
    instagramFlowStates: instagramFlowStates.count,
    instagramCommentLogs: instagramCommentLogs.count,
    instagramMessageLogs: instagramMessageLogs.count,
    guests: guests.count,
    rsvps: rsvps.count,
    analyticsEvents: analyticsEvents.count,
    deployments: deployments.count,
    media: media.count,
    videos: videos.count,
    users: users.count,
  };
}

/** What the admin has to type before the button will fire. */
export const RESET_CONFIRMATION_PHRASE = "DELETE ALL USER DATA";
