import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  renderInvitationPdf,
  type PdfInvitation,
  type PdfThemeRow,
} from "@/lib/pdf/invitation-pdf";
import { celebrantNames, eventCategoryFor } from "@/lib/event-categories";

// Fetching and embedding photos needs Node's runtime, not the edge one.
export const runtime = "nodejs";

const THEME_SELECT = {
  name: true,
  colorPalette: true,
  fontPairing: true,
  decorAssets: true,
  content: true,
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const invitation = await db.invitation.findUnique({
    where: { slug },
    include: {
      theme: { select: THEME_SELECT },
      pdfTheme: { select: { ...THEME_SELECT, templates: { select: { pages: true } } } },
      events: { orderBy: { order: "asc" } },
      familyMembers: { orderBy: { order: "asc" } },
      media: { orderBy: { order: "asc" } },
    },
  });
  if (!invitation || invitation.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  // `?design=<theme-slug>` prints the same invitation in another design from
  // the catalogue, so the couple can compare before saving a choice. It only
  // changes how this one download looks — nothing is written.
  const requestedDesign = new URL(request.url).searchParams.get("design");
  let designOverride: (PdfThemeRow & { templates: { pages: unknown }[] }) | null = null;
  if (requestedDesign) {
    const theme = await db.theme.findUnique({
      where: { slug: requestedDesign },
      select: { ...THEME_SELECT, templates: { select: { pages: true } } },
    });
    if (!theme) {
      return NextResponse.json({ error: "Unknown design." }, { status: 404 });
    }
    designOverride = theme;
  }

  const data: PdfInvitation = {
    ...invitation,
    // A design picked for this download stands in for the saved PDF theme,
    // including its hand-drawn template if it has one.
    pdfTheme: designOverride ?? invitation.pdfTheme,
    media: invitation.media.map((item) => ({ url: item.url, type: item.type })),
    familyMembers: invitation.familyMembers.map((member) => ({
      side: member.side,
      relation: member.relation,
      name: member.name,
    })),
  };

  let buffer: Buffer;
  try {
    buffer = await renderInvitationPdf(data);
  } catch (error) {
    console.error("PDF render failed", error);
    return NextResponse.json(
      { error: "Could not generate the PDF. Please try again." },
      { status: 500 },
    );
  }

  const category = eventCategoryFor(invitation.eventCategory);
  const filename =
    `${celebrantNames(category, invitation.brideName, invitation.groomName)}-${category.slug}`
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename || "invitation"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
