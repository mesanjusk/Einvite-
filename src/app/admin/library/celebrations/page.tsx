import type { Metadata } from "next";

import { db } from "@/lib/db";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import {
  resolveEventCategory,
  WIZARD_STEPS,
  INVITATION_FIELDS,
} from "@/lib/event-category-config";
import { EventCategoryConfigDialog } from "@/components/admin/event-category-config-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Celebrations" };

/**
 * Every celebration the studio offers, and what its create form asks.
 *
 * The cards show the *resolved* form — catalogue plus overrides — rather than
 * only what has been overridden, because the question an admin arrives with
 * is "what does a birthday ask for right now", not "what have I changed".
 */
export default async function AdminCelebrationsPage() {
  const rows = await db.eventCategoryConfig.findMany();
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  const categories = EVENT_CATEGORIES.map((category) => ({
    resolved: resolveEventCategory(category.slug, bySlug.get(category.slug) ?? null),
    isCustomised: bySlug.has(category.slug),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Celebrations"
        meta={`${categories.filter((c) => c.resolved.isEnabled).length} of ${categories.length} offered`}
      />

      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-4 text-sm">
          Each celebration starts from its built-in form. Anything you change here
          overrides that — the wording, which steps the wizard walks, and per field
          whether it is asked and whether it is required. Clearing a box puts the
          built-in wording back rather than blanking it.
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {categories.map(({ resolved, isCustomised }) => {
          const steps = WIZARD_STEPS.filter((step) =>
            resolved.steps.includes(step.key),
          );
          const off = INVITATION_FIELDS.filter(
            (field) => !resolved.fields[field.key].enabled,
          );
          const required = INVITATION_FIELDS.filter(
            (field) => resolved.fields[field.key].required,
          );

          return (
            <Card key={resolved.slug} className="py-0">
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{resolved.label}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {resolved.tagline}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={resolved.isEnabled ? "default" : "outline"}>
                      {resolved.isEnabled ? "Offered" : "Hidden"}
                    </Badge>
                    <EventCategoryConfigDialog
                      category={{
                        slug: resolved.slug,
                        isEnabled: resolved.isEnabled,
                        label: resolved.label,
                        tagline: resolved.tagline,
                        primaryNameLabel: resolved.primaryNameLabel,
                        secondaryNameLabel: resolved.secondaryNameLabel,
                        secondaryOptional: resolved.secondaryOptional,
                        joiner: resolved.joiner,
                        dateLabel: resolved.dateLabel,
                        eventsLabel: resolved.eventsLabel,
                        familyBrideLabel: resolved.familyLabels.bride,
                        familyGroomLabel: resolved.familyLabels.groom,
                        defaultEvents: resolved.defaultEvents,
                        familyRelations: resolved.familyRelations,
                        steps: resolved.steps,
                        fields: resolved.fields,
                      }}
                      isCustomised={isCustomised}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {steps.map((step) => (
                    <Badge key={step.key} variant="secondary">
                      {step.label}
                    </Badge>
                  ))}
                </div>

                <p className="text-muted-foreground text-xs">
                  Asks for {resolved.primaryNameLabel.toLowerCase()} and{" "}
                  {resolved.secondaryNameLabel.toLowerCase()}
                  {resolved.secondaryOptional ? " (optional)" : ""}.
                </p>

                <p className="text-muted-foreground text-xs">
                  {required.length > 0
                    ? `Required: ${required.map((f) => f.label).join(", ")}. `
                    : "Nothing extra required. "}
                  {off.length > 0 &&
                    `Not asked: ${off.map((f) => f.label).join(", ")}.`}
                </p>

                {isCustomised && (
                  <p className="text-muted-foreground text-xs">Customised by you</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
