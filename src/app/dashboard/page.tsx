import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Eye, Users, ClipboardCheck, Sparkles, ArrowUpRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { IconButton } from "@/components/ui/icon-button";
import { PageHeader } from "@/components/dashboard/page-header";
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
    { label: "Invites", value: invitations.length, icon: PlusCircle, tone: "from-[#8f1537] to-[#c52b60]" },
    { label: "RSVPs", value: rsvpCount, icon: ClipboardCheck, tone: "from-[#e27b1d] to-[#f2b949]" },
    { label: "Views", value: viewCount, icon: Eye, tone: "from-[#0f766e] to-[#22a38b]" },
    { label: "Guests", value: "—", icon: Users, tone: "from-[#7c2d92] to-[#bd3f8b]" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome back${session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}`}
      >
        <IconButton label="Create invitation" variant="default" asChild>
          <Link href="/dashboard/invitations/new">
            <PlusCircle className="size-4" />
          </Link>
        </IconButton>
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden p-0">
            <CardContent className="relative flex items-center justify-between px-4 py-5 sm:px-5">
              <div className="relative z-10">
                <p className="text-[9px] font-black tracking-[0.14em] text-[#8a645b] uppercase">
                  {stat.label}
                </p>
                <p className="font-display mt-1 text-3xl text-[#5f2134]">{stat.value}</p>
              </div>
              <div className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${stat.tone} text-white shadow-lg`}>
                <stat.icon className="size-5" strokeWidth={1.8} />
              </div>
              <div className="pointer-events-none absolute -bottom-10 -right-8 size-24 rounded-full bg-[#f7c96b]/10" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="font-script text-3xl text-[#d17f1f]">Your celebrations</p>
            <h2 className="font-display text-2xl text-[#632238]">Invitations</h2>
          </div>
          <Link
            href="/dashboard/invitations"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[10px] font-black tracking-wide text-[#8f1537] uppercase shadow-sm"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {invitations.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="relative py-14 text-center">
              <div className="wedding-gold mx-auto grid size-16 place-items-center rounded-full shadow-lg">
                <Sparkles className="size-7" />
              </div>
              <p className="font-display mt-5 text-2xl text-[#642238]">Create your first invitation</p>
              <Link
                href="/dashboard/invitations/new"
                className="wedding-cta mt-5 inline-flex rounded-full px-6 py-3 text-[10px] font-black uppercase"
              >
                Start creating
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation, index) => (
              <Card key={invitation.id} className="group overflow-hidden">
                <div
                  className={[
                    "h-2 bg-gradient-to-r",
                    index % 3 === 0
                      ? "from-[#8f1537] via-[#c42b60] to-[#ed8a2b]"
                      : index % 3 === 1
                        ? "from-[#0f766e] via-[#22a38b] to-[#f0b43e]"
                        : "from-[#7c2d92] via-[#bd3f8b] to-[#f08b3d]",
                  ].join(" ")}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-xl text-[#5d2134]">
                      {invitation.brideName} &amp; {invitation.groomName}
                    </CardTitle>
                    <Badge variant={invitation.status === "PUBLISHED" ? "gold" : "secondary"}>
                      {invitation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between pb-1">
                  <span className="text-[10px] font-bold tracking-wide text-[#8b6b62] uppercase">
                    {invitation._count.rsvps} RSVPs
                  </span>
                  <Link
                    href={`/dashboard/publish/sections?invitationId=${invitation.id}`}
                    className="inline-flex items-center gap-1 text-xs font-black text-[#a21d4c]"
                  >
                    Edit <ArrowUpRight className="size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
