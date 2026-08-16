import { Skeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center gap-6 bg-gradient-to-b from-[oklch(0.97_0.015_340)] to-background px-4 py-12">
      <Skeleton className="h-7 w-64" />
      <div className="mx-auto w-full max-w-2xl">
        <Skeleton className="mb-4 h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
