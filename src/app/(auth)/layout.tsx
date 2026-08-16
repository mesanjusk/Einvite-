import Link from "next/link";

import { SiteLogo } from "@/components/brand/site-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-gradient-to-b from-[oklch(0.97_0.015_340)] to-background px-4 py-12">
      <Link href="/" className="inline-block">
        <SiteLogo size="lg" />
      </Link>
      {children}
    </div>
  );
}
