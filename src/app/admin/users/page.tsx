import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteUserAction } from "@/lib/actions/admin";
import { UserRoleToggle } from "@/components/admin/user-role-toggle";
import { UserActiveToggle } from "@/components/admin/user-active-toggle";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manage Users" };

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { subscription: true, _count: { select: { invitations: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" meta={`${users.length} accounts`} />

      <Card className="py-0">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Invitations</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === session?.user.id;
                const isActive = user.isActive !== false;
                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="text-muted-foreground px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{user.subscription?.plan ?? "FREE"}</Badge>
                    </td>
                    <td className="px-4 py-3">{user._count.invitations}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "ADMIN" ? "gold" : "outline"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isActive ? "secondary" : "destructive"}>
                        {isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <UserRoleToggle userId={user.id} role={user.role} isSelf={isSelf} />
                        <UserActiveToggle userId={user.id} isActive={isActive} isSelf={isSelf} />
                        {!isSelf && (
                          <DeleteEntityButton
                            id={user.id}
                            confirmLabel={`Permanently delete ${user.name ?? user.email}? This deletes their account and all invitations.`}
                            action={deleteUserAction}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
