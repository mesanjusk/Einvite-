import { redirect } from "next/navigation";

// Moved under /admin/library/video-templates. Kept so existing links and bookmarks still land.
export default function OldAdminVideoTemplatesRedirect() {
  redirect("/admin/library/video-templates");
}
