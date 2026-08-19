import { redirect } from "next/navigation";

// Moved under /admin/library/themes. Kept so existing links and bookmarks still land.
export default function OldAdminThemesRedirect() {
  redirect("/admin/library/themes");
}
