import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { buildInvitationPdf } from "@/lib/pdf/build-invitation-pdf";
import type { PdfTemplatePage } from "@/lib/validations/pdf-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const invitation = await db.invitation.findUnique({
    where: { slug },
    include: { pdfTheme: { include: { templates: true } } },
  });
  if (!invitation || invitation.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  let pdfTheme = invitation.pdfTheme;
  if (!pdfTheme) {
    pdfTheme = await db.theme.findFirst({
      where: { type: "PDF" },
      orderBy: { sortOrder: "asc" },
      include: { templates: true },
    });
  }

  const pages = pdfTheme?.templates[0]?.pages as PdfTemplatePage[] | null | undefined;
  if (!pdfTheme || !pages || pages.length === 0) {
    return NextResponse.json(
      { error: "No PDF template is set up yet — ask an admin to design one in Manage PDF Themes." },
      { status: 404 },
    );
  }

  const weddingDateDisplay = invitation.weddingDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const buffer = await buildInvitationPdf(pages, {
    brideName: invitation.brideName,
    groomName: invitation.groomName,
    weddingDateDisplay,
    venueName: invitation.venueName,
    venueAddress: invitation.venueAddress,
    customMessage: invitation.customMessage,
    pdfExtraText: invitation.pdfExtraText,
  });

  const filename = `${invitation.brideName}-${invitation.groomName}-invitation.pdf`
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
