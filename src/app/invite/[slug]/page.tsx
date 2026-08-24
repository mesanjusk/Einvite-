import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { getAppUrl } from "@/lib/app-url";
import {
  getInvitationBySlug,
  getGuestByToken,
  toInviteRenderData,
} from "@/lib/get-invite-data";
import { InviteExperience } from "@/components/invite/invite-experience";
import { InvitationPaused } from "@/components/invite/invitation-paused";
import { resolveInvitationVisibility } from "@/lib/instagram-invitation-visibility";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug);
  if (!invitation) return {};

  const title =
    invitation.seoTitle ??
    `${invitation.brideName} & ${invitation.groomName} — Wedding`;
  const description =
    invitation.seoDescription ??
    `Join us as we celebrate our wedding.${
      invitation.venueName ? ` ${invitation.venueName}.` : ""
    }`;
  const appUrl = getAppUrl();
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  const invitation = await getInvitationBySlug(slug);
  if (!invitation) notFound();

  const session = await auth();
  // Who this invitation belongs to. An account is one way; the guest flow's
  // couples own theirs through a cookie instead, and they must count too —
  // otherwise they can't look at their own unpublished invitation, and get
  // offered a copy of it once it is published.
  const isOwner = Boolean(
    (session?.user && invitation.userId === session.user.id) ||
      (await authorizeInvitationAccess(invitation.id)),
  );
  if (invitation.status !== "PUBLISHED" && !isOwner) notFound();

  // An invitation claimed through Instagram circulates while its owner
  // follows the account. Building it was never gated — this is, because
  // sending it to a hundred relatives is the part the offer is paid for
  // with. Everything is still here; the screen below says so and offers the
  // one thing that brings it back.
  const visibility = await resolveInvitationVisibility(invitation.id);
  if (visibility.decision === "PAUSED") {
    return (
      <InvitationPaused
        slug={slug}
        message={visibility.message}
        profileUrl={visibility.profileUrl}
        handle={visibility.handle}
      />
    );
  }

  const guest = to ? await getGuestByToken(invitation.id, to) : null;

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

  const { inviteData, themeStyle, sectionConfig } = toInviteRenderData(invitation);

  return (
    <div
      className="relative mx-auto max-w-[430px] overflow-x-hidden"
      style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
    >
      <InviteExperience
        invite={inviteData}
        sectionConfig={sectionConfig}
        initialGuestName={guest?.name ?? null}
        guestId={guest?.id ?? null}
        // Anyone who was sent this invitation — not the couple who made it —
        // can start their own on the same design, and edit it on the page
        // rather than in a form.
        showRemixCta={!isOwner}
      />
    </div>
  );
}
