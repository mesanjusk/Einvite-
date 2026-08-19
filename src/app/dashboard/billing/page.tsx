import { redirect } from "next/navigation";

// Moved under /dashboard/settings/billing. Kept so existing links and bookmarks still land.
export default function OldBillingRedirect() {
  redirect("/dashboard/settings/billing");
}
