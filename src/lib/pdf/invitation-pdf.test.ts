import { describe, expect, it } from "vitest";

import {
  buildThemePdfData,
  resolvePdfDesign,
  type PdfInvitation,
} from "./invitation-pdf";

function invitation(overrides: Partial<PdfInvitation> = {}): PdfInvitation {
  return {
    eventCategory: "wedding",
    brideName: "Aisha",
    bridePhoto: null,
    groomName: "Rohan",
    groomPhoto: null,
    weddingDate: new Date("2026-12-12T00:00:00Z"),
    venueName: "The Grand Palace",
    venueAddress: "Udaipur",
    customMessage: null,
    pdfExtraText: null,
    colorPalette: null,
    fontPairing: null,
    aiGeneratedCopy: null,
    theme: null,
    pdfTheme: null,
    events: [],
    familyMembers: [],
    media: [],
    ...overrides,
  };
}

describe("buildThemePdfData", () => {
  it("writes the category's own copy when nothing else is set", () => {
    const data = buildThemePdfData(invitation({ eventCategory: "housewarming" }), []);

    expect(data.eyebrow).toBe("Housewarming Invitation");
    expect(data.letter).toContain("Aisha · Rohan");
    expect(data.letter).toContain("housewarming");
    expect(data.letter).not.toContain("{");
    expect(data.familyLabels.groom).toBe("Hosts");
  });

  it("prefers the couple's own message over any generated copy", () => {
    const data = buildThemePdfData(
      invitation({
        customMessage: "Come as you are, leave when the food runs out.",
        aiGeneratedCopy: { invitationLetter: "Generated letter" },
      }),
      [],
    );
    expect(data.letter).toBe("Come as you are, leave when the food runs out.");
  });

  it("falls back to the generated copy, then to the theme's", () => {
    expect(
      buildThemePdfData(
        invitation({ aiGeneratedCopy: { invitationLetter: "Generated" } }),
        [],
      ).letter,
    ).toBe("Generated");

    const themed = buildThemePdfData(
      invitation({
        theme: {
          name: "Ring Blush",
          colorPalette: null,
          fontPairing: null,
          decorAssets: null,
          content: { invitationLetter: "Join us for {names} on {date}." },
        },
      }),
      [],
    );
    expect(themed.letter).toBe("Join us for Aisha & Rohan on December 12, 2026.");
  });

  it("leaves the second name out when the category doesn't need one", () => {
    const data = buildThemePdfData(
      invitation({ eventCategory: "birthday", brideName: "Aarav", groomName: "" }),
      [],
    );
    expect(data.names).toBe("Aarav");
    expect(data.secondaryName).toBeNull();
  });

  it("formats every event's date for print", () => {
    const data = buildThemePdfData(
      invitation({
        events: [
          {
            name: "Haldi",
            date: new Date("2026-12-10T00:00:00Z"),
            time: "10:00 AM",
            venueName: null,
            address: null,
            dressCode: "Yellow",
            tagline: null,
          },
        ],
      }),
      [],
    );
    expect(data.events[0].dateDisplay).toBe("December 10, 2026");
  });
});

describe("resolvePdfDesign", () => {
  const theme = {
    name: "Royal",
    colorPalette: {
      primary: "#7a2e2e",
      secondary: "#f3d9d9",
      accent: "#c9942a",
      background: "#faf3ea",
      foreground: "#3a1414",
    },
    fontPairing: { display: "Playfair Display", body: "Inter" },
    decorAssets: null,
    content: null,
  };

  it("prints in the website theme when no PDF theme is chosen", () => {
    const design = resolvePdfDesign(invitation({ theme }), true);
    expect(design.name).toBe("Royal");
    expect(design.palette.primary).toBe("#7a2e2e");
    expect(design.fonts.body).toBe("Helvetica");
    expect(design.layout).toBe("story");
  });

  it("lets a chosen PDF theme win, layout included", () => {
    const design = resolvePdfDesign(
      invitation({
        theme,
        pdfTheme: {
          name: "Photo Card",
          colorPalette: null,
          fontPairing: null,
          decorAssets: { pdfLayout: "photo" },
          content: null,
          templates: [],
        },
      }),
      true,
    );
    expect(design.name).toBe("Photo Card");
    expect(design.layout).toBe("photo");
  });

  it("uses the invitation's own colourway over the theme's palette", () => {
    const design = resolvePdfDesign(
      invitation({
        theme,
        colorPalette: { ...theme.colorPalette, primary: "#1f5140" },
      }),
      false,
    );
    expect(design.palette.primary).toBe("#1f5140");
    expect(design.layout).toBe("classic");
  });
});
