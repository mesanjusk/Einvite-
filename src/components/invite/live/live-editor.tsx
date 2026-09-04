"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Music,
  Palette,
  Pencil,
  Send,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PublishDialog, PublishSuccess } from "@/components/guest/publish-dialog";
import { publishInvitationAction } from "@/lib/actions/invitation";
import {
  addInviteEventAction,
  deleteInviteEventAction,
  patchInviteEventAction,
  patchInvitationAction,
  setFamilyMemberAction,
  setMediaOrderAction,
  setSectionVisibilityAction,
} from "@/lib/actions/live-invitation";
import type { LiveEventPatch, LivePatch } from "@/lib/validations/live-invitation";
import type { SectionConfigEntry } from "@/lib/get-invite-data";
import { InviteExperience } from "../invite-experience";
import {
  InviteEditProvider,
  type EditDateTarget,
  type EditPanel,
  type EditTarget,
} from "../edit-context";
import type { InviteData, InviteFamilyMember, InviteMedia } from "../types";
import { DesignSheet } from "./design-sheet";
import { MusicSheet } from "./music-sheet";
import { PhotosSheet } from "./photos-sheet";
import type { EditorTheme, EditorTrack } from "./types";

type VisibleSection = { id: string; label: string };

type BrowserDraftMemory = {
  version: 1;
  invitationId: string;
  savedAt: string;
  lastSectionId: string | null;
  completedSectionIds: string[];
  published: boolean;
  snapshot: unknown;
};

function browserDraftKey(invitationId: string) {
  return `einvite:guided-draft:${invitationId}`;
}

/**
 * Empty server fields deliberately stay empty in the database. The editor
 * paints realistic sample content over them only for preview, so a visitor
 * can understand the finished invitation before typing anything and sample
 * names can never accidentally be published as their own.
 */
function withSampleValues(invite: InviteData): InviteData {
  const twoPersonEvent = ["wedding", "engagement", "anniversary"].includes(
    invite.eventCategory,
  );
  const wedding = invite.eventCategory === "wedding";
  const brideName = invite.brideName.trim() || (wedding ? "Meera" : "Aarav");
  const groomName =
    invite.groomName.trim() || (twoPersonEvent ? (wedding ? "Aarav" : "Meera") : "");

  const familyMembers: InviteFamilyMember[] =
    wedding && invite.familyMembers.length === 0
      ? [
          {
            id: "sample-bride-father",
            side: "BRIDE",
            relation: "Father",
            name: "Rajesh Sharma",
            photo: null,
          },
          {
            id: "sample-bride-mother",
            side: "BRIDE",
            relation: "Mother",
            name: "Sunita Sharma",
            photo: null,
          },
          {
            id: "sample-groom-father",
            side: "GROOM",
            relation: "Father",
            name: "Mahesh Verma",
            photo: null,
          },
          {
            id: "sample-groom-mother",
            side: "GROOM",
            relation: "Mother",
            name: "Kavita Verma",
            photo: null,
          },
        ]
      : invite.familyMembers;

  return {
    ...invite,
    brideName,
    groomName,
    venueName: invite.venueName?.trim() || "The Royal Courtyard",
    venueAddress: invite.venueAddress?.trim() || "Jaipur, Rajasthan",
    customMessage:
      invite.customMessage?.trim() ||
      "With joyful hearts, we would love to celebrate this beautiful day with you.",
    copy: {
      ...(invite.copy ?? {}),
      invitationLetter:
        invite.copy?.invitationLetter?.trim() ||
        "Together with our families, we invite you to celebrate a day filled with love, laughter and beautiful memories.",
      storyHeadline: invite.copy?.storyHeadline?.trim() || "Our Story",
    },
    familyMembers,
    events: invite.events.map((event, index) => ({
      ...event,
      time: event.time?.trim() || ["11:00 AM", "7:00 PM", "6:30 PM"][index % 3],
      venueName: event.venueName?.trim() || "The Royal Courtyard",
      address: event.address?.trim() || "Jaipur, Rajasthan",
      tagline:
        event.tagline?.trim() ||
        ["A joyful beginning", "Music, dance & memories", "Together forever"][index % 3],
    })),
  };
}

