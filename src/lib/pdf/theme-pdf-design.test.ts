import { describe, expect, it } from "vitest";

import { eventCategoryFor } from "@/lib/event-categories";
import {
  DEFAULT_PDF_PALETTE,
  coverEyebrow,
  monogramFor,
  pdfFontFamily,
  resolvePdfLayout,
  toPdfFonts,
  toPdfPalette,
} from "./theme-pdf-design";

describe("pdfFontFamily", () => {
  it("maps sans web fonts onto Helvetica and everything else onto Times", () => {
    expect(pdfFontFamily("Inter")).toBe("Helvetica");
    expect(pdfFontFamily("DM Sans")).toBe("Helvetica");
    expect(pdfFontFamily("Playfair Display")).toBe("Times-Roman");
    expect(pdfFontFamily("Cormorant Garamond")).toBe("Times-Roman");
  });

  it("falls back to Times when no font is set", () => {
    expect(pdfFontFamily(null)).toBe("Times-Roman");
    expect(pdfFontFamily("")).toBe("Times-Roman");
  });
});

describe("toPdfPalette", () => {
  it("keeps valid hex colours", () => {
    const palette = toPdfPalette({
      primary: "#123456",
      secondary: "#abc",
      accent: "#FFFFFF",
      background: "#000000",
      foreground: "#0f0f0f",
    });
    expect(palette.primary).toBe("#123456");
    expect(palette.secondary).toBe("#abc");
  });

  it("replaces anything that isn't a hex colour, key by key", () => {
    const palette = toPdfPalette({ primary: "rebeccapurple", accent: "#c9942a" });
    expect(palette.primary).toBe(DEFAULT_PDF_PALETTE.primary);
    expect(palette.accent).toBe("#c9942a");
    expect(palette.background).toBe(DEFAULT_PDF_PALETTE.background);
  });

  it("survives a missing palette entirely", () => {
    expect(toPdfPalette(null)).toEqual(DEFAULT_PDF_PALETTE);
    expect(toPdfPalette("not an object")).toEqual(DEFAULT_PDF_PALETTE);
  });
});

describe("toPdfFonts", () => {
  it("resolves both roles to built-in families", () => {
    expect(toPdfFonts({ display: "Playfair Display", body: "Inter" })).toEqual({
      display: "Times-Roman",
      body: "Helvetica",
    });
  });
});

describe("resolvePdfLayout", () => {
  it("honours the layout a design declares", () => {
    expect(resolvePdfLayout({ pdfLayout: "photo" }, false)).toBe("photo");
    expect(resolvePdfLayout({ pdfLayout: "classic" }, true)).toBe("classic");
  });

  it("ignores an unknown layout and decides from the photos", () => {
    expect(resolvePdfLayout({ pdfLayout: "collage" }, true)).toBe("story");
    expect(resolvePdfLayout(null, true)).toBe("story");
    expect(resolvePdfLayout(null, false)).toBe("classic");
  });
});

describe("monogramFor", () => {
  it("takes one initial per filled name slot", () => {
    expect(monogramFor("Aisha", "Rohan")).toBe("AR");
    expect(monogramFor("Aarav", "")).toBe("A");
    expect(monogramFor("aarav", null)).toBe("A");
    expect(monogramFor("", null)).toBe("•");
  });
});

describe("coverEyebrow", () => {
  it("prefers the design's own line over the category's", () => {
    const category = eventCategoryFor("housewarming");
    expect(coverEyebrow(category, { eyebrow: "Griha Pravesh" })).toBe("Griha Pravesh");
    expect(coverEyebrow(category, { eyebrow: "   " })).toBe(category.content.eyebrow);
    expect(coverEyebrow(category, null)).toBe(category.content.eyebrow);
  });
});
