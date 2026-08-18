import type { Metadata } from "next";

import { db } from "@/lib/db";
import { VideoTemplateFormDialog } from "@/components/admin/video-template-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteVideoTemplateAction } from "@/lib/actions/admin";
import { isGeminiVideoConfigured } from "@/lib/ai/gemini-video";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manage Video Templates" };

export default async function AdminVideoTemplatesPage() {
  const templates = await db.videoTemplate.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { invitations: true, videos: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Video Templates" meta={`${templates.length} templates`}>
        <VideoTemplateFormDialog />
      </PageHeader>

      {!isGeminiVideoConfigured() && (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-4 text-sm">
            <code className="font-mono">GEMINI_API_KEY</code> isn&apos;t set — templates can be
            managed here, but generation requests will fail until it&apos;s configured in the
            environment.
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No video templates yet. Add one to let couples generate a Gemini video teaser.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="py-0">
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {template.slug} · {template.aspectRatio} · {template.durationSeconds}s
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {template.isPremium && <Badge variant="gold">Premium</Badge>}
                  <VideoTemplateFormDialog
                    template={{
                      id: template.id,
                      name: template.name,
                      slug: template.slug,
                      description: template.description,
                      aspectRatio: template.aspectRatio,
                      durationSeconds: template.durationSeconds,
                      promptTemplate: template.promptTemplate,
                      styleKeywords: template.styleKeywords as string[] | null,
                      geminiModel: template.geminiModel,
                      isPremium: template.isPremium,
                      sortOrder: template.sortOrder,
                    }}
                  />
                  <DeleteEntityButton
                    id={template.id}
                    confirmLabel={`Delete the ${template.name} video template? This can't be undone.`}
                    action={deleteVideoTemplateAction}
                  />
                </div>
              </div>
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {template.promptTemplate}
              </p>
              <p className="text-muted-foreground text-xs">
                {template._count.invitations} invitation(s) last used this ·{" "}
                {template._count.videos} generation(s) run
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