/**
 * The live editor is preview-first and section-by-section.
 *
 * Every field still uses the existing optimistic server save path. The new
 * layer only controls *where* editing is allowed: scrolling is always a clean
 * preview, and tapping "Make it yours" activates the nearest section alone.
 * Browser memory stores progress plus a recovery snapshot, while the database
 * remains the source of truth for every actual invitation value.
 */
export function LiveEditor({
  invitationId,
  initialInvite,
  initialThemeStyle,
  initialSections,
  initialThemeSlug,
  initialColorwaySlug,
  initialMusicTrackId,
  initialCustomMusicUrl,
  themes,
  musicTracks,
  isPublished,
  isGuestFlow,
  appUrl,
}: {
  invitationId: string;
  initialInvite: InviteData;
  initialThemeStyle: CSSProperties;
  initialSections: SectionConfigEntry[];
  initialThemeSlug: string | null;
  initialColorwaySlug: string | null;
  initialMusicTrackId: string | null;
  initialCustomMusicUrl: string | null;
  themes: EditorTheme[];
  musicTracks: EditorTrack[];
  isPublished: boolean;
  /** True when nobody is signed in — publishing then goes through the phone/WhatsApp flow. */
  isGuestFlow: boolean;
  appUrl: string;
}) {
  const [invite, setInvite] = useState(initialInvite);
  const [themeStyle, setThemeStyle] = useState(initialThemeStyle);
  const [sections, setSections] = useState(initialSections);
  const [themeSlug, setThemeSlug] = useState(initialThemeSlug);
  const [colorwaySlug, setColorwaySlug] = useState(initialColorwaySlug);
  const [musicTrackId, setMusicTrackId] = useState(initialMusicTrackId);
  const [customMusicUrl, setCustomMusicUrl] = useState(initialCustomMusicUrl);
  const [published, setPublished] = useState(isPublished);

  // Null is deliberate: the first screen is always a clean sample preview.
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [visibleSection, setVisibleSection] = useState<VisibleSection | null>(null);
  const [completedSectionIds, setCompletedSectionIds] = useState<string[]>([]);
  const [sectionCount, setSectionCount] = useState(0);
  const [browserMemoryReady, setBrowserMemoryReady] = useState(false);
  const resumeSectionRef = useRef<string | null>(null);

  const [panel, setPanel] = useState<EditPanel | null>(null);
  const [focusMediaId, setFocusMediaId] = useState<string | undefined>();
  const [pending, setPending] = useState(0);
  const [publishAfterSave, setPublishAfterSave] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [ownerPublishResult, setOwnerPublishResult] = useState<string | null>(null);

  const displayInvite = useMemo(() => withSampleValues(invite), [invite]);
  const memoryKey = useMemo(() => browserDraftKey(invitationId), [invitationId]);

  // Restore only workflow progress from this browser. Invitation content
  // itself comes from the server so an older local snapshot can never roll a
  // newer autosave backwards.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(memoryKey);
      if (raw) {
        const memory = JSON.parse(raw) as Partial<BrowserDraftMemory>;
        if (memory.invitationId === invitationId) {
          if (Array.isArray(memory.completedSectionIds)) {
            setCompletedSectionIds(
              memory.completedSectionIds.filter((id): id is string => typeof id === "string"),
            );
          }
          if (typeof memory.lastSectionId === "string") {
            resumeSectionRef.current = memory.lastSectionId;
          }
        }
      }
    } catch {
      // Private browsing / storage restrictions should never block editing.
    } finally {
      setBrowserMemoryReady(true);
    }
  }, [invitationId, memoryKey]);

  // When returning in the same browser, resume near the slide the person was
  // working on, but in preview mode rather than dropping them into a caret.
  useEffect(() => {
    if (!browserMemoryReady || !resumeSectionRef.current) return;
    const resumeId = resumeSectionRef.current;
    const timer = window.setTimeout(() => {
      const node = Array.from(
        document.querySelectorAll<HTMLElement>("[data-invite-section-id]"),
      ).find((item) => item.dataset.inviteSectionId === resumeId);
      node?.scrollIntoView({ block: "start" });
      resumeSectionRef.current = null;
    }, 120);
    return () => window.clearTimeout(timer);
  }, [browserMemoryReady]);

  // The wrappers in InviteExperience expose each real slide as plain DOM.
  // Pick the slide closest to the viewport centre so exactly one popup follows
  // the visitor through the invitation.
  useEffect(() => {
    let frame = 0;

    const updateVisibleSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>("[data-invite-section-id]"),
        );
        setSectionCount(nodes.length);
        if (nodes.length === 0) {
          setVisibleSection(null);
          return;
        }

        const viewportCenter = window.innerHeight * 0.5;
        const candidates = nodes
          .map((node) => {
            const rect = node.getBoundingClientRect();
            const visible = rect.bottom > 72 && rect.top < window.innerHeight - 72;
            const center = rect.top + rect.height / 2;
            return { node, visible, distance: Math.abs(center - viewportCenter) };
          })
          .filter((item) => item.visible)
          .sort((a, b) => a.distance - b.distance);

        const current = candidates[0]?.node;
        if (!current) return;
        const id = current.dataset.inviteSectionId;
        if (!id) return;
        setVisibleSection({
          id,
          label: current.dataset.inviteSectionLabel || "Invitation section",
        });
      });
    };

    updateVisibleSection();
    window.addEventListener("scroll", updateVisibleSection, { passive: true });
    window.addEventListener("resize", updateVisibleSection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateVisibleSection);
      window.removeEventListener("resize", updateVisibleSection);
    };
  }, [sections, invite.events.length]);

  // Keep a small recovery record in this browser. This is intentionally in
  // addition to server autosave, not instead of it.
  useEffect(() => {
    if (!browserMemoryReady) return;
    const timer = window.setTimeout(() => {
      try {
        const memory: BrowserDraftMemory = {
          version: 1,
          invitationId,
          savedAt: new Date().toISOString(),
          lastSectionId: activeSectionId ?? visibleSection?.id ?? null,
          completedSectionIds,
          published,
          snapshot: {
            invite,
            themeSlug,
            colorwaySlug,
            musicTrackId,
            customMusicUrl,
            sections,
          },
        };
        window.localStorage.setItem(memoryKey, JSON.stringify(memory));
      } catch {
        // The server copy is already safe; local storage is only a convenience.
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [
    activeSectionId,
    browserMemoryReady,
    colorwaySlug,
    completedSectionIds,
    customMusicUrl,
    invitationId,
    invite,
    memoryKey,
    musicTrackId,
    published,
    sections,
    themeSlug,
    visibleSection?.id,
  ]);

  // A tap that lands while an earlier save is still in flight must not be
  // reported against the wrong one, so saves are simply counted.
  const trackSave = useCallback(async function trackSave<T>(
    run: () => Promise<{ success: true; data: T } | { success: false; error: string }>,
    onError?: () => void,
  ) {
    setPending((count) => count + 1);
    try {
      const result = await run();
      if (!result.success) {
        toast.error(result.error);
        onError?.();
        return null;
      }
      return result.data;
    } catch {
      toast.error("That change didn't save. Check your connection and try again.");
      onError?.();
      return null;
    } finally {
      setPending((count) => count - 1);
    }
  }, []);

  /**
   * The gallery keeps the order it is arranged in here, so a replaced photo
   * stays where it was in the pile rather than jumping to the end on the
   * guest's screen.
   */
  const applyMedia = useCallback(
    (media: InviteMedia[]) => {
      setInvite((current) => ({ ...current, media }));
      void trackSave(() =>
        setMediaOrderAction(
          invitationId,
          media.map((item) => item.id),
        ),
      );
    },
    [invitationId, trackSave],
  );

  const setText = useCallback(
    (target: EditTarget, value: string) => {
      if (target.kind === "invitation") {
        const previous = invite[target.field];
        setInvite((current) => ({ ...current, [target.field]: value }));
        void trackSave(
          () =>
            patchInvitationAction(invitationId, { [target.field]: value } as LivePatch),
          () => setInvite((current) => ({ ...current, [target.field]: previous })),
        ).then((data) => {
          // Naming the couple renames the link their guests will open.
          if (data?.slug) setInvite((current) => ({ ...current, slug: data.slug }));
        });
        return;
      }

      if (target.kind === "copy") {
        const previous = invite.copy;
        setInvite((current) => ({
          ...current,
          copy: { ...current.copy, [target.field]: value },
        }));
        void trackSave(
          () =>
            patchInvitationAction(invitationId, {
              copy: { [target.field]: value },
            } as LivePatch),
          () => setInvite((current) => ({ ...current, copy: previous })),
        );
        return;
      }

      if (target.kind === "family") {
        const previous = invite.familyMembers;
        const isSlot = (member: InviteFamilyMember) =>
          member.side === target.side &&
          member.relation.trim().toLowerCase() === target.relation.toLowerCase();
        const existing = previous.find(isSlot);
        const others = previous.filter((member) => !isSlot(member));
        // Shown before the write lands, so a name doesn't blink out of the
        // "daughter of …" line between the tap and the save.
        const optimistic = !value.trim()
          ? others
          : [
              ...others,
              existing
                ? { ...existing, name: value }
                : {
                    id: `pending-${target.side}-${target.relation}`,
                    side: target.side,
                    relation: target.relation,
                    name: value,
                    photo: null,
                  },
            ];

        setInvite((current) => ({ ...current, familyMembers: optimistic }));
        void trackSave(
          () =>
            setFamilyMemberAction(invitationId, target.side, target.relation, value),
          () => setInvite((current) => ({ ...current, familyMembers: previous })),
        ).then((data) => {
          if (data)
            setInvite((current) => ({ ...current, familyMembers: data.members }));
        });
        return;
      }

      const previousEvents = invite.events;
      setInvite((current) => ({
        ...current,
        events: current.events.map((event) =>
          event.id === target.eventId ? { ...event, [target.field]: value } : event,
        ),
      }));
      void trackSave(
        () =>
          patchInviteEventAction(target.eventId, {
            [target.field]: value,
          } as LiveEventPatch),
        () => setInvite((current) => ({ ...current, events: previousEvents })),
      );
    },
    [invitationId, invite, trackSave],
  );

  const setDate = useCallback(
    (target: EditDateTarget, value: string) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);

      if (target.kind === "invitation") {
        const previous = invite.weddingDate;
        setInvite((current) => ({ ...current, weddingDate: parsed }));
        void trackSave(
          () => patchInvitationAction(invitationId, { weddingDate: value }),
          () => setInvite((current) => ({ ...current, weddingDate: previous })),
        );
        return;
      }

      const previousEvents = invite.events;
      setInvite((current) => ({
        ...current,
        events: current.events.map((event) =>
          event.id === target.eventId ? { ...event, date: parsed } : event,
        ),
      }));
      void trackSave(
        () => patchInviteEventAction(target.eventId, { date: value }),
        () => setInvite((current) => ({ ...current, events: previousEvents })),
      );
    },
    [invitationId, invite, trackSave],
  );

  const addEvent = useCallback(() => {
    void trackSave(() => addInviteEventAction(invitationId)).then((data) => {
      if (!data) return;
      setInvite((current) => ({ ...current, events: [...current.events, data] }));
    });
  }, [invitationId, trackSave]);

  const removeEvent = useCallback(
    (eventId: string) => {
      const previousEvents = invite.events;
      setInvite((current) => ({
        ...current,
        events: current.events.filter((event) => event.id !== eventId),
      }));
      void trackSave(
        () => deleteInviteEventAction(eventId),
        () => setInvite((current) => ({ ...current, events: previousEvents })),
      );
    },
    [invite.events, trackSave],
  );

  const openPanel = useCallback((next: EditPanel, mediaId?: string) => {
    setFocusMediaId(mediaId);
    setPanel(next);
  }, []);

  // Outer edit mode stays available so empty sections still render. Each
  // section receives a *scoped* provider inside InviteExperience and only the
  // active section gets true edit affordances.
  const editApi = useMemo(
    () => ({
      active: true,
      setText,
      setDate,
      addEvent,
      removeEvent,
      openPanel,
      pending,
    }),
    [setText, setDate, addEvent, removeEvent, openPanel, pending],
  );

  function applyPatchResult(data: {
    themeStyle: Record<string, string>;
    musicUrl: string | null;
  }) {
    setThemeStyle(data.themeStyle as CSSProperties);
    setInvite((current) => ({ ...current, musicUrl: data.musicUrl }));
  }

  function handleThemeChange(slug: string) {
    const previous = { themeSlug, colorwaySlug, themeStyle };
    setThemeSlug(slug);
    setColorwaySlug(null);
    void trackSave(
      () => patchInvitationAction(invitationId, { themeSlug: slug }),
      () => {
        setThemeSlug(previous.themeSlug);
        setColorwaySlug(previous.colorwaySlug);
        setThemeStyle(previous.themeStyle);
      },
    ).then((data) => data && applyPatchResult(data));
  }

  function handleColorwayChange(slug: string | null) {
    const previous = { colorwaySlug, themeStyle };
    setColorwaySlug(slug);
    void trackSave(
      () => patchInvitationAction(invitationId, { colorwaySlug: slug }),
      () => {
        setColorwaySlug(previous.colorwaySlug);
        setThemeStyle(previous.themeStyle);
      },
    ).then((data) => data && applyPatchResult(data));
  }

  function handleGalleryAnimation(value: string) {
    const previous = invite.galleryAnimation;
    setInvite((current) => ({ ...current, galleryAnimation: value }));
    void trackSave(
      () =>
        patchInvitationAction(invitationId, {
          galleryAnimation: value as "fade" | "slide" | "zoom" | "flip" | "blur",
        }),
      () => setInvite((current) => ({ ...current, galleryAnimation: previous })),
    );
  }

  function handleSectionToggle(sectionId: string, visible: boolean) {
    const previous = sections;
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, visible } : section,
      ),
    );
    void trackSave(
      () => setSectionVisibilityAction(invitationId, sectionId, visible),
      () => setSections(previous),
    );
  }

  function handleTrackSelect(trackId: string) {
    const previous = { musicTrackId, customMusicUrl };
    setMusicTrackId(trackId);
    setCustomMusicUrl(null);
    void trackSave(
      () => patchInvitationAction(invitationId, { musicTrackId: trackId }),
      () => {
        setMusicTrackId(previous.musicTrackId);
        setCustomMusicUrl(previous.customMusicUrl);
      },
    ).then((data) => data && applyPatchResult(data));
  }

  function handleCustomMusic(url: string) {
    setCustomMusicUrl(url);
    setMusicTrackId(null);
    void trackSave(() =>
      patchInvitationAction(invitationId, { customMusicUrl: url }),
    ).then((data) => data && applyPatchResult(data));
  }

  function handleMusicClear() {
    const previous = { musicTrackId, customMusicUrl };
    setMusicTrackId(null);
    setCustomMusicUrl(null);
    void trackSave(
      () =>
        patchInvitationAction(invitationId, {
          musicTrackId: null,
          customMusicUrl: null,
        }),
      () => {
        setMusicTrackId(previous.musicTrackId);
        setCustomMusicUrl(previous.customMusicUrl);
      },
    ).then((data) => data && applyPatchResult(data));
  }

  const shareUrl = `${appUrl}/invite/${invite.slug}`;

  const continuePublish = useCallback(() => {
    if (isGuestFlow) {
      setPublishOpen(true);
      return;
    }
    void trackSave(() => publishInvitationAction(invitationId)).then((data) => {
      if (!data) return;
      setPublished(true);
      setOwnerPublishResult(`${appUrl}/invite/${invite.slug}`);
    });
  }, [appUrl, invitationId, invite.slug, isGuestFlow, trackSave]);

  function handlePublish() {
    if (activeSectionId) {
      toast.message("Finish this slide and return to preview before publishing.");
      return;
    }
    // Sample names are presentation only. An actual name must exist in the
    // saved invitation before the draft is allowed to go live.
    if (!invite.brideName.trim()) {
      toast.error("Personalize the Names & welcome slide before publishing.");
      const hero = document.querySelector<HTMLElement>(
        '[data-invite-section-label="Names & welcome"]',
      );
      hero?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (pending > 0) {
      setPublishAfterSave(true);
      toast.message("Finishing autosave before publishing…");
      return;
    }
    continuePublish();
  }

  // A publish tap during an in-flight field save becomes a queued publish,
  // never a race between "save" and "go live".
  useEffect(() => {
    if (!publishAfterSave || pending > 0 || activeSectionId) return;
    setPublishAfterSave(false);
    continuePublish();
  }, [activeSectionId, continuePublish, pending, publishAfterSave]);

  function beginSectionEdit(section: VisibleSection) {
    setActiveSectionId(section.id);
    const node = Array.from(
      document.querySelectorAll<HTMLElement>("[data-invite-section-id]"),
    ).find((item) => item.dataset.inviteSectionId === section.id);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function finishSectionEdit() {
    if (!activeSectionId) return;
    const finishedId = activeSectionId;
    setCompletedSectionIds((current) =>
      current.includes(finishedId) ? current : [...current, finishedId],
    );
    setActiveSectionId(null);
    toast.success(pending > 0 ? "Preview restored — autosave is finishing." : "Saved. Preview restored.");
  }

  const activeSectionLabel = activeSectionId
    ? Array.from(
        typeof document === "undefined"
          ? []
          : document.querySelectorAll<HTMLElement>("[data-invite-section-id]"),
      ).find((item) => item.dataset.inviteSectionId === activeSectionId)?.dataset
        .inviteSectionLabel ?? "This slide"
    : null;

  // A sheet or dialog is the thing being looked at while it is open, so the
  // editor's own always-on-top furniture gets out from in front of it.
  const overlayOpen = panel !== null || publishOpen || Boolean(ownerPublishResult);

  return (
    <InviteEditProvider value={editApi}>
      <div
        className={cn(
          "relative mx-auto max-w-[430px] overflow-x-hidden pt-14 pb-28",
          overlayOpen && "inv-sheet-open",
        )}
        style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
      >
        <InviteExperience
          invite={displayInvite}
          sectionConfig={sections}
          skipEnvelope
          guidedActiveSectionId={activeSectionId}
        />
      </div>

      {!overlayOpen && (
        <EditorTopBar
          pending={pending}
          published={published}
          publishQueued={publishAfterSave}
          completed={completedSectionIds.length}
          total={sectionCount}
          onOpenDesign={() => openPanel("design")}
          onOpenMusic={() => openPanel("music")}
          onPublish={handlePublish}
        />
      )}

      {!overlayOpen && (
        <GuidedDock
          activeSectionId={activeSectionId}
          activeSectionLabel={activeSectionLabel}
          visibleSection={visibleSection}
          completedSectionIds={completedSectionIds}
          pending={pending}
          onEdit={beginSectionEdit}
          onDone={finishSectionEdit}
        />
      )}

      <DesignSheet
        open={panel === "design"}
        onOpenChange={(open) => setPanel(open ? "design" : null)}
        themes={themes}
        activeThemeSlug={themeSlug}
        activeColorwaySlug={colorwaySlug}
        galleryAnimation={invite.galleryAnimation}
        sections={sections}
        onThemeChange={handleThemeChange}
        onColorwayChange={handleColorwayChange}
        onGalleryAnimationChange={handleGalleryAnimation}
        onSectionToggle={handleSectionToggle}
      />

      <MusicSheet
        open={panel === "music"}
        onOpenChange={(open) => setPanel(open ? "music" : null)}
        invitationId={invitationId}
        tracks={musicTracks}
        selectedTrackId={musicTrackId}
        customMusicUrl={customMusicUrl}
        onSelectTrack={handleTrackSelect}
        onCustomUrl={handleCustomMusic}
        onClear={handleMusicClear}
      />

      <PhotosSheet
        open={panel === "photos"}
        onOpenChange={(open) => setPanel(open ? "photos" : null)}
        invitationId={invitationId}
        media={invite.media}
        focusMediaId={focusMediaId}
        coverPhoto={invite.bridePhoto}
        onReplace={(mediaId, next) =>
          applyMedia(invite.media.map((item) => (item.id === mediaId ? next : item)))
        }
        onRemove={(mediaId) =>
          applyMedia(invite.media.filter((item) => item.id !== mediaId))
        }
        onAdd={(next) => applyMedia([...invite.media, next])}
        onCoverChange={(url) =>
          setInvite((current) => ({ ...current, bridePhoto: url }))
        }
      />

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        invitationId={invitationId}
        onPublished={() => setPublished(true)}
      />

      <Dialog
        open={Boolean(ownerPublishResult)}
        onOpenChange={(open) => !open && setOwnerPublishResult(null)}
      >
        <DialogContent>
          <PublishSuccess liveUrl={shareUrl} invitationId={invitationId} />
        </DialogContent>
      </Dialog>
    </InviteEditProvider>
  );
}

function EditorTopBar({
  pending,
  published,
  publishQueued,
  completed,
  total,
  onOpenDesign,
  onOpenMusic,
  onPublish,
}: {
  pending: number;
  published: boolean;
  publishQueued: boolean;
  completed: number;
  total: number;
  onOpenDesign: () => void;
  onOpenMusic: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="no-print fixed inset-x-0 top-0 z-[100000] flex justify-center px-2 pt-2">
      <div className="flex h-12 w-full max-w-[430px] items-center gap-2 rounded-2xl border border-[#e8d8c8] bg-[#fffdf9]/96 px-2.5 shadow-[0_8px_28px_rgba(82,33,43,0.14)] backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 shrink-0 text-[#9a6b47]" />
            <p className="truncate text-[10px] font-extrabold tracking-[0.14em] text-[#651d33] uppercase">
              Your live preview
            </p>
          </div>
          <p className="mt-0.5 text-[9px] text-[#8a746a]">
            {pending > 0
              ? `Saving ${pending} change${pending === 1 ? "" : "s"}…`
              : publishQueued
                ? "Saved — preparing publish…"
                : `Autosaved · ${Math.min(completed, total)}/${total || "–"} slides personalized`}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDesign}
          aria-label="Change design"
          className="grid size-8 place-items-center rounded-full border border-[#eadfd3] bg-white text-[#651d33]"
        >
          <Palette className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onOpenMusic}
          aria-label="Change music"
          className="grid size-8 place-items-center rounded-full border border-[#eadfd3] bg-white text-[#651d33]"
        >
          <Music className="size-3.5" />
        </button>
        <Button
          size="sm"
          onClick={onPublish}
          className="h-8 rounded-full bg-[#651d33] px-3 text-[10px] font-bold text-white hover:bg-[#54172a]"
        >
          <Send className="size-3.5" />
          {published ? "Share" : "Publish"}
        </Button>
      </div>
    </div>
  );
}

