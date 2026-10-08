import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
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
    <div className="relative flex min-h-svh flex-col bg-[#f5f4f7] text-[#27232d]">
      <DashboardTopbar user={session.user} isAdmin />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}
