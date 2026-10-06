import type { Metadata } from "next";

import { db } from "@/lib/db";
import { QuickInvitationCreator } from "@/components/dashboard/quick-invitation-creator";

export const metadata: Metadata = { title: "Create Invitation" };

export default async function NewInvitationPage() {
  const themes = await db.theme.findMany({
    where: { type: "WEBSITE" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
          Quick create
        </p>
        <h1 className="font-display mt-1 text-3xl">Create Invitation</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Two simple steps. You can customize everything after the invitation is created.
        </p>
      </div>

      <QuickInvitationCreator
        themes={themes.map((theme) => {
          const palette = theme.colorPalette as { primary: string; accent: string };
          return {
            slug: theme.slug,
            name: theme.name,
            eventCategory: theme.eventCategory,
            previewImage: theme.previewImage,
            isPremium: theme.isPremium,
            primary: palette.primary,
            accent: palette.accent,
          };
        })}
      />
    </div>
  );
}
