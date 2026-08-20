"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Sparkles,
  Upload,
  X,
  Heart,
  CalendarDays,
  Palette,
  Images,
  PartyPopper,
  Check,
  Users,
  Landmark,
  Clock,
  Shirt,
  Quote,
  MapPin,
} from "lucide-react";

import {
  invitationWizardSchema,
  type InvitationWizardInput,
  type InvitationWizardFormValues,
} from "@/lib/validations/invitation";
import {
  autoFillPhotosAction,
  createDraftInvitationAction,
  updateGuestInvitationAction,
  publishGuestInvitationAction,
} from "@/lib/actions/guest-invitation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GuestPhotosStep, type GuestMediaItem } from "./guest-photos-step";
import { MusicPicker } from "./music-picker";
import { PublishDialog } from "./publish-dialog";
import { RELIGIONS, ceremonyNamesFor } from "@/lib/culture-presets";
import { celebrantNames, eventCategoryFor, DEFAULT_EVENT_CATEGORY } from "@/lib/event-categories";

type Colorway = {
  slug: string;
  name: string;
  colorPalette: { primary: string; accent: string };
};

type Theme = {
  slug: string;
  name: string;
  category: string;
  isPremium: boolean;
  previewImage?: string | null;
  colorPalette: { primary: string; accent: string };
  /** Colour schemes this design ships in; the theme's own palette when empty. */
  colorways: Colorway[];
};

type MusicTrack = { id: string; title: string; artist: string | null; mood: string | null; url: string };

// Steps are keyed, not numbered, because the list itself changes per event
// category: the Culture step only exists for a wedding, where the tradition
// picked decides which ceremonies get pre-filled.
const STEP_DEFS = {
  culture: { label: "Culture", icon: Landmark },
  names: { label: "Names", icon: Heart },
  events: { label: "Events", icon: CalendarDays },
  family: { label: "Family", icon: Users },
  design: { label: "Design", icon: Palette },
  photos: { label: "Photos", icon: Images },
  review: { label: "Review", icon: PartyPopper },
} as const;

type StepKey = keyof typeof STEP_DEFS;

const WEDDING_STEPS: StepKey[] = ["culture", "names", "events", "family", "design", "photos", "review"];
const OTHER_STEPS: StepKey[] = WEDDING_STEPS.filter((key) => key !== "culture");

const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "traditional", label: "Traditional" },
  { value: "modern", label: "Modern" },
  { value: "fusion", label: "Fusion" },
  { value: "minimal", label: "Minimal" },
] as const;

const STEP_FIELDS: Partial<Record<StepKey, (keyof InvitationWizardFormValues)[]>> = {
  culture: ["religion", "caste"],
  names: ["brideName", "groomName", "weddingDate"],
  events: ["venueName", "venueAddress", "googleMapsUrl", "customMessage", "events"],
  family: ["familyMembers"],
  design: ["themeSlug", "musicTrackId"],
};

const DRAFT_ID_STORAGE_KEY = "einvite-guest-draft-id";
const CREATOR_GENDER_STORAGE_KEY = "einvite-creator-gender";

type CreatorGender = "bride" | "groom";

