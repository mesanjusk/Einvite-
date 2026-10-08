import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { toast } from "sonner";
import { submitRsvpAction } from "@/lib/actions/rsvp";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { RsvpSection } from "./rsvp-section";

vi.mock("@/lib/actions/rsvp", () => ({ submitRsvpAction: vi.fn() }));
vi.mock("sonner", () => ({ toast: { message: vi.fn(), error: vi.fn() } }));
vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

describe("theme preview RSVP", () => {
  it("blocks a database submission even if a preview form is submitted programmatically", async () => {
    const { container } = render(<LocaleProvider><RsvpSection invitationId="theme-preview" guestName="Sample guest" previewMode /></LocaleProvider>);
    expect(screen.getByRole("button", { name: "RSVP disabled in preview" })).toBeDisabled();
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(toast.message).toHaveBeenCalled());
    expect(submitRsvpAction).not.toHaveBeenCalled();
  });
});
