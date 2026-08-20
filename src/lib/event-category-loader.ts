import { db } from "@/lib/db";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import {
  resolveEventCategory,
  type ResolvedEventCategory,
} from "@/lib/event-category-config";

/**
 * One celebration as configured, for a page about to render its form.
 *
 * Falls back to the built-in catalogue whenever the database can't be
 * reached: the create wizard is the front door, and a form that refuses to
 * open because a settings row couldn't be read would be a worse failure than
 * one that opens with its original wording.
 */
export async function loadEventCategory(
  slug?: string | null,
): Promise<ResolvedEventCategory> {
  const override = slug
    ? await db.eventCategoryConfig.findUnique({ where: { slug } }).catch(() => null)
    : null;

  return resolveEventCategory(slug ?? "", override);
}

/** Every celebration, for the picker — hidden ones dropped. */
export async function loadOfferedCategories(): Promise<ResolvedEventCategory[]> {
  const rows = await db.eventCategoryConfig.findMany().catch(() => []);
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  return EVENT_CATEGORIES.map((category) =>
    resolveEventCategory(category.slug, bySlug.get(category.slug) ?? null),
  ).filter((category) => category.isEnabled);
}
