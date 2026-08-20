/**
 * What the create wizard asks, per celebration, as an admin decides it.
 *
 * `event-categories.ts` is the catalogue this starts from: it knows a wedding
 * asks for a bride and a groom and a birthday asks for the birthday star and
 * a host. That catalogue is code, though, and "the housewarming form
 * shouldn't ask for a sub-caste" is not a code question — it is a decision
 * whoever runs the account should be able to make on a Tuesday without a
 * deploy.
 *
 * So a stored row may override any part of a category: its wording, which
 * steps the wizard walks through, and for each field whether it is asked at
 * all and whether it is required. Everything here is a *partial* override —
 * an empty row changes nothing, and a row that sets one label leaves the
 * rest of the catalogue standing. That is what makes the two safe to edit
 * independently: adding a category in code doesn't need a row, and editing a
 * row doesn't fork the code.
 *
 * The merge is pure so the resulting form can be checked without a database.
 */

import {
  eventCategoryFor,
  type EventCategory,
  type EventCategorySlug,
} from "@/lib/event-categories";

// ---------------------------------------------------------------------------
// The catalogues an admin picks from
// ---------------------------------------------------------------------------

export const WIZARD_STEP_KEYS = [
  "culture",
  "names",
  "events",
  "family",
  "design",
  "photos",
  "review",
] as const;

export type WizardStepKey = (typeof WIZARD_STEP_KEYS)[number];

export type WizardStepDef = {
  key: WizardStepKey;
  label: string;
  description: string;
  /** Can't be switched off — the wizard has nothing to save without it. */
  locked?: boolean;
};

export const WIZARD_STEPS: WizardStepDef[] = [
  {
    key: "culture",
    label: "Culture",
    description:
      "Tradition, caste and sub-caste. Decides which ceremonies the events step pre-fills.",
  },
  {
    key: "names",
    label: "Names",
    description: "Who the celebration is for, and the date.",
    locked: true,
  },
  {
    key: "events",
    label: "Events",
    description: "Ceremony list, venue and the couple's own message.",
  },
  { key: "family", label: "Family", description: "Family members listed on the site." },
  { key: "design", label: "Design", description: "Theme, colourway and music." },
  { key: "photos", label: "Photos", description: "Gallery uploads." },
  {
    key: "review",
    label: "Review",
    description: "Final check before the invitation is created.",
    locked: true,
  },
];

export const INVITATION_FIELD_KEYS = [
  "religion",
  "caste",
  "subCaste",
  "primaryName",
  "secondaryName",
  "eventDate",
  "venueName",
  "venueAddress",
  "googleMapsUrl",
  "customMessage",
  "events",
  "familyMembers",
  "theme",
  "music",
] as const;

export type InvitationFieldKey = (typeof INVITATION_FIELD_KEYS)[number];

export type InvitationFieldDef = {
  key: InvitationFieldKey;
  /** The step it appears on — hiding that step hides the field with it. */
  step: WizardStepKey;
  label: string;
  /** Always asked: the invitation record cannot be written without it. */
  locked?: boolean;
  /** Whether "required" is even a meaningful choice for this field. */
  requirable?: boolean;
};

export const INVITATION_FIELDS: InvitationFieldDef[] = [
  { key: "religion", step: "culture", label: "Tradition", requirable: true },
  { key: "caste", step: "culture", label: "Caste", requirable: true },
  { key: "subCaste", step: "culture", label: "Sub-caste", requirable: true },
  { key: "primaryName", step: "names", label: "First name slot", locked: true },
  { key: "secondaryName", step: "names", label: "Second name slot", requirable: true },
  { key: "eventDate", step: "names", label: "Date", locked: true },
  { key: "venueName", step: "events", label: "Venue name", requirable: true },
  { key: "venueAddress", step: "events", label: "Venue address", requirable: true },
  { key: "googleMapsUrl", step: "events", label: "Map link", requirable: true },
  {
    key: "customMessage",
    step: "events",
    label: "Message from the hosts",
    requirable: true,
  },
  { key: "events", step: "events", label: "Ceremony list", requirable: true },
  { key: "familyMembers", step: "family", label: "Family members", requirable: true },
  { key: "theme", step: "design", label: "Design", requirable: true },
  { key: "music", step: "design", label: "Music", requirable: true },
];

export type FieldRule = { enabled: boolean; required: boolean; label?: string };

export type FieldRules = Record<InvitationFieldKey, FieldRule>;

/** One stored override row, as the admin form writes it. */
export type EventCategoryOverride = {
  isEnabled: boolean | null;
  label: string | null;
  tagline: string | null;
  primaryNameLabel: string | null;
  secondaryNameLabel: string | null;
  secondaryOptional: boolean | null;
  joiner: string | null;
  dateLabel: string | null;
  eventsLabel: string | null;
  familyBrideLabel: string | null;
  familyGroomLabel: string | null;
  defaultEvents: string[];
  familyRelations: string[];
  steps: string[];
  fields: unknown;
};

export type ResolvedEventCategory = EventCategory & {
  /** Whether the celebration is offered at all on the "Get started" picker. */
  isEnabled: boolean;
  steps: WizardStepKey[];
  fields: FieldRules;
};

