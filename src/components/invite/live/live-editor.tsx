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
import { GeminiStylePanel } from "@/components/admin/gemini-style-panel";
import { designPreview } from "@/lib/media/design-preview";
import { safeDesignSuggestion, type DesignSuggestion } from "@/lib/design-assist";
import { elementsForSection } from "@/lib/theme-element-catalog";
import { saveInvitationDesignAction } from "@/lib/actions/invitation-design";
import { updateInvitationGeminiKeyAction } from "@/lib/actions/video";
import {
  Layers,
  Music,
  Palette,
  Pencil,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";
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
  replaceInvitationSectionsAction,
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
import { sectionDisplayName } from "@/lib/section-labels";
import { independentSections } from "@/lib/invitation-sections";
import { SectionsSheet } from "./sections-sheet";
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
  const [sections, setSections] = useState(independentSections(initialSections, initialInvite.events));
  const [aiKey, setAiKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<DesignSuggestion | null>(null);
  const aiVersion = useRef(0);
  const [themeSlug, setThemeSlug] = useState(initialThemeSlug);
  const [colorwaySlug, setColorwaySlug] = useState(initialColorwaySlug);
  const [musicTrackId, setMusicTrackId] = useState(initialMusicTrackId);
  const [customMusicUrl, setCustomMusicUrl] = useState(initialCustomMusicUrl);
  const [published, setPublished] = useState(isPublished);
  const [revealPreviewVersion, setRevealPreviewVersion] = useState(0);
  const [envelopeOpenVersion, setEnvelopeOpenVersion] = useState(0);

  // Null is deliberate: the first screen is always a clean sample preview.
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [visibleSection, setVisibleSection] = useState<VisibleSection | null>(null);
  const [completedSectionIds, setCompletedSectionIds] = useState<string[]>([]);

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
  }, [sections, invite.events.length, envelopeOpenVersion]);

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
          lastSectionId: visibleSection?.id ?? null,
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

  const addEvent = useCallback((name?: string) => {
    void trackSave(() => addInviteEventAction(invitationId, name)).then((data) => {
      if (!data) return;
      setInvite((current) => ({ ...current, events: [...current.events, data] }));
      if (data.sectionConfig) setSections(data.sectionConfig);
    });
  }, [invitationId, trackSave]);

  const removeEvent = useCallback(
    (eventId: string) => {
      const previousEvents = invite.events;
      const previousSections = sections;
      setInvite((current) => ({
        ...current,
        events: current.events.filter((event) => event.id !== eventId),
      }));
      setSections((current) => current.filter((section) => section.eventId !== eventId));
      void trackSave(
        () => deleteInviteEventAction(eventId),
        () => { setInvite((current) => ({ ...current, events: previousEvents })); setSections(previousSections); },
      );
    },
    [invite.events, sections, trackSave],
  );

  const openPanel = useCallback((next: EditPanel, mediaId?: string) => {
    setFocusMediaId(mediaId);
    setPanel(next);
  }, []);

  // One global edit session enables all sections; writes still autosave per field.
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
    themeSlug: string | null;
    revealVideoUrl: string | null;
    revealVideoWebmUrl: string | null;
    revealVideoPosterUrl: string | null;
    revealAnimation: InviteData["revealAnimation"];
    sectionImages: InviteData["sectionImages"];
    elementStyles: InviteData["elementStyles"];
    customText: InviteData["customText"];
    sectionStyles: InviteData["sectionStyles"];
  }) {
    setThemeStyle(data.themeStyle as CSSProperties);
    setInvite((current) => ({
      ...current,
      musicUrl: data.musicUrl,
      themeSlug: data.themeSlug,
      revealVideoUrl: data.revealVideoUrl,
      revealVideoWebmUrl: data.revealVideoWebmUrl,
      revealVideoPosterUrl: data.revealVideoPosterUrl,
      revealAnimation: data.revealAnimation,
      sectionImages: data.sectionImages,
      elementStyles: data.elementStyles,
      customText: data.customText,
      sectionStyles: data.sectionStyles,
    }));
  }

  async function applySmartDesign(suggestion: DesignSuggestion) {
    const data = await trackSave(() => saveInvitationDesignAction(invitationId, suggestion));
    if (data) { setThemeStyle(data.themeStyle); setSections(data.sectionConfig); setInvite((current) => ({ ...current, elementStyles: data.inviteData.elementStyles, customText: data.inviteData.customText, sectionStyles: data.inviteData.sectionStyles })); toast.success("Smart styling saved. Review the full invitation preview."); }
  }

  async function analyzeDesignFile(file: File, automatic = false) {
    const version = ++aiVersion.current;
    const elements = sections.flatMap((section) => [
      ...elementsForSection(section.type).map((element) => ({ key: element.key, text: invite.elementStyles?.[element.key]?.text || element.fallbackText || element.label })),
      ...(invite.customText?.[section.type] ?? []).map((block) => ({ key: block.id, text: block.text })),
    ]);
    if (!elements.length) return;
    setAiBusy(true);
    try {
      const response = await fetch("/api/design/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId, apiKey: aiKey || undefined, image: await designPreview(file), elements }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Smart styling unavailable.");
      if (version !== aiVersion.current) return;
      if (data.skipped) { if (!automatic) toast.info(data.message); return; }
      const suggestion = safeDesignSuggestion(data.suggestion, elements.map((element) => element.key));
      setAiSuggestion(suggestion);
      // A user can disable automatic styling and apply the reviewed suggestion later.
      if (automatic) await applySmartDesign(suggestion);
      else toast.success("Suggestion ready. Apply it to preview and save.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Smart styling unavailable. Continue editing manually."); }
    finally { if (version === aiVersion.current) setAiBusy(false); }
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

  function handleIntroVideoChange(value: {
    mp4Url: string | null;
    webmUrl: string | null;
    posterUrl: string | null;
  }) {
    setInvite((current) => ({
      ...current,
      revealVideoUrl: value.mp4Url,
      revealVideoWebmUrl: value.webmUrl,
      revealVideoPosterUrl: value.posterUrl,
    }));
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

  function previewOpening() {
    setPanel(null);
    setActiveSectionId(null);
    setRevealPreviewVersion((value) => value + 1);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
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
    setActiveSectionId(null);
    // Sample names are presentation only. An actual name must exist in the
    // saved invitation before the draft is allowed to go live.
    if (!invite.brideName.trim()) {
      toast.error(`Personalize the ${sectionDisplayName("HERO")} slide before publishing.`);
      const hero = document.querySelector<HTMLElement>(
        `[data-invite-section-label="${sectionDisplayName("HERO")}"]`,
      );
      hero?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setPublishAfterSave(true);
    if (pending > 0) toast.message("Finishing autosave before publishing…");
  }

  // A publish tap during an in-flight field save becomes a queued publish,
  // never a race between "save" and "go live".
  useEffect(() => {
    if (!publishAfterSave || pending > 0 || activeSectionId) return;
    setPublishAfterSave(false);
    continuePublish();
  }, [activeSectionId, continuePublish, pending, publishAfterSave]);

  function finishSectionEdit() {
    if (!activeSectionId) return;
    setCompletedSectionIds((current) =>
      Array.from(new Set([...current, ...Array.from(document.querySelectorAll<HTMLElement>("[data-invite-section-id]")).map((node) => node.dataset.inviteSectionId!).filter(Boolean)])),
    );
    setActiveSectionId(null);
    toast.success(pending > 0 ? "Preview restored — autosave is finishing." : "Saved. Preview restored.");
  }

  // A sheet or dialog is the thing being looked at while it is open, so the
  // editor's own always-on-top furniture gets out from in front of it.
  const overlayOpen = panel !== null || publishOpen || Boolean(ownerPublishResult);

  return (
    <InviteEditProvider value={editApi}>
      <div
        className={cn(
          "relative mx-auto max-w-[430px] overflow-x-hidden pt-2 pb-32",
          overlayOpen && "inv-sheet-open",
        )}
        style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
      >
        <InviteExperience
          key={`mobile-invite-preview-${revealPreviewVersion}`}
          invite={displayInvite}
          sectionConfig={sections}
          guidedActiveSectionId={activeSectionId ? undefined : null}
          onEnvelopeComplete={() => setEnvelopeOpenVersion((value) => value + 1)}
        />
      </div>

      {!overlayOpen && <EditorFooter pending={pending} published={published} editing={Boolean(activeSectionId)} onEdit={() => activeSectionId ? finishSectionEdit() : setActiveSectionId("all")} onDesign={() => openPanel("design")} onSections={() => openPanel("sections")} onMusic={() => openPanel("music")} onPublish={handlePublish} />}
      <SectionsSheet open={panel === "sections"} onOpenChange={(open) => setPanel(open ? "sections" : null)} sections={sections} pending={pending > 0} onChange={(next) => {
        const previous = sections;
        setSections(next);
        void trackSave(() => replaceInvitationSectionsAction(invitationId, next), () => setSections(previous)).then((data) => { if (data) { setSections(data.sectionConfig); setInvite((current) => ({ ...current, events: data.events })); } });
      }} />

      <DesignSheet
        designAssistant={<GeminiStylePanel apiKey={aiKey} onApiKey={setAiKey} enabled={aiEnabled} onEnabled={setAiEnabled} busy={aiBusy || pending > 0} ready={Boolean(aiSuggestion)} onApply={() => { if (aiSuggestion) void applySmartDesign(aiSuggestion); }} onAnalyze={(file) => void analyzeDesignFile(file)} onSaveKey={(key) => { void trackSave(async () => { const result = await updateInvitationGeminiKeyAction({ invitationId, geminiApiKey: key }); return result.success ? { success: true as const, data: true } : result; }).then((saved) => { if (saved) { setAiKey(""); toast.success(key ? "Gemini key saved for this invitation." : "Saved Gemini key cleared."); } }); }} />}
        onAssetUploaded={(file) => { if (aiEnabled) void analyzeDesignFile(file, true); }}
        open={panel === "design"}
        onOpenChange={(open) => setPanel(open ? "design" : null)}
        themes={themes}
        activeThemeSlug={themeSlug}
        activeColorwaySlug={colorwaySlug}
        galleryAnimation={invite.galleryAnimation}
        sections={sections}
        invitationId={invitationId}
        introVideo={{
          mp4Url: invite.revealVideoUrl,
          webmUrl: invite.revealVideoWebmUrl ?? null,
          posterUrl: invite.revealVideoPosterUrl ?? null,
        }}
        onIntroVideoChange={handleIntroVideoChange}
        onThemeChange={handleThemeChange}
        onColorwayChange={handleColorwayChange}
        onGalleryAnimationChange={handleGalleryAnimation}
        onSectionToggle={handleSectionToggle}
        onPreviewOpening={previewOpening}
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
        onAssetUploaded={(file) => { if (aiEnabled) void analyzeDesignFile(file, true); }}
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

function EditorFooter({ pending, published, editing, onEdit, onDesign, onSections, onMusic, onPublish }: { pending: number; published: boolean; editing: boolean; onEdit: () => void; onDesign: () => void; onSections: () => void; onMusic: () => void; onPublish: () => void }) {
  return <footer className="no-print fixed inset-x-0 bottom-0 z-[100000] flex justify-center border-t border-violet-100 bg-white/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_22px_rgba(82,33,43,0.12)] backdrop-blur-xl">
    <div className="w-full max-w-[430px]">
      <p aria-live="polite" className="pb-1 text-center text-[9px] text-violet-700">{pending ? "Autosaving changes…" : "Draft autosaved"}{editing ? " · Edit any section" : ""}</p>
      <nav aria-label="Invitation editor" className="grid grid-cols-5 items-center gap-1">
        <button type="button" onClick={onDesign} className="grid justify-items-center gap-1 py-2 text-[10px]"><Palette className="size-5" />Design</button>
        <button type="button" onClick={onSections} className="grid justify-items-center gap-1 py-2 text-[10px]"><Layers className="size-5" />Sections</button>
        <button type="button" aria-label={editing ? "Done & preview" : "Edit all sections"} onClick={onEdit} className="grid justify-items-center gap-1 text-[10px] font-semibold text-violet-800"><span className="grid size-12 place-items-center rounded-full bg-violet-700 text-white shadow-md"><Pencil className="size-6" /></span>{editing ? "Preview" : "Edit"}</button>
        <button type="button" onClick={onMusic} className="grid justify-items-center gap-1 py-2 text-[10px]"><Music className="size-5" />Music</button>
        <button type="button" onClick={onPublish} className="grid justify-items-center gap-1 py-2 text-[10px]"><Send className="size-5" />{published ? "Share" : "Publish"}</button>
      </nav>
    </div>
  </footer>;
}
