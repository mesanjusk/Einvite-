import type { MetadataRoute } from "next";

import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const invitations = await db.invitation
    .findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    })
    .catch(() => []);

  return [
    { url: appUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/sign-up`, changeFrequency: "monthly", priority: 0.5 },
    ...invitations.map((invitation) => ({
      url: `${appUrl}/invite/${invitation.slug}`,
      lastModified: invitation.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
