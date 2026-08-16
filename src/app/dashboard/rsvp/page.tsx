import { redirect } from "next/navigation";

export default async function OldRsvpRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = new URLSearchParams(await searchParams);
  const qs = params.toString();
  redirect(`/dashboard/manage/rsvp${qs ? `?${qs}` : ""}`);
}
