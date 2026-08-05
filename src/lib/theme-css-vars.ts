export type ThemeColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};

export type ThemeFontPairing = {
  display: string;
  body: string;
  script: string;
};

const FONT_VAR_MAP: Record<string, string> = {
  "Playfair Display": "var(--font-playfair)",
  "Great Vibes": "var(--font-great-vibes)",
  Inter: "var(--font-inter)",
  "Cormorant Garamond": "var(--font-cormorant)",
  "EB Garamond": "var(--font-eb-garamond)",
};

export function fontVarFor(fontName: string) {
  return FONT_VAR_MAP[fontName] ?? "var(--font-inter)";
}

export function buildInviteThemeStyle(
  palette: ThemeColorPalette,
  fonts: ThemeFontPairing,
): React.CSSProperties {
  return {
    "--inv-primary": palette.primary,
    "--inv-secondary": palette.secondary,
    "--inv-accent": palette.accent,
    "--inv-background": palette.background,
    "--inv-foreground": palette.foreground,
    "--inv-font-display": fontVarFor(fonts.display),
    "--inv-font-body": fontVarFor(fonts.body),
    "--inv-font-script": fontVarFor(fonts.script),
    background: palette.background,
    color: palette.foreground,
  } as React.CSSProperties;
}
