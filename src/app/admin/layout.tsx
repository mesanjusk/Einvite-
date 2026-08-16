import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });
  if (dbUser?.isActive === false) {
    redirect("/sign-in?deactivated=1");
  }

  return (
    <div className="flex min-h-svh">
      <DashboardSidebar isAdmin />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={session.user} isAdmin />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
