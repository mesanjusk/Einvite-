import Link from "next/link";

import { SiteLogo } from "@/components/brand/site-logo";
import { SiteFooter } from "@/components/marketing/site-footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <Link href="/">
          <SiteLogo size="lg" />
        </Link>
      </header>

      <main className="flex-1 px-6 py-10 lg:px-12">
        <article
          className="[&_h2]:font-display mx-auto max-w-2xl space-y-4 text-sm leading-relaxed
            [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
            [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold
            [&_li]:ml-1 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
            [&_p]:text-muted-foreground [&_strong]:text-foreground [&_strong]:font-semibold"
        >
          <h1 className="font-display mb-1 text-3xl">{title}</h1>
          {updated ? <p className="text-muted-foreground text-sm">Last Updated: {updated}</p> : null}
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
