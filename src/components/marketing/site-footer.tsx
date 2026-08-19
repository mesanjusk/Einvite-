import Link from "next/link";

import { SITE_NAME } from "@/config/site";
import { LEGAL_BRAND_NAME } from "@/config/legal";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Data Deletion", href: "/data-deletion" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="text-muted-foreground border-t px-6 py-8 text-center text-sm">
      <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="text-foreground font-medium">
        {SITE_NAME} — a product of {LEGAL_BRAND_NAME}
      </p>
      <p className="mt-1 text-xs">
        © {new Date().getFullYear()} {LEGAL_BRAND_NAME}. All rights reserved.
      </p>
    </footer>
  );
}
