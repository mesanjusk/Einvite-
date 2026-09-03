import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Choose an Invitation Design",
  robots: { index: false, follow: false },
};

/**
 * The public journey is template-first now:
 * category -> template -> live preview -> live editor.
 *
 * Keep /create as a compatibility route for old bookmarks, Instagram links
 * and previously shared CTAs, but never show the old step-by-step wizard.
 */
export default async function CreateInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; category?: string }>;
}) {
  const { theme, category } = await searchParams;
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (theme) params.set("q", theme);

  redirect(params.size ? `/themes?${params.toString()}` : "/themes");
}
