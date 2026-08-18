import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { db } from "@/lib/db";
import { PdfTemplateEditor } from "@/components/admin/pdf-template-editor";
import type { PdfTemplatePage } from "@/lib/validations/pdf-template";

export const metadata: Metadata = { title: "Design PDF Layout" };

export default async function PdfTemplateEditorPage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;
  const theme = await db.theme.findUnique({ where: { id: themeId }, include: { templates: true } });
  if (!theme || theme.type !== "PDF") notFound();

  const pages = (theme.templates[0]?.pages as PdfTemplatePage[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/pdf-themes"
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to PDF Themes
        </Link>
        <h1 className="font-display text-2xl">{theme.name} — page layout</h1>
        <p className="text-muted-foreground text-sm">
          Drag text boxes onto each page, bind them to a field (or write fixed text), and set a
          background image or color. This is what fills in with each couple&apos;s own details
          when they download their PDF.
        </p>
      </div>

      <PdfTemplateEditor themeId={theme.id} initialPages={pages} />
    </div>
  );
}
