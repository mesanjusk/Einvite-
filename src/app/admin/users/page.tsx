import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteUserAction } from "@/lib/actions/admin";
import { ADMIN_USER_GROUP, KNOWN_USER_GROUPS, isAdminGroup } from "@/lib/user-groups";
import { UserGroupSelect } from "@/components/admin/user-group-select";
import { UserActiveToggle } from "@/components/admin/user-active-toggle";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manage Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const [users, groupRows] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { subscription: true, _count: { select: { invitations: true } } },
    }),
    // The live list, so a group added in the other app shows up here without
    // a deploy. The built-in names are a fallback for a database whose
    // `usergroups` rows have not been imported — an empty picker would make
    // this screen useless.
    db.userGroup
      .findMany({ orderBy: { name: "asc" }, select: { name: true } })
      .catch(() => []),
  ]);

  const groups =
    groupRows.length > 0
      ? [...new Set(groupRows.map((row) => row.name))]
      : [...KNOWN_USER_GROUPS];

  // Accounts still admin only because of the old role column. Worth naming
  // on the page: they are the ones to move into a group before
  // ADMIN_LEGACY_ROLE can be switched off.
  const legacyAdmins = users.filter(
    (user) => user.role === "ADMIN" && !isAdminGroup(user.userGroup),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        meta={`${users.length} accounts · admin is granted by the "${ADMIN_USER_GROUP}" group`}
      />

      {legacyAdmins > 0 && (
        <p className="border-accent/40 bg-accent/5 rounded-md border px-4 py-3 text-sm">
          {legacyAdmins} account{legacyAdmins === 1 ? " is" : "s are"} still admin
          through the old role field rather than a group. Move{" "}
          {legacyAdmins === 1 ? "it" : "them"} into &ldquo;{ADMIN_USER_GROUP}&rdquo;
          below, then set <code className="text-xs">ADMIN_LEGACY_ROLE=off</code> to make
          groups the only way in.
        </p>
      )}

      <Card className="py-0">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Invitations</th>
                <th className="px-4 py-3 font-medium">User group</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === session?.user.id;
                const isActive = user.isActive !== false;
                const groupAdmin = isAdminGroup(user.userGroup);
                const legacyAdmin = user.role === "ADMIN" && !groupAdmin;

                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="text-muted-foreground px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {user.subscription?.plan ?? "FREE"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{user._count.invitations}</td>
                    <td className="px-4 py-3">
                      <UserGroupSelect
                        userId={user.id}
                        group={user.userGroup}
                        groups={groups}
                        isSelf={isSelf}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {groupAdmin ? (
                        <Badge variant="gold">Admin</Badge>
                      ) : legacyAdmin ? (
                        <Badge
                          variant="outline"
                          title="Admin via the old role field only"
                        >
                          Admin (legacy)
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isActive ? "secondary" : "destructive"}>
                        {isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <UserActiveToggle
                          userId={user.id}
                          isActive={isActive}
                          isSelf={isSelf}
                        />
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