// ---------------------------------------------------------------------------
// Defaults, derived from the code catalogue
// ---------------------------------------------------------------------------

/**
 * The steps a category walks through before an admin touches anything.
 *
 * Culture is a wedding-only step in the catalogue: the tradition picked there
 * is what pre-fills the ceremony list, and a housewarming has no equivalent.
 */
export function defaultStepsFor(slug: EventCategorySlug): WizardStepKey[] {
  return WIZARD_STEPS.filter(
    (step) => step.key !== "culture" || slug === "wedding",
  ).map((step) => step.key);
}

export function defaultFieldRulesFor(category: EventCategory): FieldRules {
  const rules = {} as FieldRules;

  for (const field of INVITATION_FIELDS) {
    rules[field.key] = {
      // Sub-caste is the one field off by default: it is asked for often
      // enough to be worth having, and rarely enough that every category
      // shouldn't start with it.
      enabled: field.key !== "subCaste",
      // The catalogue's own rule: a second name slot is required wherever it
      // names half a couple, and optional where it names a host.
      required: field.key === "secondaryName" ? !category.secondaryOptional : false,
    };
  }

  return rules;
}

// ---------------------------------------------------------------------------
// The merge
// ---------------------------------------------------------------------------

function isStepKey(value: string): value is WizardStepKey {
  return (WIZARD_STEP_KEYS as readonly string[]).includes(value);
}

/**
 * The stored step list, cleaned up: unknown keys dropped, the locked steps
 * put back if an old row is missing them, and the whole thing ordered the way
 * the wizard walks. An empty list means "no override" rather than "no steps",
 * because a wizard with no steps is a bug, never an instruction.
 */
export function resolveSteps(
  slug: EventCategorySlug,
  stored: string[] | undefined | null,
): WizardStepKey[] {
  if (!stored || stored.length === 0) return defaultStepsFor(slug);

  const chosen = new Set(stored.filter(isStepKey));
  for (const step of WIZARD_STEPS) {
    if (step.locked) chosen.add(step.key);
  }

  return WIZARD_STEPS.filter((step) => chosen.has(step.key)).map((step) => step.key);
}

/**
 * Field rules, the stored ones laid over the defaults key by key. A locked
 * field stays enabled whatever the row says — it is asked for because the
 * record cannot be written without it, which is not an editorial decision.
 */
export function resolveFieldRules(
  category: EventCategory,
  stored: unknown,
): FieldRules {
  const defaults = defaultFieldRulesFor(category);
  if (!stored || typeof stored !== "object") return defaults;

  const overrides = stored as Record<string, Partial<FieldRule> | undefined>;
  const resolved = {} as FieldRules;

  for (const field of INVITATION_FIELDS) {
    const base = defaults[field.key];
    const override = overrides[field.key];

    resolved[field.key] = {
      enabled: field.locked ? true : (override?.enabled ?? base.enabled),
      required: override?.required ?? base.required,
      label: override?.label?.trim() || undefined,
    };
  }

  return resolved;
}

/**
 * One celebration as the wizard should render it: the code catalogue with the
 * admin's row laid over the top.
 *
 * Blank strings in the row count as "not overridden" rather than as an empty
 * label — a cleared input in the form means "go back to the built-in
 * wording", which is the only reading that lets someone undo an edit.
 */
export function resolveEventCategory(
  slug: string,
  override: EventCategoryOverride | null,
): ResolvedEventCategory {
  const base = eventCategoryFor(slug);
  const pick = (value: string | null | undefined, fallback: string) =>
    value?.trim() || fallback;

  const secondaryOptional = override?.secondaryOptional ?? base.secondaryOptional;
  const merged: EventCategory = {
    ...base,
    label: pick(override?.label, base.label),
    tagline: pick(override?.tagline, base.tagline),
    primaryNameLabel: pick(override?.primaryNameLabel, base.primaryNameLabel),
    secondaryNameLabel: pick(override?.secondaryNameLabel, base.secondaryNameLabel),
    secondaryOptional,
    joiner: pick(override?.joiner, base.joiner),
    dateLabel: pick(override?.dateLabel, base.dateLabel),
    eventsLabel: pick(override?.eventsLabel, base.eventsLabel),
    familyLabels: {
      bride: pick(override?.familyBrideLabel, base.familyLabels.bride),
      groom: pick(override?.familyGroomLabel, base.familyLabels.groom),
    },
    defaultEvents: override?.defaultEvents?.length
      ? override.defaultEvents
      : base.defaultEvents,
    familyRelations: override?.familyRelations?.length
      ? override.familyRelations
      : base.familyRelations,
  };

  return {
    ...merged,
    isEnabled: override?.isEnabled ?? true,
    steps: resolveSteps(base.slug, override?.steps),
    fields: resolveFieldRules(merged, override?.fields),
  };
}

/** The label to print over a field, admin wording winning over the built-in. */
export function fieldLabel(
  rules: FieldRules,
  key: InvitationFieldKey,
  fallback: string,
): string {
  return rules[key]?.label || fallback;
}
