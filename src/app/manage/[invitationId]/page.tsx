import Link from "next/link";
import type { Metadata } from "next";
import QRCode from "qrcode";

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { SiteLogo } from "@/components/brand/site-logo";
import { GeminiKeyForm } from "@/components/dashboard/gemini-key-form";
import { VideoGeneratorPanel } from "@/components/dashboard/video-generator-panel";
import { PdfThemePicker } from "@/components/dashboard/pdf-theme-picker";
import { PdfExtraTextForm } from "@/components/dashboard/pdf-extra-text-form";
import { AddPhoneCard } from "@/components/guest/add-phone-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Manage Your Invitation",
  robots: { index: false, follow: false },
};

export default async function ManageGuestInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  const invitation = await authorizeInvitationAccess(invitationId);

  if (!invitation) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-display text-2xl">We couldn&apos;t verify access</h1>
        <p className="text-muted-foreground text-sm">
          Open the private edit link we sent you on WhatsApp when you published, or create a new
          invitation to get started.
        </p>
        <Button asChild>
          <Link href="/create">Create an invitation</Link>
        </Button>
      </div>
    );
  }

  const [media, videoTemplates, videos, pdfThemes, pdfTheme, websiteTheme] = await Promise.all([
    db.media.count({ where: { invitationId } }),
    db.videoTemplate.findMany({ orderBy: { sortOrder: "asc" } }),
    db.invitationVideo.findMany({
      where: { invitationId },
      orderBy: { createdAt: "desc" },
      include: { videoTemplate: { select: { name: true } } },
    }),
    db.theme.findMany({ where: { type: "PDF" }, orderBy: { sortOrder: "asc" } }),
    invitation.pdfThemeId
      ? db.theme.findUnique({ where: { id: invitation.pdfThemeId }, select: { slug: true } })
      : null,
    invitation.themeId
      ? db.theme.findUnique({ where: { id: invitation.themeId }, select: { name: true } })
      : null,
  ]);
  const appUrl = getAppUrl();
  const liveUrl = `${appUrl}/invite/${invitation.slug}`;
  const qrDataUrl =
    invitation.status === "PUBLISHED"
      ? await QRCode.toDataURL(liveUrl, { margin: 1, color: { dark: "#3a1414", light: "#00000000" } })
      : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="inline-block">
        <SiteLogo size="md" />
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">
            {invitation.brideName || "Your"} &amp; {invitation.groomName || "invitation"}
          </h1>
          <p className="text-muted-foreground text-sm">Manage your invitation, photos, and details.</p>
        </div>
        <Badge variant={invitation.status === "PUBLISHED" ? "gold" : "secondary"}>
          {invitation.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">{media} photo(s) in your gallery</p>
          <Button asChild>
            <Link href={`/create/${invitation.id}/edit`}>Edit invitation</Link>
          </Button>
        </CardContent>
      </Card>

      {invitation.status === "PUBLISHED" && !invitation.phoneLink && (
        <AddPhoneCard invitationId={invitation.id} />
      )}

      {invitation.status === "PUBLISHED" ? (
        <Card>
          <CardHeader>
            <CardTitle>Share</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <a href={liveUrl} target="_blank" className="text-primary text-sm underline">
              {liveUrl}
            </a>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR code" width={140} height={140} />
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`You're invited! ${liveUrl}`)}`}
              target="_blank"
              className="text-primary text-sm underline"
            >
              Share on WhatsApp
            </a>
            <a href={`/api/pdf/${invitation.slug}`} className="text-primary text-sm underline">
              Download PDF
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            This invitation isn&apos;t published yet. Finish the wizard to verify your WhatsApp
            number and go live.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>PDF</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <p className="mb-3 text-sm font-medium">PDF theme</p>
            <PdfThemePicker
              invitationId={invitation.id}
              themes={pdfThemes.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: t.name,
                description: t.description,
                colorPalette: t.colorPalette as { primary: string; accent: string; background: string },
              }))}
              currentSlug={pdfTheme?.slug ?? null}
              previewSlug={invitation.status === "PUBLISHED" ? invitation.slug : null}
              websiteThemeName={websiteTheme?.name ?? null}
            />
          </div>
          <PdfExtraTextForm invitationId={invitation.id} initialText={invitation.pdfExtraText ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video teaser</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <GeminiKeyForm invitationId={invitation.id} hasKey={Boolean(invitation.geminiApiKey)} />
          <VideoGeneratorPanel
            invitationId={invitation.id}
            templates={videoTemplates.map((t) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              description: t.description,
              aspectRatio: t.aspectRatio,
              durationSeconds: t.durationSeconds,
            }))}
            currentTemplateId={invitation.videoTemplateId}
            jobs={videos}
          />
        </CardContent>
      </Card>
    </div>
  );
}