export function GuestInvitationWizard({
  eventCategory = DEFAULT_EVENT_CATEGORY,
  themes,
  musicTracks,
  existingInvitationId,
  initialValues,
  initialMedia,
  isPublished = false,
  hasPhoneLink = false,
}: {
  /** Which celebration this invitation is for — decides the questions asked. */
  eventCategory?: string;
  themes: Theme[];
  musicTracks: MusicTrack[];
  /** Editing an existing (possibly already-published) guest invitation instead of starting a fresh draft. */
  existingInvitationId?: string;
  initialValues?: Partial<InvitationWizardFormValues>;
  initialMedia?: GuestMediaItem[];
  isPublished?: boolean;
  /** Already has a durable WhatsApp edit link (e.g. reached via a pre-sent link) — publish directly, no phone prompt needed. */
  hasPhoneLink?: boolean;
}) {
  const isEditMode = Boolean(existingInvitationId);
  const category = eventCategoryFor(eventCategory);
  const stepKeys = category.slug === "wedding" ? WEDDING_STEPS : OTHER_STEPS;
  // "Who's creating this?" only makes sense where both name slots are a
  // couple; a birthday's second slot is the host, not a partner.
  const isCoupleEvent = !category.secondaryOptional;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(existingInvitationId ?? null);
  const [media, setMedia] = useState<GuestMediaItem[]>(initialMedia ?? []);
  const [publishOpen, setPublishOpen] = useState(false);
  const [isOwnerSession, setIsOwnerSession] = useState(false);
  const [musicUploading, setMusicUploading] = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const [themeCategory, setThemeCategory] = useState<(typeof CATEGORY_TABS)[number]["value"]>(
    "all",
  );
  const [creatorGender, setCreatorGender] = useState<CreatorGender | null>(null);
  const [genderPromptOpen, setGenderPromptOpen] = useState(false);

  useEffect(() => {
    if (isEditMode || !isCoupleEvent || typeof window === "undefined") return;
    const stored = sessionStorage.getItem(CREATOR_GENDER_STORAGE_KEY);
    if (stored === "bride" || stored === "groom") {
      setCreatorGender(stored);
    } else {
      setGenderPromptOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseCreatorGender(gender: CreatorGender) {
    setCreatorGender(gender);
    sessionStorage.setItem(CREATOR_GENDER_STORAGE_KEY, gender);
    setGenderPromptOpen(false);
  }

  const visibleThemes = useMemo(
    () => (themeCategory === "all" ? themes : themes.filter((t) => t.category === themeCategory)),
    [themes, themeCategory],
  );

  const form = useForm<InvitationWizardFormValues, unknown, InvitationWizardInput>({
    resolver: zodResolver(invitationWizardSchema),
    defaultValues: {
      brideName: "",
      groomName: "",
      weddingDate: "",
      venueName: "",
      venueAddress: "",
      googleMapsUrl: "",
      customMessage: "",
      religion: "",
      caste: "",
      themeSlug: themes[0]?.slug ?? "royal",
      musicTrackId: undefined,
      customMusicUrl: undefined,
      eventCategory: category.slug,
      // The functions this celebration usually has, ready to edit — a
      // birthday opens on "Cake Cutting", not on "Wedding".
      events: category.defaultEvents.map((name) => ({
        name,
        date: "",
        time: "",
        venueName: "",
        address: "",
        dressCode: "",
        tagline: "",
      })),
      familyMembers: [],
      useAiCopy: true,
      ...initialValues,
    },
  });

  const eventFields = useFieldArray({ control: form.control, name: "events" });
  const currentStep = stepKeys[step];

  // Colourways of the currently selected design — a theme with only its own
  // palette has none to choose between, so the picker stays hidden.
  const watchedThemeSlug = form.watch("themeSlug");
  const selectedThemeColorways = useMemo(
    () => themes.find((t) => t.slug === watchedThemeSlug)?.colorways ?? [],
    [themes, watchedThemeSlug],
  );
  const relativeFields = useFieldArray({ control: form.control, name: "familyMembers" });

  // Which optional detail rows are open per event, so the card stays a name
  // and a date until someone asks for more.
  const [openDetails, setOpenDetails] = useState<Record<number, Set<string>>>({});

  function toggleDetail(index: number, key: string) {
    setOpenDetails((prev) => {
      const next = new Set(prev[index] ?? []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [index]: next };
    });
  }

  // Choosing a tradition fills the ceremony list with what it observes —
  // only while the couple hasn't started editing events themselves, so it
  // can never overwrite real input.
  function applyReligion(religion: string) {
    form.setValue("religion", religion);
    const names = ceremonyNamesFor(religion);
    if (names.length === 0) return;

    const current = form.getValues("events") ?? [];
    const untouched = current.every((e) => !e.date && !e.venueName && !e.time);
    if (!untouched) return;

    eventFields.replace(
      names.map((name) => ({
        name,
        date: "",
        time: "",
        venueName: "",
        address: "",
        dressCode: "",
        tagline: "",
      })),
    );
  }

  useEffect(() => {
    if (isEditMode) return;
    let cancelled = false;

    async function ensureDraft() {
      const existing =
        typeof window !== "undefined" ? sessionStorage.getItem(DRAFT_ID_STORAGE_KEY) : null;
      if (existing) {
        if (!cancelled) setInvitationId(existing);
        return;
      }
      const result = await createDraftInvitationAction();
      if (cancelled) return;
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      sessionStorage.setItem(DRAFT_ID_STORAGE_KEY, result.data.invitationId);
      setIsOwnerSession(result.data.isOwnerSession);
      setInvitationId(result.data.invitationId);
    }

    ensureDraft();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Photos are optional: moving on without any quietly fills the gallery
  // with ready-made ones rather than stopping to ask.
  async function ensurePhotos() {
    if (!invitationId || media.length > 0) return;
    const result = await autoFillPhotosAction(invitationId);
    if (result.success) setMedia(result.data.media);
  }

  async function goNext() {
    if (currentStep === "photos") {
      await ensurePhotos();
      setStep((s) => Math.min(s + 1, stepKeys.length - 1));
      return;
    }

    const fields = STEP_FIELDS[currentStep];
    if (fields) {
      const valid = await form.trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, stepKeys.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleMusicUpload(file: File | undefined) {
    if (!file || !invitationId) return;
    setMusicUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("invitationId", invitationId);

    const response = await fetch("/api/media/upload-audio", { method: "POST", body: formData });
    const data = await response.json();
    setMusicUploading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Failed to upload audio");
      return;
    }
    form.setValue("customMusicUrl", data.url);
    form.setValue("musicTrackId", undefined);
    if (musicInputRef.current) musicInputRef.current.value = "";
  }

  async function onSubmit(values: InvitationWizardInput) {
    if (!invitationId) return;
    await ensurePhotos();

    setSubmitting(true);
    const result = await updateGuestInvitationAction(invitationId, values);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (isPublished) {
      toast.success("Invitation updated!");
      router.push(`/manage/${invitationId}`);
      return;
    }

    if (isOwnerSession) {
      // Signed-in team members already proved who they are — review and
      // publish from the Deploy page like today.
      toast.success("Invitation saved!");
      router.push(`/dashboard/publish/deploy?invitationId=${invitationId}`);
      return;
    }

    if (hasPhoneLink) {
      // Reached via a pre-sent edit link — ownership is already
      // established, so publish immediately with no extra prompt.
      setSubmitting(true);
      const publishResult = await publishGuestInvitationAction({ invitationId });
      setSubmitting(false);
      if (!publishResult.success) {
        toast.error(publishResult.error);
        return;
      }
      toast.success("Invitation is live!");
      router.push(`/manage/${invitationId}`);
      return;
    }

    setPublishOpen(true);
  }

  if (!invitationId) {
    return (
      <div className="text-muted-foreground flex justify-center py-20 text-sm">
        Setting things up…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex items-start">
        <div className="bg-muted absolute top-5 right-5 left-5 -z-10 h-0.5 overflow-hidden rounded-full">
          <motion.div
            className="bg-primary h-full"
            initial={false}
            animate={{ width: `${(step / (stepKeys.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {stepKeys.map((key, i) => {
          const { label, icon: StepIcon } = STEP_DEFS[key];
          const isDone = i < step;
          const isActive = i === step;
          return (
            <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.div
                animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary bg-background"
                      : "bg-muted border-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-4" /> : <StepIcon className="size-4" />}
              </motion.div>
              <span
                className={cn(
                  "hidden text-[11px] sm:block",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card
          className="overflow-hidden border-none shadow-lg"
          style={{
            background:
              "linear-gradient(165deg, color-mix(in srgb, var(--primary) 6%, var(--card)) 0%, var(--card) 45%)",
          }}
        >
          <CardContent className="overflow-hidden pt-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-5"
            >
            {currentStep === "culture" && (
              <>
                <Field label="Religion">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RELIGIONS.map((religion) => {
                      const selected = form.watch("religion") === religion;
                      return (
                        <button
                          key={religion}
                          type="button"
                          onClick={() => applyReligion(religion)}
                          aria-pressed={selected}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:border-primary/60",
                          )}
                        >
                          {religion}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Community or caste (optional)">
                  <Input placeholder="Maratha, Agarwal, Syrian Catholic…" {...form.register("caste")} />
                </Field>
              </>
            )}

            {currentStep === "names" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(() => {
                    const brideField = (
                      <Field
                        key="bride"
                        label={
                          creatorGender === "bride"
                            ? "Your name"
                            : creatorGender === "groom"
                              ? "Partner's name"
                              : category.primaryNameLabel
                        }
                        error={form.formState.errors.brideName?.message}
                      >
                        <Input {...form.register("brideName")} />
                      </Field>
                    );
                    const groomField = (
                      <Field
                        key="groom"
                        label={
                          creatorGender === "groom"
                            ? "Your name"
                            : creatorGender === "bride"
                              ? "Partner's name"
                              : category.secondaryNameLabel
                        }
                        error={form.formState.errors.groomName?.message}
                      >
                        <Input {...form.register("groomName")} />
                      </Field>
                    );
                    return creatorGender === "groom"
                      ? [groomField, brideField]
                      : [brideField, groomField];
                  })()}
                </div>
                <Field label={category.dateLabel} error={form.formState.errors.weddingDate?.message}>
                  <Input type="date" {...form.register("weddingDate")} />
                </Field>
              </>
            )}

            {currentStep === "events" && (
              <div className="flex flex-col gap-5">
                <div className="grid gap-4 rounded-lg border p-4">
                  <p className="text-sm font-medium">Main venue</p>
                  <Field label="Venue name">
                    <Input {...form.register("venueName")} />
                  </Field>
                  <Field label="Venue address">
                    <Input {...form.register("venueAddress")} />
                  </Field>
                  <Field
                    label="Google Maps link (optional)"
                    error={form.formState.errors.googleMapsUrl?.message}
                  >
                    <Input
                      placeholder="https://maps.google.com/?q=…"
                      {...form.register("googleMapsUrl")}
                    />
                  </Field>
                  <Field label="Message for guests (optional)">
                    <Textarea rows={2} {...form.register("customMessage")} />
                  </Field>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">{category.eventsLabel}</p>
                  {eventFields.fields.map((field, index) => {
                    const open = openDetails[index] ?? new Set<string>();
                    const extras = [
                      { key: "time", icon: Clock, label: "Time", placeholder: "6:00 PM onwards" },
                      { key: "venueName", icon: MapPin, label: "Venue", placeholder: "If different from the main venue" },
                      { key: "dressCode", icon: Shirt, label: "Dress code", placeholder: "Traditional, Bridal Gold" },
                      { key: "tagline", icon: Quote, label: "Tagline", placeholder: "The royal procession begins!" },
                    ] as const;

                    return (
                      <div key={field.id} className="grid gap-3 rounded-lg border p-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                          <Field label="Name">
                            <Input {...form.register(`events.${index}.name` as const)} />
                          </Field>
                          <Field label="Date">
                            <Input type="date" {...form.register(`events.${index}.date` as const)} />
                          </Field>
                          {eventFields.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove entry ${index + 1}`}
                              onClick={() => eventFields.remove(index)}
                            >
                              <Trash2 className="text-destructive size-4" />
                            </Button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {extras.map((extra) => (
                            <button
                              key={extra.key}
                              type="button"
                              onClick={() => toggleDetail(index, extra.key)}
                              aria-pressed={open.has(extra.key)}
                              title={extra.label}
                              className={cn(
                                "flex size-9 items-center justify-center rounded-full border transition-colors",
                                open.has(extra.key)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:border-primary hover:text-foreground",
                              )}
                            >
                              <extra.icon className="size-4" />
                              <span className="sr-only">{extra.label}</span>
                            </button>
                          ))}
                        </div>

                        {extras.some((e) => open.has(e.key)) && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {extras
                              .filter((extra) => open.has(extra.key))
                              .map((extra) => (
                                <Field key={extra.key} label={extra.label}>
                                  <Input
                                    placeholder={extra.placeholder}
                                    {...form.register(`events.${index}.${extra.key}` as const)}
                                  />
                                </Field>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      eventFields.append({
                        name: "",
                        date: "",
                        time: "",
                        venueName: "",
                        address: "",
                        dressCode: "",
                        tagline: "",
                      })
                    }
                  >
                    <Plus />
                    Add to the {category.eventsLabel.toLowerCase()}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === "family" && (
              <div className="flex flex-col gap-3">
                {relativeFields.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <Field label="Name">
                      <Input {...form.register(`familyMembers.${index}.name` as const)} />
                    </Field>
                    <Field label="Relation">
                      <Input
                        placeholder={`${category.familyRelations[0]}, ${category.familyRelations[1]}…`}
                        {...form.register(`familyMembers.${index}.relation` as const)}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove relative ${index + 1}`}
                      onClick={() => relativeFields.remove(index)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => relativeFields.append({ side: "BRIDE", relation: "", name: "" })}
                >
                  <Plus />
                  Add name
                </Button>
              </div>
            )}

            {currentStep === "design" && (
              <>
                <Field label="Theme">
                  <Tabs
                    value={themeCategory}
                    onValueChange={(v) => setThemeCategory(v as typeof themeCategory)}
                    className="mb-3"
                  >
                    <TabsList>
                      {CATEGORY_TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visibleThemes.map((theme) => {
                      const selected = form.watch("themeSlug") === theme.slug;
                      return (
                        <button
                          key={theme.slug}
                          type="button"
                          onClick={() => {
                            form.setValue("themeSlug", theme.slug);
                            // Colourways belong to a design, so switching
                            // design clears a choice that no longer exists.
                            form.setValue("colorwaySlug", undefined);
                          }}
                          className={cn(
                            "overflow-hidden rounded-lg border text-left",
                            selected ? "border-primary ring-primary/30 ring-2" : "",
                          )}
                        >
                          <div
                            className="relative h-20"
                            style={{
                              background: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.accent})`,
                            }}
                          >
                            {theme.previewImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={theme.previewImage}
                                alt=""
                                className="absolute inset-0 size-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 p-2.5">
                            <span className="truncate text-xs font-medium">{theme.name}</span>
                            {theme.colorways.length > 1 && (
                              <span className="flex shrink-0 -space-x-1" aria-hidden>
                                {theme.colorways.slice(0, 3).map((c) => (
                                  <span
                                    key={c.slug}
                                    className="border-background size-3 rounded-full border"
                                    style={{ background: c.colorPalette.primary }}
                                  />
                                ))}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {selectedThemeColorways.length > 0 && (
                  <Field label="Colour">
                    <div className="flex flex-wrap gap-2">
                      {selectedThemeColorways.map((colorway) => {
                        const active = form.watch("colorwaySlug") === colorway.slug;
                        return (
                          <button
                            key={colorway.slug}
                            type="button"
                            onClick={() => form.setValue("colorwaySlug", colorway.slug)}
                            aria-pressed={active}
                            className={cn(
                              "flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-xs font-medium transition-colors",
                              active ? "border-primary bg-primary/5" : "hover:border-primary/60",
                            )}
                          >
                            <span
                              className="size-5 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${colorway.colorPalette.primary}, ${colorway.colorPalette.accent})`,
                              }}
                            />
                            {colorway.name}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                )}

                <Field label="Background music (optional)">
                  <MusicPicker
                    tracks={musicTracks}
                    selectedId={form.watch("musicTrackId")}
                    customUrl={form.watch("customMusicUrl")}
                    onSelect={(id) => {
                      form.setValue("musicTrackId", id);
                      form.setValue("customMusicUrl", undefined);
                    }}
                  />

                  <input
                    ref={musicInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleMusicUpload(e.target.files?.[0])}
                  />
                  {form.watch("customMusicUrl") ? (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                      <span>Your uploaded song is set.</span>
                      <button
                        type="button"
                        onClick={() => form.setValue("customMusicUrl", undefined)}
                        aria-label="Remove uploaded song"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => musicInputRef.current?.click()}
                      disabled={musicUploading}
                    >
                      <Upload />
                      {musicUploading ? "Uploading…" : "Or upload your own song"}
                    </Button>
                  )}
                </Field>
              </>
            )}

            {currentStep === "photos" && (
              <GuestPhotosStep invitationId={invitationId} media={media} onMediaChange={setMedia} />
            )}

            {currentStep === "review" && (
              <>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="text-accent size-4" />
                    Generate copy with AI
                  </p>
                  <Switch
                    checked={form.watch("useAiCopy")}
                    onCheckedChange={(v) => form.setValue("useAiCopy", v)}
                  />
                </div>

                <div className="text-muted-foreground grid gap-1 text-sm">
                  <p className="text-foreground font-medium">
                    {celebrantNames(category, form.watch("brideName") ?? "", form.watch("groomName"))}
                  </p>
                  <p>
                    {category.label} · {form.watch("weddingDate")}
                  </p>
                  <p>{form.watch("venueName")}</p>
                  <p>{eventFields.fields.length} event(s)</p>
                  <p>Theme: {form.watch("themeSlug")}</p>
                  <p>{media.length} photos ready</p>
                </div>
              </>
            )}
            </motion.div>
          </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
            Back
          </Button>
          {step < stepKeys.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving…"
                : isPublished
                  ? "Save changes"
                  : isOwnerSession
                    ? "Save & continue to Deploy"
                    : hasPhoneLink
                      ? "Publish my invitation"
                      : "Continue to publish"}
            </Button>
          )}
        </div>
      </form>

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        invitationId={invitationId}
        onPublished={() => sessionStorage.removeItem(DRAFT_ID_STORAGE_KEY)}
      />

      <Dialog open={genderPromptOpen && isCoupleEvent} onOpenChange={setGenderPromptOpen}>
        <DialogContent
          showCloseButton={false}
          className="text-center sm:max-w-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Who&apos;s creating this invitation?</DialogTitle>
            <DialogDescription>
              We&apos;ll use this to fill in your name first — you can still edit both names.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="lg" onClick={() => chooseCreatorGender("groom")}>
              I&apos;m the Groom
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => chooseCreatorGender("bride")}>
              I&apos;m the Bride
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
