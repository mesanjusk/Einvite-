import { redirect } from "next/navigation";

// Moved under /admin/library/pdf-themes. Kept so existing links still land.
export default async function OldAdminPdfThemeEditorRedirect({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;
  redirect(`/admin/library/pdf-themes/${themeId}`);
}
