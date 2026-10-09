import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: { media: { findMany: vi.fn(), updateMany: vi.fn() }, theme: { findUnique: vi.fn() }, invitation: { create: vi.fn(), update: vi.fn() } } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/invitation-access", () => ({ authorizeInvitationAccess: vi.fn() }));
import { db } from "@/lib/db";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { setMediaOrderAction, patchInvitationAction, startLiveInvitationAction } from "./live-invitation";

beforeEach(() => vi.resetAllMocks());
describe("gallery reorder during removal", () => {
  it("ignores a removed photo and duplicate ids without failing the whole save", async () => {
    vi.mocked(authorizeInvitationAccess).mockResolvedValue({ slug: "wedding" } as never);
    vi.mocked(db.media.findMany).mockResolvedValue([{ id: "one" }, { id: "two" }] as never);
    vi.mocked(db.media.updateMany).mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    expect(await setMediaOrderAction("invite", ["one", "one", "foreign", "two"])).toEqual({ success: true, data: { ordered: 1 } });
    expect(db.media.updateMany).toHaveBeenNthCalledWith(1, { where: { id: "one", invitationId: "invite" }, data: { order: 0 } });
    expect(db.media.updateMany).toHaveBeenNthCalledWith(2, { where: { id: "two", invitationId: "invite" }, data: { order: 1 } });
  });
  it("does not read or mutate media without access", async () => {
    vi.mocked(authorizeInvitationAccess).mockResolvedValue(null);
    expect((await setMediaOrderAction("invite", ["one"])).success).toBe(false);
    expect(db.media.findMany).not.toHaveBeenCalled();
  });
});

describe("customer design visibility", () => {
  it("rejects switching to an unpublished design even with a known slug", async () => {
    vi.mocked(authorizeInvitationAccess).mockResolvedValue({ themeId: null } as never);
    vi.mocked(db.theme.findUnique).mockResolvedValue({ id: "hidden", type: "WEBSITE", isPublished: false } as never);
    expect((await patchInvitationAction("invite", { themeSlug: "hidden" })).success).toBe(false);
    expect(db.invitation.update).not.toHaveBeenCalled();
  });
  it("does not create a draft from an unpublished design", async () => {
    vi.mocked(db.theme.findUnique).mockResolvedValue({ id: "hidden", type: "WEBSITE", isPublished: false } as never);
    expect((await startLiveInvitationAction({ themeSlug: "hidden" })).success).toBe(false);
    expect(db.invitation.create).not.toHaveBeenCalled();
  });
});
