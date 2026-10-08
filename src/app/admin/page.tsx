import Link from "next/link";
import type { Metadata } from "next";
import { Users, LayoutTemplate, ClipboardCheck, CreditCard } from "lucide-react";

import { db } from "@/lib/db";
import { isAdminGroup } from "@/lib/user-groups";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataResetCard } from "@/components/admin/data-reset-card";
import { adminNav } from "@/config/dashboard-nav";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const [userCount, invitationCount, rsvpCount, subscriptions, recentUsers, publishedThemeCount] =
    await Promise.all([
      db.user.count(),
      db.invitation.count(),
      db.rsvp.count(),
      db.subscription.groupBy({ by: ["plan"], _count: { _all: true } }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          userGroup: true,
          createdAt: true,
        },
      }),
      db.theme.count({ where: { type: "WEBSITE", isPublished: true } }),
    ]);
  const paidCount = subscriptions
    .filter((s) => s.plan !== "FREE")
    .reduce((sum, s) => sum + s._count._all, 0);

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, href: "/admin/users" },
    {
      label: "Invitations Created",
      value: invitationCount,
      icon: LayoutTemplate,
      href: "/admin/invitations",
    },
    { label: "Total RSVPs", value: rsvpCount, icon: ClipboardCheck },
    { label: "Paid Subscriptions", value: paidCount, icon: CreditCard },
    {
      label: "Published Themes",
      value: publishedThemeCount,
      icon: LayoutTemplate,
      href: "/admin/library/themes",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Admin Studio" meta="Design, manage, and grow your invitation workspace" />

      <section aria-label="Admin workspace tools" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-[#e8e5eb] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9a3c7] hover:shadow-md"
            >
              <div className="mb-5 flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#f2edf5] text-[#705681]">
                  <Icon className="size-5" />
                </span>
                <span className="text-xs font-medium text-[#8b8791] transition group-hover:text-[#705681]">Open →</span>
              </div>
              <h2 className="font-semibold text-[#28242d]">{item.title}</h2>
              <p className="mt-1 text-sm text-[#77727d]">
                {item.href === "/admin"
                  ? "Overview and studio activity"
                  : item.title === "Content Library"
                    ? "Create, edit, and publish website and PDF themes"
                    : item.title === "Reports"
                      ? "Explore orders, performance, and business reports"
                      : item.title === "Instagram"
                        ? "Manage connected Instagram tools and content"
                        : item.title === "Users"
                          ? "Manage accounts and access"
                          : "Review and manage invitation orders"}
              </p>
            </Link>
          );
        })}
      </section>

      {publishedThemeCount === 0 && (
        <section className="overflow-hidden rounded-3xl border border-[#e8e5eb] bg-white shadow-sm">
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#8a6d9d] uppercase">
                Theme Studio
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#28242d]">
                Start with your first invitation design
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77727d]">
                Build a website theme, preview it, then publish it when it is ready for customers.
                Private starter designs will not appear in the public gallery.
              </p>
            </div>
            <Button asChild className="rounded-xl">
              <Link href="/admin/library/themes/new">
                Create first theme
              </Link>
            </Button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={stat.href ? "hover:border-primary transition-colors" : undefined}
          >
            <CardContent className="flex items-center justify-between">
              {stat.href ? (
                <Link href={stat.href}>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    {stat.label}
                  </p>
                  <p className="font-display text-2xl">{stat.value}</p>
                </Link>
              ) : (
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    {stat.label}
                  </p>
                  <p className="font-display text-2xl">{stat.value}</p>
                </div>
              )}
              <stat.icon className="text-accent size-7" strokeWidth={1.5} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="py-0">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="text-muted-foreground px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {/* The group is what grants access, so it is what the
                        column shows. An account with none falls back to the
                        old role field, which still grants admin until every
                        account has been moved across. */}
                    <Badge
                      variant={isAdminGroup(user.userGroup) ? "gold" : "secondary"}
                    >
                      {user.userGroup ?? user.role}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Last on the page on purpose: nobody should meet the reset button
          before the numbers it would zero. */}
      <DataResetCard />
    </div>
  );
}
