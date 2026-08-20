import { db } from "@/lib/db";
import { slugify, randomSuffix } from "@/lib/utils/slug";
import { SECTION_ORDER } from "@/lib/seed-data";

// Shared with the guest-flow actions — kept out of any "use server" file
// since those may only export async functions (a plain array/const export
// there breaks the build with "A 'use server' file can only export async
// functions").
export const DEFAULT_SECTION_ORDER = SECTION_ORDER;

export async function uniqueSlug(base: string) {
  let candidate = slugify(base);
  if (!candidate) candidate = "our-invitation";

  for (;;) {
    const existing = await db.invitation.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${slugify(base)}-${randomSuffix()}`;
  }
}
