import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getAdmin } from "@/lib/admin-guard";

export const metadata: Metadata = { title: "Reports" };

/**
 * Reports are the one part of the admin panel that shows the business's own
 * money — margins, what each supplier costs, what each person on the team
 * earns the studio. The parent `/admin` layout already turns non-admins away,
 * and this guard repeats the check rather than trusting that: a layout is one
 * `redirect()` away from being loosened by someone who does not know this
 * section sits under it, and the cost of asking twice is a single indexed
 * lookup.
 *
 * The API route and every server action behind these pages check for
 * themselves too — see `admin-guard.ts`. A page guard protects a render, not
 * the endpoints the page happens to call.
 */
export default async function AdminReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getAdmin())) redirect("/dashboard");
  return <>{children}</>;
}
