import Link from "next/link";
import type { Metadata } from "next";
import { Eye, Share2, ClipboardCheck, MapPin } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Analytics" };

const EVENT_ICONS = {
  VIEW: Eye,
  SHARE: Share2,
  RSVP_SUBMIT: ClipboardCheck,
  CLICK_MAPS: MapPin,
} as const;

export default async function AnalyticsPage({
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
          Publish an invitation to start seeing analytics.{" "}
          <Link href="/dashboard/invitations/new" className="text-primary underline">
            Create one now
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const selectedId = invitationId ?? invitations[0].id;

  const [byType, byDevice, recent] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { invitationId: selectedId },
      _count: { _all: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["device"],
      where: { invitationId: selectedId, device: { not: null } },
      _count: { _all: true },
    }),
    db.analyticsEvent.findMany({
      where: { invitationId: selectedId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const countFor = (type: string) =>
    byType.find((entry) => entry.type === type)?._count._all ?? 0;

  const stats = [
    { label: "Views", value: countFor("VIEW"), icon: EVENT_ICONS.VIEW },
    { label: "Shares", value: countFor("SHARE"), icon: EVENT_ICONS.SHARE },
    { label: "RSVPs Submitted", value: countFor("RSVP_SUBMIT"), icon: EVENT_ICONS.RSVP_SUBMIT },
    { label: "Map Clicks", value: countFor("CLICK_MAPS"), icon: EVENT_ICONS.CLICK_MAPS },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Real traffic recorded from your published invitation page.
          </p>
        </div>
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  {stat.label}
                </p>
                <p className="font-display text-2xl">{stat.value}</p>
              </div>
              <stat.icon className="text-accent size-7" strokeWidth={1.5} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h3 className="mb-3 text-sm font-semibold">By device</h3>
            {byDevice.length === 0 ? (
              <p className="text-muted-foreground text-sm">No device data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {byDevice.map((entry) => (
                  <li key={entry.device} className="flex justify-between text-sm">
                    <span className="capitalize">{entry.device}</span>
                    <span className="text-muted-foreground">{entry._count._all}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="mb-3 text-sm font-semibold">Recent activity</h3>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {recent.map((event) => (
                  <li key={event.id} className="flex justify-between">
                    <span>{event.type.replace("_", " ")}</span>
                    <span className="text-muted-foreground text-xs">
                      {event.createdAt.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-xs">
        Country-level geolocation and click-heatmaps aren&apos;t wired up yet — they need a
        geo-IP service and client-side event capture beyond this build&apos;s scope. Views,
        shares, RSVP submits, device type, and map/registry/Instagram clicks are all real,
        recorded server-side.
      </p>
    </div>
  );
}
