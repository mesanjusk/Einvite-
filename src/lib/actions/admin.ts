"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteImage, isCloudinaryConfigured } from "@/lib/media/cloudinary";
import { fetchInstagramMedia, type InstagramMedia } from "@/lib/instagram";
import { generateToken, hashToken } from "@/lib/otp";
import { getAppUrl } from "@/lib/app-url";
import {
  RESET_CONFIRMATION_PHRASE,
  resetUserData,
  type ResetSummary,
} from "@/lib/admin-reset";
import type { ActionResult } from "@/lib/actions/auth";
import {
  themeFormSchema,
  musicTrackFormSchema,
  updateUserRoleSchema,
  videoTemplateFormSchema,
  instagramAutomationFormSchema,
  instagramDmRuleFormSchema,
  instagramFlowSettingsFormSchema,
  eventCategoryConfigFormSchema,
  adminResetSchema,
  themeColorwayFormSchema,
  type ThemeFormInput,
  type MusicTrackFormInput,
  type VideoTemplateFormInput,
  type InstagramAutomationFormInput,
  type InstagramDmRuleFormInput,
  type InstagramFlowSettingsFormInput,
  type EventCategoryConfigFormInput,
  type AdminResetInput,
  type ThemeColorwayFormInput,
} from "@/lib/validations/admin";
import {
  pdfTemplatePagesSchema,
  type PdfTemplatePage,
} from "@/lib/validations/pdf-template";

/**
 * The session, only if it still belongs to an active admin.
 *
 * The role is re-read from the record rather than taken from the session:
 * sessions last until they are signed out of, so a token minted before a
 * demotion would otherwise keep admin rights indefinitely. One indexed
 * lookup per admin action is a fair price for a revocation that actually
 * revokes.
 */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });
  // isActive is optional on the model: documents predating it read as null
  // and are active, so only an explicit false locks someone out.
  if (user?.role !== "ADMIN" || user.isActive === false) {
    return null;
  }

  return session;
}

export async function upsertThemeAction(input: ThemeFormInput): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = themeFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  if (!data.id) {
    const existing = await db.theme.findUnique({ where: { slug: data.slug } });
    if (existing)
      return { success: false, error: "A theme with this slug already exists." };
  }

  const themeFields = {
    type: data.type,
    name: data.name,
    slug: data.slug,
    description: data.description,
    previewImage: data.previewImage,
    revealMode: data.revealMode,
    revealVideoUrl: data.revealVideoUrl,
    category: data.category,
    eventCategory: data.eventCategory,
    isPremium: data.isPremium,
    sortOrder: data.sortOrder,
    colorPalette: data.colorPalette,
    fontPairing: data.fontPairing,
  };

  const theme = data.id
    ? await db.theme.update({ where: { id: data.id }, data: themeFields })
    : await db.theme.create({ data: themeFields });

  await db.template.upsert({
    where: { slug: `${theme.slug}-classic` },
    update: {
      name: `${theme.name} Classic`,
      themeId: theme.id,
      sectionOrder: data.sectionOrder,
    },
    create: {
      name: `${theme.name} Classic`,
      slug: `${theme.slug}-classic`,
      themeId: theme.id,
      sectionOrder: data.sectionOrder,
    },
  });

  const adminPath =
    data.type === "PDF" ? "/admin/library/pdf-themes" : "/admin/library/themes";
  revalidatePath(adminPath);
  revalidatePath("/dashboard/invitations/templates");
  revalidatePath("/dashboard/invitations/new");
  revalidatePath("/dashboard/publish/theme");
  revalidatePath("/dashboard/publish/pdf");

  return { success: true, data: undefined };
}

/**
 * Saves a PDF theme's multi-page layout (background + positioned text
 * placeholders per page) onto its auto-created Template row. Website
 * themes don't use this — their layout is just `sectionOrder`.
 */
export async function upsertPdfTemplatePagesAction(input: {
  themeId: string;
  pages: PdfTemplatePage[];
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const theme = await db.theme.findUnique({ where: { id: input.themeId } });
  if (!theme || theme.type !== "PDF")
    return { success: false, error: "PDF theme not found." };

  const parsed = pdfTemplatePagesSchema.safeParse(input.pages);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid pages",
    };
  }

  const template = await db.template.findFirst({ where: { themeId: theme.id } });
  if (!template)
    return { success: false, error: "This theme has no template row yet." };

  await db.template.update({
    where: { id: template.id },
    data: { pages: parsed.data },
  });

  revalidatePath("/admin/library/pdf-themes");
  return { success: true, data: undefined };
}

