"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, MapPin, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EVENT_CATEGORIES, eventCategoryFor } from "@/lib/event-categories";
import { quickCreateInvitationAction } from "@/lib/actions/guest-invitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Theme = {
  slug: string;
  name: string;
  eventCategory: string;
  eventCategories?: string[];
  previewImage?: string | null;
  isPremium: boolean;
  primary: string;
  accent: string;
};

export function QuickInvitationCreator({ themes }: { themes: Theme[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [eventCategory, setEventCategory] = useState("wedding");
  const [primaryName, setPrimaryName] = useState("");
  const [secondaryName, setSecondaryName] = useState("");
  const [date, setDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [themeSlug, setThemeSlug] = useState("");

  const category = eventCategoryFor(eventCategory);
  const visibleThemes = useMemo(() => {
    const exact = themes.filter(
      (theme) =>
        theme.eventCategory === eventCategory ||
        theme.eventCategories?.includes(eventCategory),
    );
    return exact.length ? exact : themes;
  }, [themes, eventCategory]);

  const selectedTheme = visibleThemes.find((theme) => theme.slug === themeSlug);

  function continueToDesign() {
    if (!primaryName.trim()) {
      toast.error(`Enter ${category.primaryNameLabel.toLowerCase()}.`);
      return;
    }
    if (!category.secondaryOptional && !secondaryName.trim()) {
      toast.error(`Enter ${category.secondaryNameLabel.toLowerCase()}.`);
      return;
    }
    if (!date) {
      toast.error("Choose the event date.");
      return;
    }
    if (!themeSlug && visibleThemes[0]) setThemeSlug(visibleThemes[0].slug);
    setStep(2);
  }

  async function createInvitation() {
    const chosen = themeSlug || visibleThemes[0]?.slug;
    if (!chosen) {
      toast.error("No theme is available yet.");
      return;
    }

    setSaving(true);
    const result = await quickCreateInvitationAction({
      eventCategory,
      primaryName,
      secondaryName,
      date,
      venueName,
      venueAddress,
      themeSlug: chosen,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Invitation created.");
    router.push(`/dashboard/publish/sections?invitationId=${result.data.invitationId}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center justify-center gap-2 text-xs font-bold">
        <span className={step === 1 ? "text-primary" : "text-muted-foreground"}>1. Details</span>
        <span className="text-muted-foreground">→</span>
        <span className={step === 2 ? "text-primary" : "text-muted-foreground"}>2. Design</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-muted-foreground">Done</span>
      </div>

      {step === 1 ? (
        <div className="grid gap-5 rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="font-display text-2xl">Tell us the basics</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Everything else is filled automatically and can be edited later.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Celebration</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {EVENT_CATEGORIES.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    setEventCategory(item.slug);
                    setThemeSlug("");
                  }}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    eventCategory === item.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:border-primary/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-4 ${category.secondaryOptional ? "" : "sm:grid-cols-2"}`}>
            <div className="grid gap-2">
              <Label>{category.primaryNameLabel}</Label>
              <Input value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} />
            </div>
            {!category.secondaryOptional && (
              <div className="grid gap-2">
                <Label>{category.secondaryNameLabel}</Label>
                <Input value={secondaryName} onChange={(e) => setSecondaryName(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {category.dateLabel}
              </Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="size-4" /> Venue
              </Label>
              <Input
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Venue name (optional)"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Venue address <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="City / full address"
            />
          </div>

          <Button size="lg" onClick={continueToDesign}>
            Continue to design
          </Button>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              <h2 className="font-display text-2xl">Choose one design</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Pick a look now. Colors, music, photos and sections can be changed later.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleThemes.map((theme) => {
                const active = (themeSlug || visibleThemes[0]?.slug) === theme.slug;
                return (
                  <button
                    key={theme.slug}
                    type="button"
                    onClick={() => setThemeSlug(theme.slug)}
                    className={`group overflow-hidden rounded-2xl border text-left transition ${
                      active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                    }`}
                  >
                    <div
                      className="relative aspect-[4/3] overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                      }}
                    >
                      {theme.previewImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={theme.previewImage} alt="" className="size-full object-cover" />
                      )}
                      {active && (
                        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-4" />
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold">{theme.name}</p>
                      {theme.isPremium && <p className="mt-0.5 text-[10px] font-bold uppercase text-primary">Premium</p>}
                    </div>
                  </button>
                );
              })}
            </div>

            {visibleThemes.length === 0 && (
              <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No themes available yet. Create a theme from Admin → Theme Library.
              </div>
            )}
          </div>

          <div className="sticky bottom-3 flex gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={saving}>
              Back
            </Button>
            <Button className="flex-[2]" onClick={createInvitation} disabled={saving || visibleThemes.length === 0}>
              {saving ? "Creating…" : selectedTheme ? `Create with ${selectedTheme.name}` : "Create invitation"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