function GuidedDock({
  activeSectionId,
  activeSectionLabel,
  visibleSection,
  completedSectionIds,
  pending,
  onEdit,
  onDone,
}: {
  activeSectionId: string | null;
  activeSectionLabel: string | null;
  visibleSection: VisibleSection | null;
  completedSectionIds: string[];
  pending: number;
  onEdit: (section: VisibleSection) => void;
  onDone: () => void;
}) {
  if (activeSectionId) {
    return (
      <div className="no-print fixed inset-x-0 bottom-0 z-[100000] flex justify-center px-3 pb-3">
        <div className="flex w-full max-w-[410px] items-center gap-3 rounded-2xl border border-[#d9c7b6] bg-[#fffdf9]/97 p-3 shadow-[0_-8px_32px_rgba(82,33,43,0.18)] backdrop-blur-xl">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#651d33] text-white">
            <Pencil className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold tracking-[0.16em] text-[#9a6b47] uppercase">
              Editing one slide
            </p>
            <p className="truncate text-sm font-bold text-[#4e2630]">
              {activeSectionLabel ?? "This slide"}
            </p>
            <p className="text-[10px] text-[#8a746a]">
              {pending > 0 ? "Autosaving your change…" : "Tap highlighted text or controls to edit."}
            </p>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="shrink-0 rounded-full bg-[#e4bb68] px-3.5 py-2 text-[10px] font-extrabold text-[#4c1627] shadow-sm"
          >
            Done & preview
          </button>
        </div>
      </div>
    );
  }

  if (!visibleSection) return null;
  const completed = completedSectionIds.includes(visibleSection.id);

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[100000] flex justify-center px-3 pb-3">
      <div className="pointer-events-auto flex w-full max-w-[390px] items-center gap-3 rounded-2xl border border-[#e2d2c2] bg-[#fffdf9]/96 p-3 shadow-[0_-8px_32px_rgba(82,33,43,0.16)] backdrop-blur-xl">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            completed ? "bg-[#edf6ee] text-[#487452]" : "bg-[#f6eadc] text-[#8d603e]",
          )}
        >
          {completed ? <CheckCircle2 className="size-4" /> : <Pencil className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-extrabold tracking-[0.16em] text-[#9a6b47] uppercase">
            {completed ? "Personalized" : "Sample preview"}
          </p>
          <p className="truncate text-sm font-bold text-[#4e2630]">{visibleSection.label}</p>
          <p className="text-[10px] text-[#8a746a]">Scroll naturally. Edit only when this slide feels right.</p>
        </div>
        <button
          type="button"
          onClick={() => onEdit(visibleSection)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-[#651d33] px-3.5 py-2 text-[10px] font-extrabold text-white shadow-sm"
        >
          <Pencil className="size-3" />
          {completed ? "Edit again" : "Make it yours"}
        </button>
      </div>
    </div>
  );
}
