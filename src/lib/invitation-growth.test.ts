import { describe, expect, it } from "vitest";
import { invitationStoryUrl, normalizeAcquisitionSource } from "./invitation-growth";

describe("growth attribution", () => {
  it("only accepts supported attribution labels", () => {
    expect(normalizeAcquisitionSource("instagram")).toBe("instagram");
    expect(normalizeAcquisitionSource("story")).toBe("story");
    expect(normalizeAcquisitionSource("guest_invite")).toBe("guest_invite");
    expect(normalizeAcquisitionSource("../../oops")).toBe("direct");
  });
  it("never shares personalized guest tokens", () => {
    expect(invitationStoryUrl("https://invite.sanjusk.in/invite/wedding?to=PRIVATE&edit=secret"))
      .toBe("https://invite.sanjusk.in/invite/wedding?via=story");
  });
});
