import type { Metadata } from "next";
import { Users, LayoutTemplate, ClipboardCheck, CreditCard } from "lucide-react";

import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const [userCount, invitationCount, rsvpCount, subscriptions, recentUsers] = await Promise.all([
    db.user.count(),
    db.invitation.count(),
    db.rsvp.count(),
    db.subscription.groupBy({ by: ["plan"], _count: { _all: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const paidCount = subscriptions
    .filter((s) => s.plan !== "FREE")
    .reduce((sum, s) => sum + s._count._all, 0);

  const stats = [
    { label: "Total Users", value: userCount, icon: Users },
    { label: "Invitations Created", value: invitationCount, icon: LayoutTemplate },
    { label: "Total RSVPs", value: rsvpCount, icon: ClipboardCheck },
    { label: "Paid Subscriptions", value: paidCount, icon: CreditCard },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Platform-wide overview.</p>
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

      <Card className="py-0">
        <CardContent className="p-0">
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
                    <Badge variant={user.role === "ADMIN" ? "gold" : "secondary"}>
                      {user.role}
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
    </div>
  );
}
