import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: { invitation: { findUnique: vi.fn() }, instagramFlowSettings: { findUnique: vi.fn() }, instagramLink: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, instagramConnectRequest: { findUnique: vi.fn(), updateMany: vi.fn() } } }));
vi.mock("@/lib/instagram-follow-status", () => ({ checkFollowStatusLive: vi.fn(), readFollowStatus: vi.fn() }));
vi.mock("@/lib/app-url", () => ({ getAppUrl: () => "https://invite.example.com" }));
vi.mock("@/lib/otp", () => ({ hashToken: (value: string) => `hash:${value}`, generateToken: () => "private-editor-token" }));
import { db } from "@/lib/db";
import { checkFollowStatusLive, readFollowStatus } from "@/lib/instagram-follow-status";
import { connectionCodeFromMessage, connectInstagramFromMessage, instagramPublishRequirement } from "./instagram-connect";
const code = "a".repeat(32);
beforeEach(() => {
 vi.resetAllMocks();
 vi.mocked(db.instagramConnectRequest.findUnique).mockResolvedValue({ id: "request", invitationId: "website", expiresAt: new Date(Date.now()+60000), completedAt: null } as never);
 vi.mocked(db.instagramConnectRequest.updateMany).mockResolvedValue({count:1});
 vi.mocked(db.instagramLink.findUnique).mockResolvedValue(null);
 vi.mocked(checkFollowStatusLive).mockResolvedValue(true);
 vi.mocked(db.invitation.findUnique).mockResolvedValue({slug:"our-wedding",status:"PUBLISHED",isDemo:false} as never);
});
describe("verified Instagram website connection", () => {
 it("accepts only a complete LINK message", () => { expect(connectionCodeFromMessage(`LINK ${code}`)).toBe(code); expect(connectionCodeFromMessage(`hello LINK ${code}`)).toBeNull(); expect(connectionCodeFromMessage("LINK account-name")).toBeNull(); });
 it("rejects expired codes before verifying or binding an account", async () => { vi.mocked(db.instagramConnectRequest.findUnique).mockResolvedValue({expiresAt:new Date(0)} as never); expect((await connectInstagramFromMessage(code,"ig-user")).connected).toBe(false); expect(checkFollowStatusLive).not.toHaveBeenCalled(); expect(db.instagramLink.create).not.toHaveBeenCalled(); });
 it.each([false,null])("does not consume the code when follow status is %s", async (following) => { vi.mocked(checkFollowStatusLive).mockResolvedValue(following); expect((await connectInstagramFromMessage(code,"ig-user")).connected).toBe(false); expect(db.instagramConnectRequest.updateMany).not.toHaveBeenCalled(); expect(db.instagramLink.create).not.toHaveBeenCalled(); });
 it("does not replace an account's existing invitation", async () => { vi.mocked(db.instagramLink.findUnique).mockResolvedValueOnce({invitationId:"other"} as never); expect((await connectInstagramFromMessage(code,"ig-user")).connected).toBe(false); expect(db.instagramLink.create).not.toHaveBeenCalled(); expect(db.instagramConnectRequest.updateMany).not.toHaveBeenCalled(); });
 it("rejects a code consumed by another request", async () => { vi.mocked(db.instagramConnectRequest.updateMany).mockResolvedValue({count:0}); expect((await connectInstagramFromMessage(code,"ig-user")).connected).toBe(false); expect(db.instagramLink.create).not.toHaveBeenCalled(); });
 it("stores only a hashed edit token and returns private and published links for the DM", async () => { const result=await connectInstagramFromMessage(code,"ig-user","couple"); expect(result.connected).toBe(true); expect(db.instagramLink.create).toHaveBeenCalledWith({data:{igUserId:"ig-user",username:"couple",invitationId:"website",editTokenHash:"hash:private-editor-token"}}); expect(result.text).toContain("/e/private-editor-token"); expect(result.text).toContain("/invite/our-wedding"); });
 it("blocks publishing without a connected account", async () => { expect(await instagramPublishRequirement("website")).toContain("Connect"); });
 it("rechecks the follower when explicitly checking a connection", async () => { vi.mocked(db.instagramLink.findUnique).mockResolvedValue({igUserId:"ig-user"} as never); vi.mocked(readFollowStatus).mockResolvedValue(true); expect(await instagramPublishRequirement("website",true)).toBeNull(); expect(readFollowStatus).toHaveBeenCalledWith("ig-user",{force:true}); });
});
