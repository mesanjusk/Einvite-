"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { Eye, Images, Music, Palette, Pencil, Send } from "lucide-react";

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

/**
 * The live editor.
 *
 * This is the invitation — the same components, the same animations, the
 * same order guests scroll through — with a save path attached to the text
 * and the photos. Nothing here is a preview of a form filled in somewhere
 * else, which is the point: a couple changes their invitation by changing
 * their invitation.
 *
 * Every edit is optimistic: local state moves first so the page never
 * flickers or waits, and the write follows. A rejected write puts the old
 * value back and says so.
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

  const [preview, setPreview] = useState(false);
  const [panel, setPanel] = useState<EditPanel | null>(null);
  const [focusMediaId, setFocusMediaId] = useState<string | undefined>();
  const [pending, setPending] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [ownerPublishResult, setOwnerPublishResult] = useState<string | null>(null);

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

  const editApi = useMemo(
    () => ({
      active: !preview,
      setText,
      setDate,
      addEvent,
      removeEvent,
      openPanel,
      pending,
    }),
    [preview, setText, setDate, addEvent, removeEvent, openPanel, pending],
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

  function handlePublish() {
    if (!invite.brideName.trim()) {
      toast.error("Add the names first — tap them on the invitation.");
      return;
    }
    if (isGuestFlow) {
      setPublishOpen(true);
      return;
    }
    void trackSave(() => publishInvitationAction(invitationId)).then((data) => {
      if (!data) return;
      setPublished(true);
      setOwnerPublishResult(`${appUrl}/invite/${invite.slug}`);
    });
  }

  const shareUrl = `${appUrl}/invite/${invite.slug}`;

  // A sheet or dialog is the thing being looked at while it is open, so the
  // editor's own always-on-top furniture gets out from in front of it.
  const overlayOpen = panel !== null || publishOpen || Boolean(ownerPublishResult);

  return (
    <InviteEditProvider value={editApi}>
      <div
        className={cn(
          "relative mx-auto max-w-[430px] overflow-x-hidden pb-24",
          overlayOpen && "inv-sheet-open",
        )}
        style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
      >
        <InviteExperience invite={invite} sectionConfig={sections} skipEnvelope />
      </div>

      {!overlayOpen && (
        <Toolbar
          preview={preview}
          pending={pending}
          published={published}
          onTogglePreview={() => setPreview((current) => !current)}
          onOpenPanel={(next) => openPanel(next)}
          onPublish={handlePublish}
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

function Toolbar({
  preview,
  pending,
  published,
  onTogglePreview,
  onOpenPanel,
  onPublish,
}: {
  preview: boolean;
  pending: number;
  published: boolean;
  onTogglePreview: () => void;
  onOpenPanel: (panel: EditPanel) => void;
  onPublish: () => void;
}) {
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-[100000] flex justify-center px-3 pb-3">
      <div className="bg-background/95 flex w-full max-w-[430px] flex-col gap-2 rounded-2xl border p-2 shadow-[0_-6px_30px_rgba(0,0,0,0.18)] backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <ToolbarButton
              icon={<Palette className="size-4" />}
              label="Design"
              onClick={() => onOpenPanel("design")}
              disabled={preview}
            />
            <ToolbarButton
              icon={<Images className="size-4" />}
              label="Photos"
              onClick={() => onOpenPanel("photos")}
              disabled={preview}
            />
            <ToolbarButton
              icon={<Music className="size-4" />}
              label="Music"
              onClick={() => onOpenPanel("music")}
              disabled={preview}
            />
            <ToolbarButton
              icon={
                preview ? <Pencil className="size-4" /> : <Eye className="size-4" />
              }
              label={preview ? "Edit" : "Preview"}
              onClick={onTogglePreview}
            />
          </div>

          <Button size="sm" onClick={onPublish} className="shrink-0">
            <Send className="size-4" />
            {published ? "Share" : "Publish"}
          </Button>
        </div>

        <p className="text-muted-foreground text-center text-[11px]">
          {pending > 0
            ? "Saving…"
            : preview
              ? "This is what your guests see. Tap Edit to keep changing it."
              : "Tap any words or photo on the invitation to change it."}
        </p>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-muted-foreground hover:text-foreground flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px]",
        "disabled:opacity-40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
