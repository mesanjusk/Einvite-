import { redirect } from "next/navigation";

// Moved under /admin/library/pdf-themes. Kept so existing links and bookmarks still land.
export default function OldAdminPdfThemesRedirect() {
  redirect("/admin/library/pdf-themes");
}
