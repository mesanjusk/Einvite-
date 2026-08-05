import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildInviteThemeStyle } from "@/lib/theme-css-vars";
import { InviteExperience } from "@/components/invite/invite-experience";
import type { InviteData } from "@/components/invite/types";

export const dynamic = "force-dynamic";

async function getInvitation(slug: string) {
  return db.invitation.findUnique({
    where: { slug },
    include: {
      theme: true,
      music: true,
      events: { orderBy: { order: "asc" } },
      familyMembers: { orderBy: { order: "asc" } },
      media: { orderBy: { order: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);
  if (!invitation) return {};

  const title =
    invitation.seoTitle ?? `${invitation.brideName} & ${invitation.groomName} — Wedding`;
  const description =
    invitation.seoDescription ??
    `Join us as we celebrate our wedding.${
      invitation.venueName ? ` ${invitation.venueName}.` : ""
    }`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ogImage = invitation.ogImageUrl ?? `${appUrl}/invite/${slug}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${appUrl}/invite/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = await getInvitation(slug);
  if (!invitation) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === invitation.userId;
  if (invitation.status !== "PUBLISHED" && !isOwner) notFound();

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? "";
  const device = /mobile/i.test(userAgent)
    ? "mobile"
    : /tablet|ipad/i.test(userAgent)
      ? "tablet"
      : "desktop";

  await db.analyticsEvent.create({
    data: {
      invitationId: invitation.id,
      type: "VIEW",
      device,
      referrer: headerList.get("referer"),
      path: `/invite/${slug}`,
    },
  });

  const palette = (invitation.colorPalette ?? invitation.theme?.colorPalette) as
    | { primary: string; secondary: string; accent: string; background: string; foreground: string }
    | undefined;
  const fonts = (invitation.fontPairing ?? invitation.theme?.fontPairing) as
    | { display: string; body: string; script: string }
    | undefined;

  const themeStyle = buildInviteThemeStyle(
    palette ?? {
      primary: "#7a2e2e",
      secondary: "#f3d9d9",
      accent: "#c9942a",
      background: "#faf3ea",
      foreground: "#3a1414",
    },
    fonts ?? { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
  );

  const inviteData: InviteData = {
    id: invitation.id,
    slug: invitation.slug,
    brideName: invitation.brideName,
    bridePhoto: invitation.bridePhoto,
    groomName: invitation.groomName,
    groomPhoto: invitation.groomPhoto,
    weddingDate: invitation.weddingDate,
    venueName: invitation.venueName,
    venueAddress: invitation.venueAddress,
    googleMapsUrl: invitation.googleMapsUrl,
    customMessage: invitation.customMessage,
    musicUrl: invitation.music?.url ?? null,
    copy: invitation.aiGeneratedCopy as InviteData["copy"],
    events: invitation.events,
    familyMembers: invitation.familyMembers,
    media: invitation.media,
  };

  const sectionConfig = invitation.sectionConfig as Array<{
    id: string;
    type: string;
    visible: boolean;
    order: number;
  }>;

  return (
    <div
      className="relative mx-auto max-w-[430px] overflow-x-hidden"
      style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
    >
      <InviteExperience invite={inviteData} sectionConfig={sectionConfig} />
    </div>
  );
}
