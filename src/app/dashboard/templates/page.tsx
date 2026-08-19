import { redirect } from "next/navigation";

// Moved under /dashboard/invitations/templates. Kept so existing links and bookmarks still land.
export default function OldTemplatesRedirect() {
  redirect("/dashboard/invitations/templates");
}
