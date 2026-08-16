import { redirect } from "next/navigation";

export default async function OldBuilderRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = new URLSearchParams(await searchParams);
  const qs = params.toString();
  redirect(`/dashboard/publish/sections${qs ? `?${qs}` : ""}`);
}
