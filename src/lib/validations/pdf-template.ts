import { z } from "zod";

// Fields a placeholder can bind to — pulled from the invitation's own
// captured data at render time, or STATIC for admin-authored fixed text
// (e.g. decorative headings that don't vary per invitation).
export const PDF_PLACEHOLDER_FIELDS = [
  "brideName",
  "groomName",
  "coupleNames",
  "weddingDate",
  "venueName",
  "venueAddress",
  "customMessage",
  "pdfExtraText",
  "STATIC",
] as const;

export const PDF_PAGE_SIZES = {
  A4: { width: 595, height: 842 },
  LETTER: { width: 612, height: 792 },
} as const;

export const pdfPlaceholderSchema = z.object({
  id: z.string(),
  field: z.enum(PDF_PLACEHOLDER_FIELDS),
  staticText: z.string().optional(), // used when field === "STATIC"
  // Position/size as a percentage (0-100) of the page — resolution-
  // independent of the exact page size, and matches how the drag editor
  // reports coordinates.
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  fontSize: z.number().min(4).max(200).default(16),
  fontFamily: z.string().default("Helvetica"),
  color: z.string().default("#1a1a1a"),
  align: z.enum(["left", "center", "right"]).default("left"),
  bold: z.boolean().default(false),
});

export type PdfPlaceholder = z.infer<typeof pdfPlaceholderSchema>;

export const pdfTemplatePageSchema = z.object({
  id: z.string(),
  backgroundImageUrl: z.string().optional(),
  backgroundColor: z.string().default("#ffffff"),
  size: z.enum(["A4", "LETTER"]).default("A4"),
  placeholders: z.array(pdfPlaceholderSchema).default([]),
});

export type PdfTemplatePage = z.infer<typeof pdfTemplatePageSchema>;

export const pdfTemplatePagesSchema = z.array(pdfTemplatePageSchema).min(1, "Add at least one page");

export function newPdfPage(): PdfTemplatePage {
  return {
    id: crypto.randomUUID(),
    backgroundColor: "#ffffff",
    size: "A4",
    placeholders: [],
  };
}

export function newPdfPlaceholder(field: PdfPlaceholder["field"] = "STATIC"): PdfPlaceholder {
  return {
    id: crypto.randomUUID(),
    field,
    staticText: field === "STATIC" ? "Text" : undefined,
    x: 10,
    y: 10,
    width: 80,
    fontSize: 16,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    align: "left",
    bold: false,
  };
}
