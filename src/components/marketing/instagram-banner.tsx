import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function InstagramBanner() {
  return (
    <div className="bg-muted text-muted-foreground border-b px-6 py-2.5 text-center text-xs sm:text-sm">
      <p className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <MessageCircle className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span>We use Instagram to deliver your free link.</span>
        <Link href="/privacy" className="text-foreground font-medium underline underline-offset-2">
          See Privacy Policy
        </Link>
      </p>
    </div>
  );
}
