import { redirect } from "next/navigation";

export default async function OldMusicLibraryRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = new URLSearchParams(await searchParams);
  params.set("tab", "audio");
  redirect(`/dashboard/media?${params.toString()}`);
}
