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
  MapPinned,
  CalendarDays,
  Palette,
  Images,
  PartyPopper,
  Check,
} from "lucide-react";

import {
  invitationWizardSchema,
  type InvitationWizardInput,
  type InvitationWizardFormValues,
} from "@/lib/validations/invitation";
import { createDraftInvitationAction, updateGuestInvitationAction } from "@/lib/actions/guest-invitation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestPhotosStep, REQUIRED_PHOTOS, type GuestMediaItem } from "./guest-photos-step";
import { PublishOtpDialog } from "./publish-otp-dialog";

type Theme = {
  slug: string;
  name: string;
  category: string;
  isPremium: boolean;
  colorPalette: { primary: string; accent: string };
};

type MusicTrack = { id: string; title: string; mood: string | null };

const STEPS = ["Couple", "Venue", "Events", "Design", "Photos", "Review"] as const;
const STEP_ICONS = [Heart, MapPinned, CalendarDays, Palette, Images, PartyPopper] as const;

const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "traditional", label: "Traditional" },
  { value: "modern", label: "Modern" },
  { value: "fusion", label: "Fusion" },
  { value: "minimal", label: "Minimal" },
] as const;

const STEP_FIELDS: Record<number, (keyof InvitationWizardFormValues)[]> = {
  0: ["brideName", "groomName", "weddingDate", "language"],
  1: ["venueName", "venueAddress", "googleMapsUrl", "customMessage"],
  2: ["events"],
  3: ["themeSlug", "musicTrackId"],
};

const DRAFT_ID_STORAGE_KEY = "einvite-guest-draft-id";

export function GuestInvitationWizard({
  themes,
  musicTracks,
  existingInvitationId,
  initialValues,
  initialMedia,
  isPublished = false,
}: {
  themes: Theme[];
  musicTracks: MusicTrack[];
  /** Editing an existing (possibly already-published) guest invitation instead of starting a fresh draft. */
  existingInvitationId?: string;
  initialValues?: Partial<InvitationWizardFormValues>;
  initialMedia?: GuestMediaItem[];
  isPublished?: boolean;
}) {
  const isEditMode = Boolean(existingInvitationId);
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
      language: "EN",
      themeSlug: themes[0]?.slug ?? "royal",
      musicTrackId: undefined,
      customMusicUrl: undefined,
      events: [
        { name: "Wedding", date: "", time: "", venueName: "", address: "", dressCode: "" },
      ],
      familyMembers: [],
      useAiCopy: true,
      ...initialValues,
    },
  });

  const eventFields = useFieldArray({ control: form.control, name: "events" });

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

  async function goNext() {
    if (step === 4) {
      if (media.length < REQUIRED_PHOTOS) {
        toast.error(`Add ${REQUIRED_PHOTOS - media.length} more photo(s) to continue.`);
        return;
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      return;
    }

    const valid = await form.trigger(STEP_FIELDS[step]);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
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
    if (media.length < REQUIRED_PHOTOS) {
      toast.error(`Add ${REQUIRED_PHOTOS - media.length} more photo(s) before publishing.`);
      setStep(4);
      return;
    }

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
      // Signed-in team members already proved who they are — no WhatsApp
      // OTP needed. Review and publish from the Deploy page like today.
      toast.success("Invitation saved!");
      router.push(`/dashboard/deploy?invitationId=${invitationId}`);
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
            animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {STEPS.map((label, i) => {
          const StepIcon = STEP_ICONS[i];
          const isDone = i < step;
          const isActive = i === step;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
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
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Bride's name" error={form.formState.errors.brideName?.message}>
                    <Input {...form.register("brideName")} />
                  </Field>
                  <Field label="Groom's name" error={form.formState.errors.groomName?.message}>
                    <Input {...form.register("groomName")} />
                  </Field>
                </div>
                <Field label="Wedding date" error={form.formState.errors.weddingDate?.message}>
                  <Input type="date" {...form.register("weddingDate")} />
                </Field>
                <Field label="Language">
                  <Select
                    value={form.watch("language")}
                    onValueChange={(v) =>
                      form.setValue("language", v as InvitationWizardInput["language"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["EN", "HI", "MR", "GU", "TA", "TE", "ES", "FR"].map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {step === 1 && (
              <>
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
                  <Input placeholder="https://maps.google.com/?q=…" {...form.register("googleMapsUrl")} />
                </Field>
                <Field label="Custom message (optional)">
                  <Textarea
                    rows={3}
                    placeholder="Anything you'd like guests to know…"
                    {...form.register("customMessage")}
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                {eventFields.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Event {index + 1}</span>
                      {eventFields.fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eventFields.remove(index)}
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Name">
                        <Input {...form.register(`events.${index}.name` as const)} />
                      </Field>
                      <Field label="Date">
                        <Input type="date" {...form.register(`events.${index}.date` as const)} />
                      </Field>
                      <Field label="Time">
                        <Input
                          placeholder="6:00 PM onwards"
                          {...form.register(`events.${index}.time` as const)}
                        />
                      </Field>
                      <Field label="Dress code">
                        <Input {...form.register(`events.${index}.dressCode` as const)} />
                      </Field>
                      <Field label="Venue" className="sm:col-span-2">
                        <Input {...form.register(`events.${index}.venueName` as const)} />
                      </Field>
                    </div>
                  </div>
                ))}
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
                    })
                  }
                >
                  <Plus />
                  Add event
                </Button>
              </div>
            )}

            {step === 3 && (
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
                          onClick={() => form.setValue("themeSlug", theme.slug)}
                          className={cn(
                            "rounded-lg border p-3 text-left",
                            selected ? "border-primary ring-primary/30 ring-2" : "",
                          )}
                        >
                          <div
                            className="mb-2 h-10 rounded-md"
                            style={{
                              background: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.accent})`,
                            }}
                          />
                          <span className="text-xs font-medium">{theme.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Background music (optional)">
                  <Select
                    value={form.watch("musicTrackId")}
                    onValueChange={(v) => {
                      form.setValue("musicTrackId", v);
                      form.setValue("customMusicUrl", undefined);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No music" />
                    </SelectTrigger>
                    <SelectContent>
                      {musicTracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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

            {step === 4 && (
              <GuestPhotosStep invitationId={invitationId} media={media} onMediaChange={setMedia} />
            )}

            {step === 5 && (
              <>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="text-accent size-4" />
                      Generate copy with AI
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Writes your headline, invitation letter, and hashtags automatically.
                    </p>
                  </div>
                  <Switch
                    checked={form.watch("useAiCopy")}
                    onCheckedChange={(v) => form.setValue("useAiCopy", v)}
                  />
                </div>

                <div className="text-muted-foreground grid gap-1 text-sm">
                  <p>
                    <strong>{form.watch("brideName")}</strong> &amp;{" "}
                    <strong>{form.watch("groomName")}</strong>
                  </p>
                  <p>{form.watch("weddingDate")}</p>
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
          {step < STEPS.length - 1 ? (
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
                    : "Continue to publish"}
            </Button>
          )}
        </div>
      </form>

      <PublishOtpDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        invitationId={invitationId}
        onPublished={() => sessionStorage.removeItem(DRAFT_ID_STORAGE_KEY)}
      />
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
