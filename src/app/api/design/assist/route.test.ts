import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/project-gemini", () => ({ getProjectGeminiKey: vi.fn() }));
import { getProjectGeminiKey } from "@/lib/project-gemini";
vi.mock("@/lib/admin-guard", () => ({ getAdmin: vi.fn() }));
vi.mock("@/lib/invitation-access", () => ({ authorizeInvitationAccess: vi.fn() }));
vi.mock("@/lib/ai/design-assist", () => ({ suggestMediaDesign: vi.fn() }));
import { getAdmin } from "@/lib/admin-guard";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { suggestMediaDesign } from "@/lib/ai/design-assist";
import { POST } from "./route";
const body = { image: "c21hbGwtaW1hZ2UtcHJldmlldw==", elements: [{ key: "HERO.primaryName", text: "Couple name" }] };
function request(data: unknown) { return new Request("https://example.com/api/design/assist", { method: "POST", body: JSON.stringify(data) }); }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getProjectGeminiKey).mockResolvedValue(null); });
describe("design assistant authorization", () => {
  it("blocks unauthorized users before any Gemini call", async () => {
    vi.mocked(getAdmin).mockResolvedValue(null);
    expect((await POST(request({ ...body, apiKey: "test-key" }))).status).toBe(403);
    expect(suggestMediaDesign).not.toHaveBeenCalled();
  });
  it("keeps uploads usable when an authorized invitation has no key", async () => {
    vi.mocked(authorizeInvitationAccess).mockResolvedValue({ geminiApiKey: null } as never);
    const response = await POST(request({ ...body, invitationId: "aaaaaaaaaaaaaaaaaaaaaaaa" }));
    expect(await response.json()).toMatchObject({ skipped: true });
    expect(suggestMediaDesign).not.toHaveBeenCalled();
  });
  it("uses the project key and ignores an invitation key", async () => {
    vi.mocked(authorizeInvitationAccess).mockResolvedValue({ geminiApiKey: "private-saved-key" } as never);
    vi.mocked(getProjectGeminiKey).mockResolvedValue("private-project-key");
    vi.mocked(suggestMediaDesign).mockResolvedValue({ elements: [] } as never);
    const response = await POST(request({ ...body, invitationId: "aaaaaaaaaaaaaaaaaaaaaaaa" }));
    expect(suggestMediaDesign).toHaveBeenCalledWith(expect.objectContaining({ apiKey: "private-project-key" }));
    expect(await response.text()).not.toContain("private-project-key");
  });
});
