import Link from "next/link";
import type { Metadata } from "next";
import QRCode from "qrcode";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { isVercelConfigured } from "@/lib/vercel";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { PublishButton } from "@/components/dashboard/publish-button";
import { DomainForm } from "@/components/dashboard/domain-form";
import { ClientLinkCard } from "@/components/dashboard/client-link-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Publish — Deploy" };

export default async function DeployPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { invitationId } = await searchParams;

  const invitations = await db.invitation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, brideName: true, groomName: true },
  });

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Create an invitation first, then deploy it here.{" "}
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
    include: {
      deployment: true,
      phoneLink: { select: { phone: true } },
      theme: { select: { name: true } },
      pdfTheme: { select: { name: true } },
    },
  });
  if (!invitation) return null;

  const appUrl = getAppUrl();
  const liveUrl = invitation.deployment?.customDomain
    ? `https://${invitation.deployment.customDomain}`
    : `${appUrl}/invite/${invitation.slug}`;

  const qrDataUrl = await QRCode.toDataURL(liveUrl, {
    margin: 1,
    color: { dark: "#3a1414", light: "#00000000" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status</CardTitle>
            <Badge variant={invitation.status === "PUBLISHED" ? "gold" : "secondary"}>
              {invitation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <PublishButton
            invitationId={invitation.id}
            isPublished={invitation.status === "PUBLISHED"}
          />
          {invitation.status === "PUBLISHED" && (
            <a href={liveUrl} target="_blank" className="text-primary text-sm underline">
              {liveUrl}
            </a>
          )}
        </CardContent>
      </Card>

      {invitation.status === "PUBLISHED" && (
        <Card>
          <CardHeader>
            <CardTitle>Share</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code" width={140} height={140} />
            <div className="flex flex-col gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`You're invited! ${liveUrl}`)}`}
                target="_blank"
                className="text-primary text-sm underline"
              >
                Share on WhatsApp
              </a>
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                className="text-primary text-sm underline"
              >
                Share to Instagram
              </a>
              <a
                href={`/api/pdf/${invitation.slug}?mode=website`}
                className="text-primary text-sm underline"
              >
                Download PDF · same website theme
              </a>
              {invitation.pdfTheme && (
                <a
                  href={`/api/pdf/${invitation.slug}?mode=print`}
                  className="text-primary text-sm underline"
                >
                  Download PDF · separate {invitation.pdfTheme.name} print theme
                </a>
              )}
              <Link
                href={`/dashboard/publish/pdf?invitationId=${invitation.id}`}
                className="text-muted-foreground text-xs underline"
              >
                {invitation.pdfTheme ? "Change separate print theme" : "Optional: choose a separate print-only theme"}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {invitation.status === "PUBLISHED" && (
        <Card className="border-violet-200/70 bg-violet-50/50">
          <CardHeader>
            <CardTitle>Export choices</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border bg-white/70 p-4">
              <p className="font-semibold">Website + matching PDF</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Uses {invitation.theme?.name ?? "the live website design"} for both outputs.
              </p>
              <a
                href={`/api/pdf/${invitation.slug}?mode=website`}
                className="text-primary mt-3 inline-block underline"
              >
                Export matching PDF
              </a>
            </div>
            <div className="rounded-xl border bg-white/70 p-4">
              <p className="font-semibold">Separate print design</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {invitation.pdfTheme
                  ? `Currently ${invitation.pdfTheme.name}`
                  : "Optional. Keep web and PDF visually different only when needed."}
              </p>
              <Link
                href={`/dashboard/publish/pdf?invitationId=${invitation.id}`}
                className="text-primary mt-3 inline-block underline"
              >
                Configure separate PDF
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <ClientLinkCard
        invitationId={invitation.id}
        existingPhone={invitation.phoneLink?.phone ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle>Custom domain</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isVercelConfigured() ? (
            <>
              <DomainForm invitationId={invitation.id} />
              {invitation.deployment?.customDomain && (
                <p className="text-muted-foreground text-sm">
                  Current: {invitation.deployment.customDomain}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Custom domains aren&apos;t configured yet — add{" "}
              <code className="font-mono">VERCEL_API_TOKEN</code> and{" "}
              <code className="font-mono">VERCEL_PROJECT_ID</code> to your environment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
