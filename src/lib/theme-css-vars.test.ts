import { describe, expect, it } from "vitest";

import { buildInviteThemeStyle, fontVarFor } from "./theme-css-vars";

describe("fontVarFor", () => {
  it("maps known font names to their CSS variable", () => {
    expect(fontVarFor("Playfair Display")).toBe("var(--font-playfair)");
    expect(fontVarFor("Great Vibes")).toBe("var(--font-great-vibes)");
    expect(fontVarFor("Cormorant Garamond")).toBe("var(--font-cormorant)");
  });

  it("falls back to Inter for an unknown font", () => {
    expect(fontVarFor("Comic Sans MS")).toBe("var(--font-inter)");
  });
});

describe("buildInviteThemeStyle", () => {
  const palette = {
    primary: "#7a2e2e",
    secondary: "#f3d9d9",
    accent: "#c9942a",
    background: "#faf3ea",
    foreground: "#3a1414",
  };
  const fonts = {
    display: "Playfair Display",
    body: "Cormorant Garamond",
    script: "Great Vibes",
  };

  it("maps every palette color to its --inv- custom property", () => {
    const style = buildInviteThemeStyle(palette, fonts) as Record<string, string>;
    expect(style["--inv-primary"]).toBe(palette.primary);
    expect(style["--inv-secondary"]).toBe(palette.secondary);
    expect(style["--inv-accent"]).toBe(palette.accent);
    expect(style["--inv-background"]).toBe(palette.background);
    expect(style["--inv-foreground"]).toBe(palette.foreground);
  });

  it("sets background/color to the palette's background/foreground", () => {
    const style = buildInviteThemeStyle(palette, fonts) as Record<string, string>;
    expect(style.background).toBe(palette.background);
    expect(style.color).toBe(palette.foreground);
  });

  it("resolves the font pairing to CSS variables", () => {
    const style = buildInviteThemeStyle(palette, fonts) as Record<string, string>;
    expect(style["--inv-font-display"]).toBe("var(--font-playfair)");
    expect(style["--inv-font-body"]).toBe("var(--font-cormorant)");
    expect(style["--inv-font-script"]).toBe("var(--font-great-vibes)");
  });
});
