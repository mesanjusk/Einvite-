import { redirect } from "next/navigation";

export default function LegacyPdfThemesPage() {
  redirect("/admin/library/themes");
}
