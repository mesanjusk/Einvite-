import { redirect } from "next/navigation";

// Moved under /admin/library/music. Kept so existing links and bookmarks still land.
export default function OldAdminMusicRedirect() {
  redirect("/admin/library/music");
}
