import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

const TEST_EMAIL = "vitest-invitation@example.com";
let userId: string;

// revalidatePath needs a live Next.js request context that doesn't exist
// under Vitest — it's a cache-invalidation side effect, irrelevant to what
// these tests verify (the actual database writes).
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: userId, email: TEST_EMAIL, role: "USER" as const },
  })),
}));

vi.mock("@/lib/ai/generate-copy", () => ({
  generateInvitationCopy: vi.fn(async () => ({
    heroHeadline: "We're Getting Married",
    heroSubline: "Test subline",
    invitationLetter: "Test invitation letter.",
    storyHeadline: "Forever Us",
    hashtags: ["Test"],
    seoTitle: "Test Wedding",
    seoDescription: "Test description",
    source: "template" as const,
  })),
}));

const { createInvitationAction, publishInvitationAction, deleteInvitationAction } =
  await import("./invitation");
const { submitRsvpAction } = await import("./rsvp");

beforeAll(async () => {
  const user = await db.user.create({
    data: { email: TEST_EMAIL, name: "Vitest User" },
  });
  userId = user.id;

  await db.theme.upsert({
    where: { slug: "royal" },
    update: {},
    create: {
      name: "Royal",
      slug: "royal",
      colorPalette: {
        primary: "#7a2e2e",
        secondary: "#f3d9d9",
        accent: "#c9942a",
        background: "#faf3ea",
        foreground: "#3a1414",
      },
      fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    },
  });
});

afterAll(async () => {
  await db.user.delete({ where: { id: userId } }).catch(() => {});
});

describe("createInvitationAction", () => {
  it("creates an invitation with events and a unique slug, end to end", async () => {
    const result = await createInvitationAction({
      brideName: "Meenal",
      groomName: "Avinash",
      weddingDate: "2026-12-12",
      themeSlug: "royal",
      language: "EN",
      events: [{ name: "Wedding", date: "2026-12-12" }],
      familyMembers: [],
      useAiCopy: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.slug).toBe("meenal-avinash");

    const invitation = await db.invitation.findUnique({
      where: { id: result.data.invitationId },
      include: { events: true },
    });

    expect(invitation).not.toBeNull();
    expect(invitation?.status).toBe("DRAFT");
    expect(invitation?.brideName).toBe("Meenal");
    expect(invitation?.events).toHaveLength(1);
    expect(invitation?.aiGeneratedCopy).toMatchObject({ heroHeadline: "We're Getting Married" });
    expect(Array.isArray(invitation?.sectionConfig)).toBe(true);
  });

  it("appends a random suffix when the slug is already taken", async () => {
    const first = await createInvitationAction({
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: "2026-06-01",
      themeSlug: "royal",
      language: "EN",
      events: [],
      familyMembers: [],
      useAiCopy: false,
    });
    const second = await createInvitationAction({
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: "2027-06-01",
      themeSlug: "royal",
      language: "EN",
      events: [],
      familyMembers: [],
      useAiCopy: false,
    });

    expect(first.success && second.success).toBe(true);
    if (!first.success || !second.success) return;

    expect(first.data.slug).toBe("priya-rahul");
    expect(second.data.slug).not.toBe("priya-rahul");
    expect(second.data.slug).toMatch(/^priya-rahul-/);
  });

  it("rejects an unknown theme", async () => {
    const result = await createInvitationAction({
      brideName: "A",
      groomName: "B",
      weddingDate: "2026-01-01",
      themeSlug: "does-not-exist",
      language: "EN",
      events: [],
      familyMembers: [],
      useAiCopy: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("publishInvitationAction + submitRsvpAction", () => {
  it("publishes an invitation and accepts a public RSVP against it", async () => {
    const created = await createInvitationAction({
      brideName: "Kavya",
      groomName: "Dev",
      weddingDate: "2026-09-09",
      themeSlug: "royal",
      language: "EN",
      events: [],
      familyMembers: [],
      useAiCopy: false,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const blocked = await publishInvitationAction(created.data.invitationId);
    expect(blocked.success).toBe(false);

    await db.media.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        invitationId: created.data.invitationId,
        url: `https://example.com/photo-${i}.jpg`,
        type: "IMAGE" as const,
      })),
    });

    const published = await publishInvitationAction(created.data.invitationId);
    expect(published.success).toBe(true);

    const invitation = await db.invitation.findUnique({
      where: { id: created.data.invitationId },
    });
    expect(invitation?.status).toBe("PUBLISHED");
    expect(invitation?.publishedAt).not.toBeNull();

    const rsvp = await submitRsvpAction({
      invitationId: created.data.invitationId,
      guestName: "Test Guest",
      status: "ACCEPTED",
      guestCount: 2,
    });
    expect(rsvp.success).toBe(true);

    const rows = await db.rsvp.findMany({
      where: { invitationId: created.data.invitationId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].guestName).toBe("Test Guest");
    expect(rows[0].guestCount).toBe(2);

    const viewEvents = await db.analyticsEvent.count({
      where: { invitationId: created.data.invitationId, type: "RSVP_SUBMIT" },
    });
    expect(viewEvents).toBe(1);
  });
});

describe("deleteInvitationAction", () => {
  it("deletes an invitation and cascades to its events", async () => {
    const created = await createInvitationAction({
      brideName: "Delete",
      groomName: "Me",
      weddingDate: "2026-03-03",
      themeSlug: "royal",
      language: "EN",
      events: [{ name: "Wedding", date: "2026-03-03" }],
      familyMembers: [],
      useAiCopy: false,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const result = await deleteInvitationAction(created.data.invitationId);
    expect(result.success).toBe(true);

    const invitation = await db.invitation.findUnique({
      where: { id: created.data.invitationId },
    });
    expect(invitation).toBeNull();

    const events = await db.event.findMany({
      where: { invitationId: created.data.invitationId },
    });
    expect(events).toHaveLength(0);
  });

  it("refuses to delete another user's invitation", async () => {
    const otherUser = await db.user.create({
      data: { email: "vitest-other@example.com", name: "Other" },
    });
    const created = await db.invitation.create({
      data: {
        userId: otherUser.id,
        slug: "not-yours",
        brideName: "X",
        groomName: "Y",
        weddingDate: new Date("2026-01-01"),
        sectionConfig: [],
      },
    });

    const result = await deleteInvitationAction(created.id);
    expect(result.success).toBe(false);

    await db.invitation.delete({ where: { id: created.id } });
    await db.user.delete({ where: { id: otherUser.id } });
  });
});
