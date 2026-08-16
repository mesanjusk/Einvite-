import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Eye, Users, ClipboardCheck } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [invitations, rsvpCount, viewCount] = await Promise.all([
    db.invitation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { _count: { select: { rsvps: true } } },
    }),
    db.rsvp.count({ where: { invitation: { userId } } }),
    db.analyticsEvent.count({ where: { invitation: { userId }, type: "VIEW" } }),
  ]);

  const stats = [
    { label: "Invitations", value: invitations.length, icon: PlusCircle },
    { label: "Total RSVPs", value: rsvpCount, icon: ClipboardCheck },
    { label: "Total Views", value: viewCount, icon: Eye },
    { label: "Guests Invited", value: "—", icon: Users },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">
            Welcome back{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s what&apos;s happening with your invitations.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invitations/new">
            <PlusCircle />
            Create Invitation
          </Link>
        </Button>
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
              <stat.icon className="text-accent size-8" strokeWidth={1.5} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your invitations</h2>
          <Link
            href="/dashboard/invitations"
            className="text-primary text-sm underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        {invitations.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-12 text-center text-sm">
              You haven&apos;t created an invitation yet.{" "}
              <Link href="/dashboard/invitations/new" className="text-primary underline">
                Start with the AI wizard
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-base">
                      {invitation.brideName} &amp; {invitation.groomName}
                    </CardTitle>
                    <Badge variant={invitation.status === "PUBLISHED" ? "gold" : "secondary"}>
                      {invitation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {invitation._count.rsvps} RSVPs
                  </span>
                  <Link
                    href={`/dashboard/publish/sections?invitationId=${invitation.id}`}
                    className="text-primary text-sm underline underline-offset-4"
                  >
                    Edit
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
