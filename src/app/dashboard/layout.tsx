import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getAccessProfile } from "@/lib/admin-guard";
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

  // One read answers both questions this layout asks — is the account still
  // switched on, and does its user group make it an admin. Deriving the
  // second from `session.user.role` would show the Admin link based on a
  // token written at sign-in, which can be a year behind the record.
  const profile = await getAccessProfile();
  if (profile && !profile.isActive) {
    redirect("/sign-in?deactivated=1");
  }

  const isAdmin = profile?.isAdmin ?? false;

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
