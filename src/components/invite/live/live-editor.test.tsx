import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LiveEditor } from "./live-editor";
import { buildThemePreviewData } from "@/lib/theme-preview";
import { themeFormSchema } from "@/lib/validations/admin";
import { patchInvitationAction } from "@/lib/actions/live-invitation";

vi.mock("@/lib/actions/instagram-connect", () => ({ checkInstagramConnectionAction: vi.fn(), prepareInstagramConnectionAction: vi.fn() }));
vi.mock("@/lib/actions/invitation-design", () => ({ saveInvitationDesignAction: vi.fn() }));
vi.mock("@/lib/actions/video", () => ({ updateInvitationGeminiKeyAction: vi.fn() }));
vi.mock("./design-sheet", () => ({ DesignSheet: () => null }));
vi.mock("./music-sheet", () => ({ MusicSheet: () => null }));
vi.mock("./photos-sheet", () => ({ PhotosSheet: () => null }));
vi.mock("@/components/guest/publish-dialog", () => ({ PublishDialog: () => null, PublishSuccess: () => null }));
vi.mock("@/lib/actions/invitation", () => ({ publishInvitationAction: vi.fn() }));
vi.mock("@/lib/actions/live-invitation", () => ({
  replaceInvitationSectionsAction: vi.fn(), addInviteEventAction: vi.fn(), deleteInviteEventAction: vi.fn(), patchInviteEventAction: vi.fn(),
  patchInvitationAction: vi.fn(async () => ({ success: true, data: {} })), setFamilyMemberAction: vi.fn(), setMediaOrderAction: vi.fn(), setSectionVisibilityAction: vi.fn(),
}));
vi.mock("../invite-experience", async () => {
  const { useInviteEdit } = await import("../edit-context");
  const { EditableText } = await import("../editable");
  return { InviteExperience: ({ invite, guidedActiveSectionId }: { invite: { brideName: string; groomName: string }; guidedActiveSectionId?: string | null }) => {
    const edit = useInviteEdit();
    return <div>
      {["brideName", "groomName"].map((field) => <section key={field} data-invite-section-id={field} data-invite-section-label={field}>
        {edit?.active && guidedActiveSectionId === undefined ? <EditableText target={{ kind: "invitation", field: field as "brideName" | "groomName" }} value={invite[field as "brideName" | "groomName"]} placeholder={field} /> : invite[field as "brideName" | "groomName"]}
      </section>)}
    </div>;
  }};
});

const invite = buildThemePreviewData(themeFormSchema.parse({ name: "Test", colorPalette: { primary: "#000", secondary: "#fff", accent: "#444", background: "#fff", foreground: "#000" }, fontPairing: { display: "serif", body: "sans-serif", script: "serif" }, sectionOrder: ["HERO"] }));

describe("global invitation editing", () => {
  it("one Edit activates all sections and committing a field autosaves without a section save button", async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, top: 100, bottom: 500, left: 0, right: 390, width: 390, height: 400, toJSON() {} });
    render(<LiveEditor invitationId="test-global-draft" initialInvite={invite} initialThemeStyle={{}} initialSections={[{ id: "HERO", type: "HERO", visible: true, locked: false, order: 0 }]} initialThemeSlug={null} initialColorwaySlug={null} initialMusicTrackId={null} initialCustomMusicUrl={null} themes={[]} musicTracks={[]} isPublished={false} isGuestFlow appUrl="https://example.com" />);
    expect(screen.queryByRole("button", { name: "Sections" })).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: "Edit all sections" }));
    expect(screen.getByRole("button", { name: "Sections" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit: Meera" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit: Arjun" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit: Meera" }));
    const text = screen.getByRole("textbox");
    text.textContent = "Our bride";
    fireEvent.blur(text);
    await waitFor(() => expect(patchInvitationAction).toHaveBeenCalledWith("test-global-draft", { brideName: "Our bride" }));
    expect(screen.getByRole("button", { name: "Edit: Arjun" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Done & preview" }));
    expect(screen.queryByRole("button", { name: "Edit: Arjun" })).toBeNull();
  });
});