export async function deleteThemeAction(themeId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const theme = await db.theme.findUnique({ where: { id: themeId } });
  if (!theme) return { success: false, error: "Theme not found." };

  const inUse = await db.invitation.count({
    where: { OR: [{ themeId }, { pdfThemeId: themeId }] },
  });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) still use this theme — cannot delete.`,
    };
  }

  await db.template.deleteMany({ where: { themeId } });
  await db.theme.delete({ where: { id: themeId } });

  revalidatePath(
    theme.type === "PDF" ? "/admin/library/pdf-themes" : "/admin/library/themes",
  );
  return { success: true, data: undefined };
}

export async function upsertMusicTrackAction(
  input: MusicTrackFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = musicTrackFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  if (data.isDefault) {
    // Only one track can be the auto-assigned default at a time.
    await db.musicTrack.updateMany({
      where: { isDefault: true, ...(data.id ? { id: { not: data.id } } : {}) },
      data: { isDefault: false },
    });
  }

  if (data.id) {
    await db.musicTrack.update({
      where: { id: data.id },
      data: {
        title: data.title,
        artist: data.artist,
        url: data.url,
        mood: data.mood,
        isPremium: data.isPremium,
        isDefault: data.isDefault,
      },
    });
  } else {
    await db.musicTrack.create({
      data: {
        title: data.title,
        artist: data.artist,
        url: data.url,
        mood: data.mood,
        isPremium: data.isPremium,
        isDefault: data.isDefault,
      },
    });
  }

  revalidatePath("/admin/library/music");
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/invitations/new");

  return { success: true, data: undefined };
}

export async function deleteMusicTrackAction(trackId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const inUse = await db.invitation.count({ where: { musicTrackId: trackId } });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) still use this track — cannot delete.`,
    };
  }

  await db.musicTrack.delete({ where: { id: trackId } });
  revalidatePath("/admin/library/music");
  return { success: true, data: undefined };
}

