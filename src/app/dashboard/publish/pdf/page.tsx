import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { PdfThemePicker } from "@/components/dashboard/pdf-theme-picker";
import { PdfExtraTextForm } from "@/components/dashboard/pdf-extra-text-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Publish — PDF" };

export default async function PublishPdfPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { invitationId } = await searchParams;

  const [invitations, pdfThemes] = await Promise.all([
    db.invitation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, brideName: true, groomName: true },
    }),
    db.theme.findMany({ where: { type: "PDF" }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Create an invitation first to generate a PDF.{" "}
          <Link href="/dashboard/invitations/new" className="text-primary underline">
            Create one now
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const selectedId = invitations.some((inv) => inv.id === invitationId)
    ? invitationId!
    : invitations[0].id;
  const invitation = await db.invitation.findUnique({
    where: { id: selectedId },
    include: { pdfTheme: true },
  });
  if (!invitation) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PDF theme</CardTitle>
        </CardHeader>
        <CardContent>
          <PdfThemePicker
            invitationId={invitation.id}
            themes={pdfThemes.map((t) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              colorPalette: t.colorPalette as { primary: string; accent: string; background: string },
            }))}
            currentSlug={invitation.pdfTheme?.slug ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extra PDF info</CardTitle>
        </CardHeader>
        <CardContent>
          <PdfExtraTextForm invitationId={invitation.id} initialText={invitation.pdfExtraText ?? ""} />
        </CardContent>
      </Card>

      {invitation.status === "PUBLISHED" ? (
        <Card>
          <CardHeader>
            <CardTitle>Download</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`/api/pdf/${invitation.slug}`}
              className="text-primary text-sm underline"
            >
              Download PDF
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Publish this invitation from the Deploy &amp; Share tab to enable PDF download.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
