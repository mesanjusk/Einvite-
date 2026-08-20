import type { EventCategory } from "@/lib/event-categories";

/**
 * Everything the themed PDF renderer needs to draw a design, resolved from
 * a Theme row (or the invitation's own palette override) before rendering.
 */

export type PdfPalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};

export type PdfFonts = {
  /** Family for headings — a built-in PDF family, not the web font name. */
  display: string;
  body: string;
};

/** Which of the three print layouts a design uses. */
export const PDF_LAYOUTS = ["classic", "photo", "story"] as const;
export type PdfLayout = (typeof PDF_LAYOUTS)[number];

export type PdfDesign = {
  name: string;
  palette: PdfPalette;
  fonts: PdfFonts;
  layout: PdfLayout;
};

export const DEFAULT_PDF_PALETTE: PdfPalette = {
  primary: "#7a2e2e",
  secondary: "#f3d9d9",
  accent: "#c9942a",
  background: "#faf3ea",
  foreground: "#3a1414",
};

/**
 * @react-pdf/renderer ships only the standard PDF families, and registering
 * a web font means fetching it at render time — a network round trip that
 * can fail and take the download with it. So a theme's font pairing is
 * mapped onto the built-ins instead: serif designs print in Times, sans
 * designs in Helvetica. The design still reads as itself; the exact
 * typeface is the one thing print gives up.
 */
const SANS_FONTS = [
  "inter",
  "helvetica",
  "arial",
  "roboto",
  "montserrat",
  "poppins",
  "lato",
  "open sans",
  "work sans",
  "dm sans",
  "nunito",
];

export function pdfFontFamily(fontName: string | null | undefined): string {
  const name = (fontName ?? "").toLowerCase().trim();
  if (!name) return "Times-Roman";
  return SANS_FONTS.some((sans) => name.includes(sans)) ? "Helvetica" : "Times-Roman";
}

function isHexColor(value: unknown): value is string {
  return (
    typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
  );
}

/** Falls back per-key, so one bad colour in the database can't blank a page. */
export function toPdfPalette(value: unknown): PdfPalette {
  const raw = (value ?? {}) as Partial<Record<keyof PdfPalette, unknown>>;
  const pick = (key: keyof PdfPalette) =>
    isHexColor(raw[key]) ? raw[key].trim() : DEFAULT_PDF_PALETTE[key];
  return {
    primary: pick("primary"),
    secondary: pick("secondary"),
    accent: pick("accent"),
    background: pick("background"),
    foreground: pick("foreground"),
  };
}

export function toPdfFonts(value: unknown): PdfFonts {
  const raw = (value ?? {}) as { display?: unknown; body?: unknown };
  return {
    display: pdfFontFamily(typeof raw.display === "string" ? raw.display : null),
    body: pdfFontFamily(typeof raw.body === "string" ? raw.body : null),
  };
}

export function isPdfLayout(value: unknown): value is PdfLayout {
  return (
    typeof value === "string" && (PDF_LAYOUTS as readonly string[]).includes(value)
  );
}

/**
 * A theme states its print layout in `decorAssets.pdfLayout`. Website
 * designs don't carry one, so they print as "story" when there are photos
 * to show and "classic" when there aren't — which is what the couple would
 * pick themselves.
 */
export function resolvePdfLayout(decorAssets: unknown, hasPhotos: boolean): PdfLayout {
  const declared = (decorAssets as { pdfLayout?: unknown } | null)?.pdfLayout;
  if (isPdfLayout(declared)) return declared;
  return hasPhotos ? "story" : "classic";
}

/** The monogram drawn on a classic cover: one initial per filled name slot. */
export function monogramFor(
  primary: string,
  secondary: string | null | undefined,
): string {
  const initials = [primary, secondary ?? ""]
    .map((name) => name.trim().charAt(0).toUpperCase())
    .filter(Boolean);
  return initials.join("") || "•";
}

/** Cover title for a category, e.g. "Wedding Invitation". */
export function coverEyebrow(category: EventCategory, themeContent: unknown): string {
  const declared = (themeContent as { eyebrow?: unknown } | null)?.eyebrow;
  return typeof declared === "string" && declared.trim()
    ? declared.trim()
    : category.content.eyebrow;
}
