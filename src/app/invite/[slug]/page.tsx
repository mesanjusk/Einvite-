import Link from "next/link";
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
import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
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
  const isOwner = Boolean(
    (session?.user && invitation.userId === session.user.id) ||
      (await authorizeInvitationAccess(invitation.id)),
  );
  if (invitation.status !== "PUBLISHED" && !isOwner) notFound();

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
  const showDemoChrome = invitation.isDemo && !isOwner;

  return (
    <div className={showDemoChrome ? "min-h-svh bg-[#16070c]" : undefined}>
      {showDemoChrome && (
        <div className="sticky top-0 z-[70] mx-auto flex h-12 max-w-[430px] items-center gap-2 border-b border-white/10 bg-[#4b0c20]/97 px-2.5 text-white shadow-lg backdrop-blur-xl">
          <Link
            href={`/themes?category=${invitation.eventCategory}`}
            aria-label="Back to templates"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-lg transition hover:bg-white/10"
          >
            ‹
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[12px] leading-none text-white">
              {invitation.theme?.name ?? "Invitation preview"}
            </p>
            <p className="mt-1 truncate text-[8px] font-bold tracking-[0.12em] text-[#e9c982] uppercase">
              {invitation.theme?.isPremium ? "Premium design" : "Included design"}
            </p>
          </div>

          <StartLiveInvitationButton
            fromSlug={invitation.slug}
            className="shrink-0 rounded-full bg-[#e9bd53] px-3.5 py-2 text-[9px] font-extrabold tracking-[0.08em] text-[#4c1425] uppercase shadow-sm transition hover:bg-[#f2ca6b]"
          >
            Edit now
          </StartLiveInvitationButton>
        </div>
      )}

      <div
        className="relative mx-auto max-w-[430px] overflow-x-hidden"
        style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
      >
        <InviteExperience
          invite={inviteData}
          sectionConfig={sectionConfig}
          initialGuestName={guest?.name ?? null}
          guestId={guest?.id ?? null}
          showRemixCta={!isOwner && !invitation.isDemo}
        />
      </div>
    </div>
  );
}
