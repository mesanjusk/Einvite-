import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true },
  });
  if (dbUser?.isActive === false) {
    redirect("/sign-in?deactivated=1");
  }

  // Read from the record, not from `session.user.role`. The role is written
  // into the session only at sign-in and sessions last a year, so an account
  // just promoted to ADMIN would otherwise be an admin everywhere except in
  // the one place that shows them the link.
  const isAdmin = dbUser?.role === "ADMIN";

  return (
    <div className="flex min-h-svh">
      <DashboardSidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={session.user} isAdmin={isAdmin} />
        <main className="flex-1 p-4 pb-20 lg:p-8">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