export async function updateUserRoleAction(input: {
  userId: string;
  role: "USER" | "ADMIN";
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  if (parsed.data.userId === session.user.id && parsed.data.role === "USER") {
    return { success: false, error: "You can't demote yourself." };
  }

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function setUserActiveAction(input: {
  userId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  if (input.userId === session.user.id && !input.isActive) {
    return { success: false, error: "You can't deactivate yourself." };
  }

  await db.user.update({
    where: { id: input.userId },
    data: { isActive: input.isActive },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  if (userId === session.user.id) {
    return { success: false, error: "You can't delete your own account." };
  }

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function upsertVideoTemplateAction(
  input: VideoTemplateFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = videoTemplateFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  if (!data.id) {
    const existing = await db.videoTemplate.findUnique({ where: { slug: data.slug } });
    if (existing)
      return {
        success: false,
        error: "A video template with this slug already exists.",
      };
  }

  const fields = {
    name: data.name,
    slug: data.slug,
    description: data.description,
    previewImage: data.previewImage,
    aspectRatio: data.aspectRatio,
    durationSeconds: data.durationSeconds,
    promptTemplate: data.promptTemplate,
    styleKeywords: data.styleKeywords,
    geminiModel: data.geminiModel,
    isPremium: data.isPremium,
    sortOrder: data.sortOrder,
  };

  if (data.id) {
    await db.videoTemplate.update({ where: { id: data.id }, data: fields });
  } else {
    await db.videoTemplate.create({ data: fields });
  }

  revalidatePath("/admin/library/video-templates");
  revalidatePath("/dashboard/publish/video");

  return { success: true, data: undefined };
}

export async function deleteVideoTemplateAction(
  videoTemplateId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const inUse = await db.invitation.count({ where: { videoTemplateId } });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) still reference this video template — cannot delete.`,
    };
  }

  await db.invitationVideo.deleteMany({ where: { videoTemplateId } });
  await db.videoTemplate.delete({ where: { id: videoTemplateId } });

  revalidatePath("/admin/library/video-templates");
  return { success: true, data: undefined };
}

export async function adminDeleteMediaAction(mediaId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) return { success: false, error: "Not found." };

  if (media.cloudinaryId && isCloudinaryConfigured()) {
    await deleteImage(
      media.cloudinaryId,
      media.type === "VIDEO" ? "video" : "image",
    ).catch((error) => console.error("Failed to delete Cloudinary asset", error));
  }

  await db.media.delete({ where: { id: mediaId } });

  revalidatePath("/admin/invitations");
  return { success: true, data: undefined };
}

export async function adminRegenerateEditLinkAction(
  invitationId: string,
): Promise<ActionResult<{ editUrl: string }>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { phoneLink: true },
  });
  if (!invitation) return { success: false, error: "Invitation not found." };
  if (!invitation.phoneLink) {
    return {
      success: false,
      error: "This invitation has no WhatsApp-verified owner yet.",
    };
  }

  const rawEditToken = generateToken();
  await db.phoneLink.update({
    where: { id: invitation.phoneLink.id },
    data: { editTokenHash: hashToken(rawEditToken) },
  });

  revalidatePath("/admin/invitations");
  return { success: true, data: { editUrl: `${getAppUrl()}/e/${rawEditToken}` } };
}

export async function upsertInstagramAutomationAction(
  input: InstagramAutomationFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = instagramAutomationFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  // One rule per reel, so a media ID already claimed by another rule is a
  // conflict rather than a silent overwrite.
  const existing = await db.instagramAutomation.findUnique({
    where: { mediaId: data.mediaId },
  });
  if (existing && existing.id !== data.id) {
    return { success: false, error: "Another automation already covers this reel." };
  }

  const fields = {
    mediaId: data.mediaId,
    label: data.label,
    permalink: data.permalink || null,
    triggerWord: data.triggerWord,
    replyMessage: data.replyMessage,
    duplicateMessage: data.duplicateMessage,
    requireFollow: data.requireFollow,
    notFollowingMessage: data.notFollowingMessage || null,
    useButtonFlow: data.useButtonFlow,
    isActive: data.isActive,
  };

  if (data.id) {
    await db.instagramAutomation.update({ where: { id: data.id }, data: fields });
  } else {
    await db.instagramAutomation.create({ data: fields });
  }

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

export async function toggleInstagramAutomationAction(
  automationId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  await db.instagramAutomation.update({
    where: { id: automationId },
    data: { isActive },
  });

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

export async function deleteInstagramAutomationAction(
  automationId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  await db.instagramAutomation.delete({ where: { id: automationId } });

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

export async function upsertInstagramDmRuleAction(
  input: InstagramDmRuleFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = instagramDmRuleFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  const fields = {
    label: data.label,
    matchType: data.matchType,
    // A catch-all carries no keyword, so an admin switching a rule to ANY
    // doesn't leave a stale one behind to confuse the next reader.
    keyword: data.matchType === "ANY" ? null : data.keyword?.trim() || null,
    replyMessage: data.replyMessage,
    issueLink: data.issueLink,
    duplicateMessage: data.duplicateMessage?.trim() || null,
    startFlow: data.startFlow,
    requireFollow: data.requireFollow,
    notFollowingMessage: data.notFollowingMessage?.trim() || null,
    priority: data.priority,
    isActive: data.isActive,
  };

  if (data.id) {
    await db.instagramDmRule.update({ where: { id: data.id }, data: fields });
  } else {
    await db.instagramDmRule.create({ data: fields });
  }

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

export async function toggleInstagramDmRuleAction(
  ruleId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  await db.instagramDmRule.update({ where: { id: ruleId }, data: { isActive } });

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

export async function deleteInstagramDmRuleAction(
  ruleId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  await db.instagramDmRule.delete({ where: { id: ruleId } });

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

/**
 * The button flow's wording, saved as the single row every reel and rule
 * shares. Upserted on `key` rather than an id, which is what keeps it one
 * row however many times the form is submitted.
 */
export async function saveInstagramFlowSettingsAction(
  input: InstagramFlowSettingsFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = instagramFlowSettingsFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  const fields = {
    isActive: data.isActive,
    openerMessage: data.openerMessage,
    openerButtonLabel: data.openerButtonLabel,
    requireFollow: data.requireFollow,
    followMessage: data.followMessage,
    followButtonLabel: data.followButtonLabel,
    stillNotFollowingMessage: data.stillNotFollowingMessage,
    profileUrl: data.profileUrl?.trim() || null,
    gateInvitations: data.gateInvitations,
    pausedMessage: data.pausedMessage?.trim() || null,
    profileButtonLabel: data.profileButtonLabel,
    linkMessage: data.linkMessage,
    notifyOnPublish: data.notifyOnPublish,
    publishedMessage: data.publishedMessage,
    duplicateMessage: data.duplicateMessage,
  };

  await db.instagramFlowSettings.upsert({
    where: { key: "default" },
    create: { key: "default", ...fields },
    update: fields,
  });

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

// Turns a bare media ID into the reel it belongs to, so an admin can confirm
// they are automating the post they think they are before saving a rule.
export async function lookupInstagramMediaAction(
  mediaId: string,
): Promise<ActionResult<InstagramMedia>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const media = await fetchInstagramMedia(mediaId.trim());
  if (!media) {
    return {
      success: false,
      error:
        "Instagram couldn't identify that ID — check it belongs to the connected account.",
    };
  }

  return { success: true, data: media };
}

// Frees a commenter to claim this reel's link again — used when a send broke
// mid-flight and left them marked as claimed for a link they never got.
export async function resetInstagramLeadAction(leadId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  await db.instagramLead.delete({ where: { id: leadId } });

  revalidatePath("/admin/instagram");
  return { success: true, data: undefined };
}

// Admin-scoped delete: the dashboard's own deleteInvitationAction only ever
// removes an invitation the signed-in user owns, which never covers the guest
// and Instagram invitations an admin needs to clear out.
export async function adminDeleteInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return { success: false, error: "Invitation not found." };

  await db.invitation.delete({ where: { id: invitationId } });

  revalidatePath("/admin/invitations");
  revalidatePath("/admin");
  return { success: true, data: undefined };
}

// Marks a published invitation as a homepage showcase. Only published ones
// qualify — a draft in the carousel would link visitors to an empty page.
export async function setInvitationDemoAction(
  invitationId: string,
  isDemo: boolean,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return { success: false, error: "Invitation not found." };
  if (isDemo && invitation.status !== "PUBLISHED") {
    return { success: false, error: "Publish the invitation before featuring it." };
  }

  await db.invitation.update({ where: { id: invitationId }, data: { isDemo } });

  revalidatePath("/admin/invitations");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function upsertThemeColorwayAction(
  input: ThemeColorwayFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = themeColorwayFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  const clash = await db.themeColorway.findUnique({
    where: { themeId_slug: { themeId: data.themeId, slug: data.slug } },
  });
  if (clash && clash.id !== data.id) {
    return { success: false, error: "This theme already has a colour with that slug." };
  }

  const fields = {
    themeId: data.themeId,
    name: data.name,
    slug: data.slug,
    colorPalette: data.colorPalette,
    sortOrder: data.sortOrder,
  };

  if (data.id) {
    await db.themeColorway.update({ where: { id: data.id }, data: fields });
  } else {
    await db.themeColorway.create({ data: fields });
  }

  revalidatePath("/admin/library/themes");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteThemeColorwayAction(
  colorwayId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const inUse = await db.invitation.count({ where: { colorwayId } });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) use this colour — cannot delete.`,
    };
  }

  await db.themeColorway.delete({ where: { id: colorwayId } });

  revalidatePath("/admin/library/themes");
  return { success: true, data: undefined };
}

/**
 * One celebration's form configuration.
 *
 * Written as a full row rather than a patch: the form always shows every
 * field, so what it submits *is* the configuration, and a blank input means
 * "fall back to the catalogue" (stored as null) rather than "leave whatever
 * was there before".
 */
export async function saveEventCategoryConfigAction(
  input: EventCategoryConfigFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = eventCategoryConfigFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  const lines = (value?: string) =>
    (value ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  const text = (value?: string) => value?.trim() || null;

  const fields = {
    isEnabled: data.isEnabled,
    label: text(data.label),
    tagline: text(data.tagline),
    primaryNameLabel: text(data.primaryNameLabel),
    secondaryNameLabel: text(data.secondaryNameLabel),
    secondaryOptional: data.secondaryOptional,
    joiner: text(data.joiner),
    dateLabel: text(data.dateLabel),
    eventsLabel: text(data.eventsLabel),
    familyBrideLabel: text(data.familyBrideLabel),
    familyGroomLabel: text(data.familyGroomLabel),
    defaultEvents: lines(data.defaultEvents),
    familyRelations: lines(data.familyRelations),
    steps: data.steps,
    fields: data.fields,
  };

  await db.eventCategoryConfig.upsert({
    where: { slug: data.slug },
    create: { slug: data.slug, ...fields },
    update: fields,
  });

  revalidatePath("/admin/library/celebrations");
  // The wizard and the picker both read this, and both are public.
  revalidatePath("/create");
  return { success: true, data: undefined };
}

/** Drops the overrides and puts the celebration back to its built-in form. */
export async function resetEventCategoryConfigAction(
  slug: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  await db.eventCategoryConfig.deleteMany({ where: { slug } });

  revalidatePath("/admin/library/celebrations");
  revalidatePath("/create");
  return { success: true, data: undefined };
}

/**
 * Deletes everything the public side has made.
 *
 * Guarded three ways, because it is the one button here that cannot be
 * undone: an admin session, a typed confirmation phrase, and a summary
 * returned afterwards saying exactly what went — so a reset that hit more
 * than expected is visible immediately rather than discovered later.
 */
export async function resetUserDataAction(
  input: AdminResetInput,
): Promise<ActionResult<ResetSummary>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = adminResetSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  if (parsed.data.confirmation.trim() !== RESET_CONFIRMATION_PHRASE) {
    return {
      success: false,
      error: `Type ${RESET_CONFIRMATION_PHRASE} exactly to confirm.`,
    };
  }

  const summary = await resetUserData({
    includeUserAccounts: parsed.data.includeUserAccounts,
  });

  console.log("Admin reset — deleted:", JSON.stringify(summary));

  revalidatePath("/admin");
  revalidatePath("/admin/invitations");
  revalidatePath("/admin/users");
  revalidatePath("/admin/instagram");
  return { success: true, data: summary };
}
