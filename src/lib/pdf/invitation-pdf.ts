import { buildInvitationPdf } from "./build-invitation-pdf";
import { buildThemePdf, type ThemePdfData } from "./build-theme-pdf";
import { fetchPdfImage, fetchPdfImages } from "./images";
import {
  coverEyebrow,
  resolvePdfLayout,
  toPdfFonts,
  toPdfPalette,
  type PdfDesign,
} from "./theme-pdf-design";
import { celebrantNames, eventCategoryFor, fillContent } from "@/lib/event-categories";
import type { PdfTemplatePage } from "@/lib/validations/pdf-template";

/**
 * Turns an invitation into a PDF, by whichever of the two routes applies:
 *
 *  - an admin hand-drew a template for the chosen design (background images
 *    with placeholders positioned on them) — that layout wins, and the
 *    invitation's data is poured into its placeholders;
 *  - otherwise the themed renderer draws the invitation from the design's
 *    palette, fonts, and the couple's own photos.
 *
 * The second route is what makes every theme in the catalogue printable the
 * moment it's picked, with no admin setup at all.
 */

/** The shape both routes need — an invitation with its design relations loaded. */
export type PdfInvitation = {
  eventCategory: string;
  brideName: string;
  bridePhoto: string | null;
  groomName: string;
  groomPhoto: string | null;
  weddingDate: Date;
  venueName: string | null;
  venueAddress: string | null;
  customMessage: string | null;
  pdfExtraText: string | null;
  colorPalette: unknown;
  fontPairing: unknown;
  aiGeneratedCopy: unknown;
  theme: PdfThemeRow | null;
  pdfTheme: (PdfThemeRow & { templates: { pages: unknown }[] }) | null;
  events: {
    name: string;
    date: Date;
    time: string | null;
    venueName: string | null;
    address: string | null;
    dressCode: string | null;
    tagline: string | null;
  }[];
  familyMembers: { side: "BRIDE" | "GROOM"; relation: string; name: string }[];
  media: { url: string; type: "IMAGE" | "VIDEO" }[];
};

export type PdfThemeRow = {
  name: string;
  colorPalette: unknown;
  fontPairing: unknown;
  decorAssets: unknown;
  content: unknown;
};

/** How many gallery photos a PDF ever embeds — a cover plus one page's worth. */
const MAX_PDF_PHOTOS = 7;

export function formatPdfDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function stringField(source: unknown, key: string): string | null {
  const value = (source as Record<string, unknown> | null)?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Resolves the design to print with: the invitation's PDF theme when it has
 * one, otherwise its website theme, so "Download PDF" always matches what
 * the guests see online.
 */
export function resolvePdfDesign(
  invitation: PdfInvitation,
  hasPhotos: boolean,
): PdfDesign {
  const theme = invitation.pdfTheme ?? invitation.theme;
  return {
    name: theme?.name ?? "Classic",
    // A colourway or manual override on the invitation beats the theme's own
    // palette — the same precedence the website render uses.
    palette: toPdfPalette(invitation.colorPalette ?? theme?.colorPalette),
    fonts: toPdfFonts(invitation.fontPairing ?? theme?.fontPairing),
    layout: resolvePdfLayout(theme?.decorAssets, hasPhotos),
  };
}

/**
 * Photos for the PDF, most representative first: the gallery leads (it's
 * what the website's hero and gallery show), then the two portraits.
 */
async function resolvePhotos(invitation: PdfInvitation): Promise<string[]> {
  const candidates = [
    ...invitation.media.filter((item) => item.type === "IMAGE").map((item) => item.url),
    invitation.bridePhoto,
    invitation.groomPhoto,
  ].slice(0, MAX_PDF_PHOTOS);

  return fetchPdfImages(candidates);
}

export function buildThemePdfData(
  invitation: PdfInvitation,
  photos: string[],
): ThemePdfData {
  const category = eventCategoryFor(invitation.eventCategory);
  const themeContent = (invitation.pdfTheme ?? invitation.theme)?.content;
  const aiCopy = invitation.aiGeneratedCopy;

  const primaryName = invitation.brideName.trim();
  const secondaryName = invitation.groomName.trim() || null;
  const names = celebrantNames(category, primaryName, secondaryName);
  const dateDisplay = formatPdfDate(invitation.weddingDate);

  const fill = (template: string) =>
    fillContent(template, { names, date: dateDisplay, venue: invitation.venueName });

  // The couple's own words first, then whatever was generated for the site,
  // then the design's copy, then the category's. The PDF never prints an
  // empty invitation.
  const letter =
    (invitation.customMessage?.trim() || null) ??
    stringField(aiCopy, "invitationLetter") ??
    fill(
      stringField(themeContent, "invitationLetter") ??
        category.content.invitationLetter,
    );

  const headline =
    stringField(aiCopy, "heroHeadline") ??
    stringField(themeContent, "heroHeadline") ??
    category.content.heroHeadline;

  const thankYou = stringField(themeContent, "thankYou") ?? category.content.thankYou;

  return {
    eyebrow: coverEyebrow(category, themeContent),
    headline,
    names,
    primaryName,
    secondaryName,
    dateDisplay,
    weekdayDisplay: formatWeekday(invitation.weddingDate),
    venueName: invitation.venueName,
    venueAddress: invitation.venueAddress,
    letter,
    extraText: invitation.pdfExtraText?.trim() || null,
    thankYou,
    familyLabels: category.familyLabels,
    events: invitation.events.map((event) => ({
      name: event.name,
      dateDisplay: formatPdfDate(event.date),
      time: event.time,
      venueName: event.venueName,
      address: event.address,
      dressCode: event.dressCode,
      tagline: event.tagline,
    })),
    family: invitation.familyMembers,
    photos,
  };
}

/**
 * Inlines each page's background image, dropping the ones that can't be
 * fetched or decoded — a template whose background 404s still prints its
 * text instead of failing the whole download.
 */
async function inlineTemplateBackgrounds(
  pages: PdfTemplatePage[],
): Promise<PdfTemplatePage[]> {
  return Promise.all(
    pages.map(async (page) => {
      if (!page.backgroundImageUrl) return page;
      const inlined = await fetchPdfImage(page.backgroundImageUrl);
      return { ...page, backgroundImageUrl: inlined ?? undefined };
    }),
  );
}

export async function renderInvitationPdf(invitation: PdfInvitation): Promise<Buffer> {
  const category = eventCategoryFor(invitation.eventCategory);

  // An admin-designed template is a deliberate choice — honour it over the
  // generated layout whenever the chosen PDF theme has one.
  const templatePages = invitation.pdfTheme?.templates?.[0]?.pages as
    PdfTemplatePage[] | null | undefined;
  if (templatePages && templatePages.length > 0) {
    const pages = await inlineTemplateBackgrounds(templatePages);
    return buildInvitationPdf(pages, {
      brideName: invitation.brideName,
      groomName: invitation.groomName,
      coupleNames: celebrantNames(category, invitation.brideName, invitation.groomName),
      weddingDateDisplay: formatPdfDate(invitation.weddingDate),
      venueName: invitation.venueName,
      venueAddress: invitation.venueAddress,
      customMessage: invitation.customMessage,
      pdfExtraText: invitation.pdfExtraText,
    });
  }

  const photos = await resolvePhotos(invitation);
  const design = resolvePdfDesign(invitation, photos.length > 0);
  return buildThemePdf(design, buildThemePdfData(invitation, photos), category.joiner);
}
