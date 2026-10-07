import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/admin");
  }

  // Admin-ness is decided by the record, never by the role stamped into the
  // session — see `admin-guard.ts`. A session lasts a year here, so a token
  // is stale about a promotion just as easily as about a demotion, and an
  // account switched to ADMIN in the database has to work on the next page
  // load rather than only after a sign-out.
  const admin = await getAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-svh bg-white">
      <DashboardSidebar isAdmin />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={session.user} isAdmin />
        <main className="relative flex-1 overflow-hidden p-4 lg:p-8">
          <div className="wedding-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="royal-dust pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="relative z-[1]">{children}</div>
        </main>
      </div>
    </div>
  );
}
