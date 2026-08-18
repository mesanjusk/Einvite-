import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();

  const invitations = await db.invitation
    .findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    })
    .catch(() => []);

  return [
    { url: appUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/sign-up`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/data-deletion`, changeFrequency: "yearly", priority: 0.3 },
    ...invitations.map((invitation) => ({
      url: `${appUrl}/invite/${invitation.slug}`,
      lastModified: invitation.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
