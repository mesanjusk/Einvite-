import { Skeleton } from "@/components/ui/skeleton";

export default function ThemesLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
      <div>
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-4 h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    </div>
  );
}
