"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Copy,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Video,
  X,
} from "lucide-react";

import {
  REVEAL_ANIMATION_PRESETS,
  SECTION_TYPES,
  THEME_CATEGORIES,
  themeFormSchema,
  type ThemeFormInput,
  type ThemeFormValues,
} from "@/lib/validations/admin";
import { upsertThemeAction } from "@/lib/actions/admin";
import {
  COMMUNITY_CONTENT_GROUPS,
  COMMUNITY_CONTENT_PRESETS,
} from "@/lib/theme-content-library";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeRealSectionPreview } from "@/components/admin/theme-real-section-preview";
import {
  ThemeElementInspector,
  type ThemeElementStyleValue,
} from "@/components/admin/theme-element-inspector";
import {
  definitionForElement,
  elementsForSection,
} from "@/lib/theme-element-catalog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DecorAssets = {
  revealAnimation?: {
    preset?: (typeof REVEAL_ANIMATION_PRESETS)[number];
    intensity?: number;
    speed?: number;
  };
  sectionImages?: Record<string, string>;
  sectionTextBlocks?: Record<
    string,
    Array<{
      id: string;
      text: string;
      fontSize: number;
      fontRole: "display" | "body" | "script";
      align: "left" | "center" | "right";
      color?: string;
    }>
  >;
  elementStyles?: Record<string, ThemeElementStyleValue>;
  customText?: Record<
    string,
    Array<{
      id: string;
      text: string;
      fontSize: number;
      fontRole: "display" | "body" | "script";
      align: "left" | "center" | "right";
      color?: string;
      x?: number;
      y?: number;
    }>
  >;
  contentCommunity?: string;
  sectionStyles?: Record<
    string,
    {
      x?: number;
      y?: number;
      showBox?: boolean;
      primary?: string;
      accent?: string;
      foreground?: string;
      displayFont?: string;
      bodyFont?: string;
      scriptFont?: string;
    }
  >;
};

type ThemeRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  eventCategory: string;
  isPremium: boolean;
  sortOrder: number;
  previewImage: string | null;
  revealMode: string;
  revealVideoUrl: string | null;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fontPairing: { display: string; body: string; script: string };
  content?: {
    eyebrow?: string;
    heroHeadline?: string;
    heroSubline?: string;
    invitationLetter?: string;
    storyHeadline?: string;
    thankYou?: string;
    hashtagSuffix?: string;
  } | null;
  decorAssets?: DecorAssets | null;
  sectionOrder: string[];
};

type ThemeType = "WEBSITE" | "PDF";
type LibraryVideo = { label: string; url: string; thumbnailUrl?: string | null };
type LibraryImage = { id: string; name: string; url: string; thumbnailUrl?: string | null; category?: string | null };
type LibraryContent = {
  id: string;
  title: string;
  text: string;
  community: string;
  section: string;
  role: string;
  previewImage?: string | null;
};

const FONT_OPTIONS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Inter",
  "EB Garamond",
];

const ANIMATION_LABELS: Record<(typeof REVEAL_ANIMATION_PRESETS)[number], string> = {
  MAGIC_BLOOM: "Magic bloom",
  SPARKLES: "Golden sparkles",
  CONFETTI: "Celebration confetti",
  PETALS: "Falling petals",
};

function defaultValues(type: ThemeType, theme?: ThemeRecord): ThemeFormValues {
  const decor = theme?.decorAssets ?? {};
  return {
    id: theme?.id,
    type,
    name: theme?.name ?? "",
    slug: theme?.slug ?? "",
    description: theme?.description ?? "",
    previewImage: theme?.previewImage ?? "",
    revealMode: (theme?.revealMode as ThemeFormValues["revealMode"]) ?? "ANIMATION",
    revealVideoUrl: theme?.revealVideoUrl ?? "",
    category: (theme?.category as ThemeFormValues["category"]) ?? "classic",
    eventCategory:
      (theme?.eventCategory as ThemeFormValues["eventCategory"]) ?? "wedding",
    isPremium: theme?.isPremium ?? false,
    sortOrder: theme?.sortOrder ?? 0,
    colorPalette: theme?.colorPalette ?? {
      primary: "#7a2e2e",
      secondary: "#f3d9d9",
      accent: "#c9942a",
      background: "#faf3ea",
      foreground: "#3a1414",
    },
    fontPairing: theme?.fontPairing ?? {
      display: "Playfair Display",
      body: "Cormorant Garamond",
      script: "Great Vibes",
    },
    content: {
      eyebrow: theme?.content?.eyebrow ?? "",
      heroHeadline: theme?.content?.heroHeadline ?? "",
      heroSubline: theme?.content?.heroSubline ?? "",
      invitationLetter: theme?.content?.invitationLetter ?? "",
      storyHeadline: theme?.content?.storyHeadline ?? "",
      thankYou: theme?.content?.thankYou ?? "",
      hashtagSuffix: theme?.content?.hashtagSuffix ?? "",
    },
    decorAssets: {
      revealAnimation: {
        preset: decor.revealAnimation?.preset ?? "MAGIC_BLOOM",
        intensity: decor.revealAnimation?.intensity ?? 1,
        speed: decor.revealAnimation?.speed ?? 1,
      },
      sectionImages: decor.sectionImages ?? {},
      sectionTextBlocks: decor.sectionTextBlocks ?? {},
      elementStyles: decor.elementStyles ?? {},
      customText: decor.customText ?? {},
      contentCommunity: decor.contentCommunity ?? "General",
      sectionStyles: decor.sectionStyles ?? {},
    },
    sectionOrder:
      (theme?.sectionOrder as ThemeFormValues["sectionOrder"]) ?? [
        "ENVELOPE",
        "HERO",
        "COUNTDOWN",
        "TIMELINE",
        "GALLERY",
        "VENUE",
        "RSVP",
        "THANK_YOU",
      ],
  };
}

export function ThemeFormDialog({
  theme,
  type = "WEBSITE",
  revealVideoLibrary = [],
  imageLibrary = [],
  contentLibrary = [],
  standalone = false,
  returnHref = "/admin/library/themes",
}: {
  theme?: ThemeRecord;
  type?: ThemeType;
  revealVideoLibrary?: LibraryVideo[];
  imageLibrary?: LibraryImage[];
  contentLibrary?: LibraryContent[];
  standalone?: boolean;
  returnHref?: string;
}) {
  const [open, setOpen] = useState(standalone);
  const [loading, setLoading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [assetUploading, setAssetUploading] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<(typeof SECTION_TYPES)[number]>("HERO");
  const [selectedElement, setSelectedElement] = useState<string | null>("HERO.invitationLetter");
  const [mobileTool, setMobileTool] = useState<"content" | "library" | "text" | "advanced">("content");
  const [libraryQuery, setLibraryQuery] = useState("");
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bulkArtworkInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<ThemeFormValues, unknown, ThemeFormInput>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: defaultValues(type, theme),
  });

  const sectionOrder = form.watch("sectionOrder");
  const sectionStyles = (form.watch("decorAssets.sectionStyles") ?? {}) as NonNullable<
    DecorAssets["sectionStyles"]
  >;
  const elementStyles = (form.watch("decorAssets.elementStyles") ?? {}) as NonNullable<
    DecorAssets["elementStyles"]
  >;
  const customTextBySection = (form.watch("decorAssets.customText") ?? {}) as NonNullable<
    DecorAssets["customText"]
  >;

  function updateSectionStyle(
    sectionType: (typeof SECTION_TYPES)[number],
    patch: Partial<NonNullable<DecorAssets["sectionStyles"]>[string]>,
  ) {
    const current = (form.getValues("decorAssets.sectionStyles") ?? {}) as NonNullable<
      DecorAssets["sectionStyles"]
    >;
    form.setValue("decorAssets.sectionStyles", {
      ...current,
      [sectionType]: {
        ...(current[sectionType] ?? {}),
        ...patch,
      },
    });
  }

  function updateElementStyle(key: string, patch: Partial<ThemeElementStyleValue>) {
    const current = (form.getValues("decorAssets.elementStyles") ?? {}) as NonNullable<
      DecorAssets["elementStyles"]
    >;
    form.setValue("decorAssets.elementStyles", {
      ...current,
      [key]: {
        ...(current[key] ?? {}),
        ...patch,
      },
    });
  }

  function setCustomText(
    sectionType: (typeof SECTION_TYPES)[number],
    blocks: NonNullable<DecorAssets["customText"]>[string],
  ) {
    const current = (form.getValues("decorAssets.customText") ?? {}) as NonNullable<
      DecorAssets["customText"]
    >;
    form.setValue("decorAssets.customText", {
      ...current,
      [sectionType]: blocks,
    });
  }

  function addCustomText(text = "New text") {
    const sectionType = previewSection;
    const current =
      ((form.getValues("decorAssets.customText") ?? {}) as NonNullable<
        DecorAssets["customText"]
      >)[sectionType] ?? [];
    const id = `CUSTOM.${sectionType}.${Date.now().toString(36)}`;
    setCustomText(sectionType, [
      ...current,
      {
        id,
        text,
        fontSize: 22,
        fontRole: "body",
        align: "center",
        x: 0,
        y: 0,
      },
    ]);
    setSelectedElement(id);
  }

  // Legacy PR #79 helpers remain only so old saved data can be opened safely.
  // The corresponding UI is hidden and these blocks are no longer rendered publicly.
  function setSectionTextBlocks(
    sectionType: (typeof SECTION_TYPES)[number],
    blocks: NonNullable<DecorAssets["sectionTextBlocks"]>[string],
  ) {
    const current = (form.getValues("decorAssets.sectionTextBlocks") ?? {}) as NonNullable<
      DecorAssets["sectionTextBlocks"]
    >;
    form.setValue("decorAssets.sectionTextBlocks", { ...current, [sectionType]: blocks });
  }

  function addTextBlock(_sectionType: (typeof SECTION_TYPES)[number], text = "New text") {
    addCustomText(text);
  }

  function findCustomText(key: string | null) {
    if (!key) return null;
    for (const [section, blocks] of Object.entries(customTextBySection)) {
      const index = blocks.findIndex((block) => block.id === key);
      if (index >= 0) return { section, index, block: blocks[index] };
    }
    return null;
  }

  function setCoreContent(field: string, value: string) {
    switch (field) {
      case "eyebrow":
        form.setValue("content.eyebrow", value);
        break;
      case "heroHeadline":
        form.setValue("content.heroHeadline", value);
        break;
      case "heroSubline":
        form.setValue("content.heroSubline", value);
        break;
      case "invitationLetter":
        form.setValue("content.invitationLetter", value);
        break;
      case "storyHeadline":
        form.setValue("content.storyHeadline", value);
        break;
      case "thankYou":
        form.setValue("content.thankYou", value);
        break;
    }
  }

  function getCoreContent(field?: string) {
    switch (field) {
      case "eyebrow":
        return form.watch("content.eyebrow") ?? "";
      case "heroHeadline":
        return form.watch("content.heroHeadline") ?? "";
      case "heroSubline":
        return form.watch("content.heroSubline") ?? "";
      case "invitationLetter":
        return form.watch("content.invitationLetter") ?? "";
      case "storyHeadline":
        return form.watch("content.storyHeadline") ?? "";
      case "thankYou":
        return form.watch("content.thankYou") ?? "";
      default:
        return "";
    }
  }

  function updateSelectedText(value: string) {
    if (!selectedElement) return;
    const custom = findCustomText(selectedElement);
    if (custom) {
      const blocks = [...customTextBySection[custom.section]];
      blocks[custom.index] = { ...custom.block, text: value };
      setCustomText(custom.section as (typeof SECTION_TYPES)[number], blocks);
      return;
    }
    const definition = definitionForElement(selectedElement);
    if (definition?.coreField) {
      setCoreContent(definition.coreField, value);
      return;
    }
    updateElementStyle(selectedElement, { text: value });
  }

  function updateSelectedAppearance(patch: Partial<ThemeElementStyleValue>) {
    if (!selectedElement) return;
    const custom = findCustomText(selectedElement);
    if (custom) {
      const blocks = [...customTextBySection[custom.section]];
      blocks[custom.index] = {
        ...custom.block,
        ...(patch.fontSize !== undefined ? { fontSize: patch.fontSize } : {}),
        ...(patch.fontRole !== undefined ? { fontRole: patch.fontRole } : {}),
        ...(patch.align !== undefined ? { align: patch.align } : {}),
        ...(patch.color !== undefined ? { color: patch.color } : {}),
        ...(patch.x !== undefined ? { x: patch.x } : {}),
        ...(patch.y !== undefined ? { y: patch.y } : {}),
      };
      setCustomText(custom.section as (typeof SECTION_TYPES)[number], blocks);
      return;
    }
    updateElementStyle(selectedElement, patch);
  }

  function removeSelectedCustomText() {
    if (!selectedElement) return;
    const custom = findCustomText(selectedElement);
    if (!custom) return;
    setCustomText(
      custom.section as (typeof SECTION_TYPES)[number],
      customTextBySection[custom.section].filter((_, index) => index !== custom.index),
    );
    setSelectedElement(null);
  }

  function toggleSection(sectionType: (typeof SECTION_TYPES)[number]) {
    const current = form.getValues("sectionOrder");
    if (current.includes(sectionType)) {
      form.setValue(
        "sectionOrder",
        current.filter((s) => s !== sectionType),
      );
    } else {
      form.setValue("sectionOrder", [...current, sectionType]);
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const current = [...form.getValues("sectionOrder")];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    form.setValue("sectionOrder", current);
  }

  async function uploadAsset(file: File | undefined, kind: "image" | "video") {
    if (!file) return null;
    setAssetUploading(kind);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      const response = await fetch("/api/admin/theme-assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Upload failed.");
        return null;
      }
      return data as { url: string; webmUrl?: string; posterUrl?: string };
    } finally {
      setAssetUploading(null);
    }
  }

  async function handleThumbnailUpload(file: File | undefined) {
    if (!file) return;
    setThumbUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/theme-assets/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setThumbUploading(false);
    if (!response.ok) {
      toast.error(data.error ?? "Failed to upload image");
      return;
    }
    form.setValue("previewImage", data.url);
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  }

  async function handleRevealVideo(file?: File) {
    const uploaded = await uploadAsset(file, "video");
    if (uploaded?.url) {
      form.setValue("revealVideoUrl", uploaded.url);
      toast.success("Reveal video uploaded and selected.");
    }
  }

  async function handleSectionImage(
    sectionType: (typeof SECTION_TYPES)[number],
    file?: File,
  ) {
    const uploaded = await uploadAsset(file, "image");
    if (!uploaded?.url) return;
    const current = form.getValues("decorAssets.sectionImages") ?? {};
    form.setValue("decorAssets.sectionImages", {
      ...current,
      [sectionType]: uploaded.url,
    });
    setPreviewSection(sectionType);
    toast.success(`${sectionType} artwork uploaded. Preview updated.`);
  }

  async function handleBulkArtwork(file?: File) {
    const uploaded = await uploadAsset(file, "image");
    if (!uploaded?.url) return;
    const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
    for (const sectionType of form.getValues("sectionOrder")) {
      current[sectionType] = uploaded.url;
    }
    form.setValue("decorAssets.sectionImages", current);
    setPreviewSection((form.getValues("sectionOrder")[0] ?? "HERO") as (typeof SECTION_TYPES)[number]);
    toast.success("Artwork applied to every active section. You can replace any section individually.");
  }

  const selectedDefinition = selectedElement
    ? definitionForElement(selectedElement)
    : undefined;
  const selectedCustom = findCustomText(selectedElement);
  const selectedStyle: ThemeElementStyleValue = selectedCustom
    ? {
        fontSize: selectedCustom.block.fontSize,
        fontRole: selectedCustom.block.fontRole,
        align: selectedCustom.block.align,
        color: selectedCustom.block.color,
        x: selectedCustom.block.x,
        y: selectedCustom.block.y,
      }
    : selectedElement
      ? elementStyles[selectedElement] ?? {}
      : {};
  const selectedText = selectedCustom
    ? selectedCustom.block.text
    : selectedDefinition?.coreField
      ? getCoreContent(selectedDefinition.coreField)
      : selectedElement
        ? elementStyles[selectedElement]?.text ?? selectedDefinition?.fallbackText ?? ""
        : "";
  const selectedCanEditText = Boolean(
    selectedCustom || (selectedDefinition && !selectedDefinition.dynamic),
  );
  const selectedCommunity = form.watch("decorAssets.contentCommunity") ?? "General";
  const selectedPresets = COMMUNITY_CONTENT_PRESETS.filter(
    (preset) =>
      preset.community === selectedCommunity || preset.community === "General",
  );
  const selectedSectionDefinitions = elementsForSection(previewSection);
  const selectedSectionCustomText = customTextBySection[previewSection] ?? [];
  const selectedSectionIndex = sectionOrder.indexOf(previewSection);
  const databaseContent = contentLibrary.map((item) => ({
    id: `db-${item.id}`,
    label: item.title,
    text: item.text,
    community: item.community,
    suggestedSection: item.section,
    role: item.role as "heading" | "subheading" | "body" | "blessing",
    previewImage: item.previewImage ?? undefined,
  }));
  const libraryPresets = [...databaseContent, ...COMMUNITY_CONTENT_PRESETS.map((preset) => ({ ...preset, previewImage: undefined as string | undefined }))].filter((preset) => {
    const communityMatch =
      selectedCommunity === "General"
        ? preset.community === "General"
        : preset.community === selectedCommunity || preset.community === "General";
    const query = libraryQuery.trim().toLowerCase();
    const queryMatch =
      !query ||
      preset.label.toLowerCase().includes(query) ||
      preset.text.toLowerCase().includes(query) ||
      preset.community.toLowerCase().includes(query);
    return communityMatch && queryMatch;
  });

  function selectSectionForEditing(section: (typeof SECTION_TYPES)[number]) {
    setPreviewSection(section);
    setSelectedElement(elementsForSection(section)[0]?.key ?? null);
    setMobileTool("content");
  }

  function removeSelectedSection() {
    if (sectionOrder.length <= 1) {
      toast.error("Keep at least one section in the theme.");
      return;
    }
    const currentIndex = sectionOrder.indexOf(previewSection);
    const nextSection =
      (sectionOrder[currentIndex + 1] ?? sectionOrder[currentIndex - 1]) as
        | (typeof SECTION_TYPES)[number]
        | undefined;
    toggleSection(previewSection);
    if (nextSection) selectSectionForEditing(nextSection);
  }

  function duplicateSelectedContent() {
    const text = selectedText.trim();
    addCustomText(text || "New text");
    setMobileTool("content");
  }

  function applyLibraryPreset(preset: { text: string }) {
    if (selectedCanEditText && selectedElement) {
      updateSelectedText(preset.text);
    } else {
      addCustomText(preset.text);
    }
    setMobileTool("content");
  }

  async function onSubmit(values: ThemeFormInput) {
    setLoading(true);
    const result = await upsertThemeAction(values);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(theme ? "Theme updated and published." : "Theme created and published.");
    if (standalone) {
      router.push(returnHref);
      router.refresh();
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (standalone && !next) {
          router.push(returnHref);
          return;
        }
        setOpen(next);
      }}
    >
      {!standalone && (
        <DialogTrigger asChild>
          {theme ? (
            <IconButton label="Edit">
              <Pencil className="size-4" />
            </IconButton>
          ) : (
            <IconButton label={type === "PDF" ? "New PDF theme" : "New theme"} variant="default">
              <Plus className="size-4" />
            </IconButton>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={!standalone}
        className={
          standalone
            ? "fixed inset-0 top-0 left-0 h-svh w-screen max-w-none translate-x-0 translate-y-0 overflow-x-hidden overflow-y-auto rounded-none border-0 bg-[#fbf9fd] p-0 shadow-none data-[state=open]:zoom-in-100 sm:max-w-none"
            : "max-h-[92vh] overflow-x-hidden overflow-y-auto sm:max-w-5xl"
        }
      >
        {standalone ? (
          <div className="sticky top-0 z-50 flex h-16 items-center justify-between gap-3 border-b border-violet-200/70 bg-white/95 px-3 backdrop-blur-xl sm:px-6">
            <Link href={returnHref} className="inline-flex size-10 items-center justify-center rounded-full border border-violet-200 bg-white text-[#5b4268]">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate font-display text-base font-semibold text-[#4b3659]">
                {theme ? theme.name : "New Theme"}
              </p>
              <p className="text-[9px] font-semibold tracking-[0.15em] text-[#9a83a5] uppercase">Theme Editor</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(returnHref)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-violet-200 bg-white text-[#5b4268]"
              aria-label="Close editor"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <DialogHeader>
            <DialogTitle>
              {theme ? `Edit ${theme.name}` : type === "PDF" ? "New PDF theme" : "New theme"}
            </DialogTitle>
          </DialogHeader>
        )}

        <div className={standalone ? "mx-auto w-full max-w-7xl px-3 py-4 sm:px-6" : ""}>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 gap-6">
          {type === "WEBSITE" && (
            <section className="-mx-3 grid gap-3 md:hidden">
              <div className="sticky top-0 z-20 grid gap-2 border-y border-violet-200/70 bg-[#faf6fd]/95 px-3 py-2 backdrop-blur-xl">
                <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
                  {sectionOrder.map((sectionType) => {
                    const typedSection = sectionType as (typeof SECTION_TYPES)[number];
                    return (
                      <button
                        key={sectionType}
                        type="button"
                        onClick={() => selectSectionForEditing(typedSection)}
                        className={
                          previewSection === typedSection
                            ? "shrink-0 rounded-full bg-[#76508c] px-3 py-2 text-[11px] font-bold text-white shadow-sm"
                            : "shrink-0 rounded-full border border-violet-200 bg-white px-3 py-2 text-[11px] font-semibold text-[#5a4168]"
                        }
                      >
                        {sectionType}
                      </button>
                    );
                  })}
                  {SECTION_TYPES.filter((item) => !sectionOrder.includes(item)).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        toggleSection(item);
                        selectSectionForEditing(item);
                      }}
                      className="shrink-0 rounded-full border border-dashed border-violet-300 bg-violet-50 px-3 py-2 text-[11px] font-semibold text-[#76508c]"
                    >
                      + {item}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 rounded-2xl border border-violet-200/70 bg-white/85 px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      disabled={selectedSectionIndex <= 0}
                      onClick={() => moveSection(selectedSectionIndex, -1)}
                      aria-label="Move section up"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      disabled={selectedSectionIndex < 0 || selectedSectionIndex >= sectionOrder.length - 1}
                      onClick={() => moveSection(selectedSectionIndex, 1)}
                      aria-label="Move section down"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="truncate text-xs font-bold text-[#4b3659]">{previewSection}</p>
                    <p className="text-[9px] text-[#8a7397]">Selected section</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={removeSelectedSection}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-violet-200/70 bg-[radial-gradient(circle_at_top,#fbf5ff_0%,#f2e9f8_48%,#ede2f5_100%)] px-3 py-4 shadow-inner">
                <ThemeRealSectionPreview
                  section={previewSection}
                  eventCategory={form.watch("eventCategory")}
                  palette={form.watch("colorPalette")}
                  fonts={form.watch("fontPairing")}
                  content={form.watch("content")}
                  revealMode={form.watch("revealMode")}
                  revealVideoUrl={form.watch("revealVideoUrl")}
                  revealAnimation={form.watch("decorAssets.revealAnimation")}
                  sectionImages={form.watch("decorAssets.sectionImages")}
                  sectionStyles={form.watch("decorAssets.sectionStyles")}
                  elementStyles={form.watch("decorAssets.elementStyles")}
                  customText={form.watch("decorAssets.customText")}
                  onSelectElement={(key) => {
                    setSelectedElement(key);
                    setMobileTool("content");
                  }}
                  compact
                />
              </div>

              <div className="overflow-hidden rounded-t-[1.75rem] rounded-b-2xl border border-violet-200/80 bg-[#fffaff] shadow-[0_-12px_36px_rgba(99,71,118,.12)]">
                <div className="flex items-center justify-between gap-3 border-b border-violet-100 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-[#442852]">
                      {previewSection} Section
                    </p>
                    <p className="text-[10px] text-[#8a7397]">
                      Edit content and load text from library
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addCustomText()}>
                    <Plus className="size-3.5" />
                    Add text
                  </Button>
                </div>

                <div className="grid grid-cols-4 border-b border-violet-100 bg-violet-50/60 p-1">
                  {[
                    ["content", "Content", Smartphone],
                    ["library", "Library", BookOpen],
                    ["text", "Text", Type],
                    ["advanced", "Advanced", SlidersHorizontal],
                  ].map(([value, label, Icon]) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setMobileTool(value as "content" | "library" | "text" | "advanced")}
                      className={
                        mobileTool === value
                          ? "flex min-w-0 items-center justify-center gap-1 rounded-xl bg-[#76508c] px-2 py-2 text-[10px] font-bold text-white shadow-sm"
                          : "flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-[#6d547a]"
                      }
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate">{String(label)}</span>
                    </button>
                  ))}
                </div>

                {mobileTool === "content" && (
                  <div className="grid gap-3 p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-[#4b3659]">Text layers</Label>
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-[#76508c]"
                        onClick={() => addCustomText()}
                      >
                        + Add
                      </button>
                    </div>

                    <div className="grid max-h-44 gap-1.5 overflow-y-auto pr-1">
                      {selectedSectionDefinitions.map((definition) => {
                        const layerText = definition.coreField
                          ? getCoreContent(definition.coreField)
                          : elementStyles[definition.key]?.text ??
                            definition.fallbackText ??
                            (definition.dynamic ? "Dynamic invitation data" : "");
                        return (
                          <button
                            key={definition.key}
                            type="button"
                            onClick={() => setSelectedElement(definition.key)}
                            className={
                              selectedElement === definition.key
                                ? "grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-xl border border-violet-300 bg-violet-100/80 p-2 text-left"
                                : "grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-xl border bg-white p-2 text-left"
                            }
                          >
                            <span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-[#76508c]">
                              <Type className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[11px] font-bold text-[#4b3659]">
                                {definition.label}
                              </span>
                              <span className="block truncate text-[9px] text-[#8a7397]">
                                {layerText || "Empty"}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                      {selectedSectionCustomText.map((block) => (
                        <button
                          key={block.id}
                          type="button"
                          onClick={() => setSelectedElement(block.id)}
                          className={
                            selectedElement === block.id
                              ? "grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-xl border border-violet-300 bg-violet-100/80 p-2 text-left"
                              : "grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-xl border bg-white p-2 text-left"
                          }
                        >
                          <span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-[#76508c]">
                            <Type className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[11px] font-bold text-[#4b3659]">
                              Added text
                            </span>
                            <span className="block truncate text-[9px] text-[#8a7397]">{block.text}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-2 rounded-2xl border border-violet-200/70 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-[#4b3659]">
                            {selectedDefinition?.label ?? (selectedCustom ? "Added text" : "Select content")}
                          </p>
                          <p className="text-[9px] text-[#8a7397]">Edit the selected layer only</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setMobileTool("library")}>
                          <BookOpen className="size-3.5" />
                          Library
                        </Button>
                      </div>

                      {selectedCanEditText ? (
                        <Textarea
                          rows={3}
                          value={selectedText}
                          onChange={(e) => updateSelectedText(e.target.value)}
                          className="resize-none text-sm"
                        />
                      ) : selectedElement ? (
                        <div className="rounded-xl border border-dashed bg-violet-50/40 p-3 text-[10px] leading-relaxed text-[#75617f]">
                          This layer uses invitation data such as names, date or venue. You can style it from the Text tab, but its value comes from the invitation.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed p-3 text-center text-[10px] text-[#8a7397]">
                          Tap text in the preview or choose a layer above.
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addCustomText()}>
                          <Plus className="size-3.5" />
                          Add
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={!selectedElement} onClick={duplicateSelectedContent}>
                          <Copy className="size-3.5" />
                          Duplicate
                        </Button>
                        {selectedElement && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              if (selectedCustom) {
                                removeSelectedCustomText();
                              } else {
                                updateElementStyle(selectedElement, { hidden: true });
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                            {selectedCustom ? "Delete" : "Hide"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {mobileTool === "library" && (
                  <div className="grid gap-3 p-3">
                    <div className="grid gap-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9b86a6]" />
                        <Input
                          value={libraryQuery}
                          onChange={(e) => setLibraryQuery(e.target.value)}
                          placeholder="Search invitation content"
                          className="pl-9"
                        />
                      </div>
                      <select
                        className="border-input h-10 rounded-md border bg-background px-3 text-sm"
                        value={selectedCommunity}
                        onChange={(e) => form.setValue("decorAssets.contentCommunity", e.target.value)}
                      >
                        {COMMUNITY_CONTENT_GROUPS.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {libraryPresets.map((preset) => (
                        <div key={preset.id} className="grid content-between gap-2 rounded-2xl border border-violet-200/70 bg-white p-3">
                          <div>
                            <div className="mb-2 grid size-9 place-items-center rounded-xl bg-violet-50 text-[#76508c]">
                              <BookOpen className="size-4" />
                            </div>
                            <p className="text-[11px] font-bold leading-tight text-[#4b3659]">{preset.label}</p>
                            <p className="mt-1 text-[9px] font-semibold text-[#9a82a7]">{preset.community}</p>
                            <p className="mt-2 line-clamp-3 text-[9px] leading-relaxed text-[#75617f]">{preset.text}</p>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => applyLibraryPreset(preset)}>
                            <Plus className="size-3.5" />
                            Apply
                          </Button>
                        </div>
                      ))}
                    </div>

                    {libraryPresets.length === 0 && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                        No library content matches this search.
                      </div>
                    )}
                  </div>
                )}

                {mobileTool === "text" && (
                  <div className="grid gap-4 p-3">
                    {!selectedElement ? (
                      <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                        Select a text layer or tap text in the preview first.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="grid gap-1">
                            <Label className="text-[10px]">Font size</Label>
                            <div className="flex items-center rounded-xl border bg-white">
                              <button
                                type="button"
                                className="size-10 text-lg"
                                onClick={() =>
                                  updateSelectedAppearance({ fontSize: Math.max(8, (selectedStyle.fontSize ?? 22) - 2) })
                                }
                              >
                                −
                              </button>
                              <Input
                                type="number"
                                min={8}
                                max={120}
                                value={selectedStyle.fontSize ?? ""}
                                placeholder="Auto"
                                onChange={(e) =>
                                  updateSelectedAppearance({
                                    fontSize: e.target.value ? Number(e.target.value) : undefined,
                                  })
                                }
                                className="h-10 border-0 text-center shadow-none"
                              />
                              <button
                                type="button"
                                className="size-10 text-lg"
                                onClick={() =>
                                  updateSelectedAppearance({ fontSize: Math.min(120, (selectedStyle.fontSize ?? 22) + 2) })
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-[10px]">Font</Label>
                            <select
                              className="border-input h-10 rounded-md border bg-background px-2 text-xs"
                              value={selectedStyle.fontRole ?? ""}
                              onChange={(e) =>
                                updateSelectedAppearance({
                                  fontRole: (e.target.value || undefined) as ThemeElementStyleValue["fontRole"],
                                })
                              }
                            >
                              <option value="">Theme default</option>
                              <option value="display">Display</option>
                              <option value="body">Body</option>
                              <option value="script">Script</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-[1fr_92px] gap-2">
                          <div className="grid gap-1">
                            <Label className="text-[10px]">Alignment</Label>
                            <div className="grid grid-cols-3 overflow-hidden rounded-xl border bg-white">
                              {(["left", "center", "right"] as const).map((align) => (
                                <button
                                  key={align}
                                  type="button"
                                  className={
                                    selectedStyle.align === align
                                      ? "bg-violet-100 px-2 py-2 text-[10px] font-bold text-[#68467b]"
                                      : "px-2 py-2 text-[10px] font-semibold text-[#765f81]"
                                  }
                                  onClick={() => updateSelectedAppearance({ align })}
                                >
                                  {align}
                                </button>
                              ))}
                            </div>
                          </div>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-medium">Color</span>
                            <input
                              type="color"
                              value={selectedStyle.color || "#4b3659"}
                              onChange={(e) => updateSelectedAppearance({ color: e.target.value })}
                              className="h-10 w-full rounded-xl border bg-white"
                            />
                          </label>
                        </div>

                        <div className="grid gap-3 rounded-2xl border bg-white p-3">
                          <div className="grid gap-1">
                            <div className="flex justify-between text-[10px]">
                              <Label className="text-[10px]">Horizontal position</Label>
                              <span>{selectedStyle.x ?? 0}</span>
                            </div>
                            <input
                              type="range"
                              min="-60"
                              max="60"
                              value={selectedStyle.x ?? 0}
                              onChange={(e) => updateSelectedAppearance({ x: Number(e.target.value) })}
                            />
                          </div>
                          <div className="grid gap-1">
                            <div className="flex justify-between text-[10px]">
                              <Label className="text-[10px]">Vertical position</Label>
                              <span>{selectedStyle.y ?? 0}</span>
                            </div>
                            <input
                              type="range"
                              min="-60"
                              max="60"
                              value={selectedStyle.y ?? 0}
                              onChange={(e) => updateSelectedAppearance({ y: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        <label className="flex items-center justify-between rounded-xl border bg-white p-3">
                          <span className="text-xs font-semibold">Background behind text</span>
                          <Switch
                            checked={selectedStyle.showBackground ?? false}
                            onCheckedChange={(value) => updateSelectedAppearance({ showBackground: value })}
                          />
                        </label>
                        {!selectedCustom && (
                          <label className="flex items-center justify-between rounded-xl border bg-white p-3">
                            <span className="text-xs font-semibold">Hide selected content</span>
                            <Switch
                              checked={selectedStyle.hidden ?? false}
                              onCheckedChange={(value) => updateSelectedAppearance({ hidden: value })}
                            />
                          </label>
                        )}
                      </>
                    )}
                  </div>
                )}

                {mobileTool === "advanced" && (
                  <div className="grid max-h-[58vh] gap-4 overflow-y-auto p-3">
                    <div className="grid gap-3 rounded-2xl border border-violet-200/70 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#4b3659]">Section artwork</p>
                          <p className="text-[9px] text-[#8a7397]">Background for {previewSection}</p>
                        </div>
                        {(form.watch("decorAssets.sectionImages") ?? {})[previewSection] && (
                          <button
                            type="button"
                            className="text-[10px] font-semibold text-destructive"
                            onClick={() => {
                              const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
                              delete current[previewSection];
                              form.setValue("decorAssets.sectionImages", current);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-3 py-3 text-xs font-semibold text-[#6c4a7d]">
                        <ImageIcon className="size-4" />
                        {assetUploading === "image" ? "Uploading…" : "Upload / change section image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={assetUploading === "image"}
                          onChange={(e) => handleSectionImage(previewSection, e.target.files?.[0])}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={assetUploading === "image"}
                        onClick={() => bulkArtworkInputRef.current?.click()}
                      >
                        <Upload className="size-3.5" />
                        Apply one image to all sections
                      </Button>
                      <input
                        ref={bulkArtworkInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleBulkArtwork(e.target.files?.[0])}
                      />
                    </div>

                    <div className="grid gap-3 rounded-2xl border bg-white p-3">
                      <p className="text-xs font-bold text-[#4b3659]">Section layout</p>
                      <div className="grid gap-1">
                        <div className="flex justify-between text-[10px]">
                          <Label className="text-[10px]">Content horizontal position</Label>
                          <span>{sectionStyles[previewSection]?.x ?? 0}</span>
                        </div>
                        <input
                          type="range"
                          min="-40"
                          max="40"
                          value={sectionStyles[previewSection]?.x ?? 0}
                          onChange={(e) => updateSectionStyle(previewSection, { x: Number(e.target.value) })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <div className="flex justify-between text-[10px]">
                          <Label className="text-[10px]">Content vertical position</Label>
                          <span>{sectionStyles[previewSection]?.y ?? 0}</span>
                        </div>
                        <input
                          type="range"
                          min="-40"
                          max="40"
                          value={sectionStyles[previewSection]?.y ?? 0}
                          onChange={(e) => updateSectionStyle(previewSection, { y: Number(e.target.value) })}
                        />
                      </div>
                      <label className="flex items-center justify-between rounded-xl border p-3">
                        <span className="text-xs font-semibold">Show content background box</span>
                        <Switch
                          checked={sectionStyles[previewSection]?.showBox ?? true}
                          onCheckedChange={(value) => updateSectionStyle(previewSection, { showBox: value })}
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 rounded-2xl border bg-white p-3">
                      <p className="text-xs font-bold text-[#4b3659]">Section colors & fonts</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ["primary", "Main"],
                          ["accent", "Accent"],
                          ["foreground", "Text"],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="grid gap-1 text-[9px]">
                            <span>{label}</span>
                            <input
                              type="color"
                              value={sectionStyles[previewSection]?.[key] || form.watch("colorPalette")[key]}
                              onChange={(e) => updateSectionStyle(previewSection, { [key]: e.target.value })}
                              className="h-10 w-full rounded-xl border bg-transparent"
                            />
                          </label>
                        ))}
                      </div>
                      {(["display", "body", "script"] as const).map((kind) => {
                        const field =
                          kind === "display" ? "displayFont" : kind === "body" ? "bodyFont" : "scriptFont";
                        return (
                          <div key={kind} className="grid gap-1">
                            <Label className="text-[10px] capitalize">{kind} font</Label>
                            <select
                              className="border-input h-10 rounded-md border bg-background px-2 text-xs"
                              value={sectionStyles[previewSection]?.[field] || form.watch("fontPairing")[kind]}
                              onChange={(e) => updateSectionStyle(previewSection, { [field]: e.target.value })}
                            >
                              {FONT_OPTIONS.map((font) => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    {previewSection === "ENVELOPE" && (
                      <div className="grid gap-3 rounded-2xl border bg-white p-3">
                        <p className="text-xs font-bold text-[#4b3659]">Envelope reveal</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={form.watch("revealMode") === "ANIMATION" ? "default" : "outline"}
                            size="sm"
                            onClick={() => form.setValue("revealMode", "ANIMATION")}
                          >
                            <Sparkles className="size-3.5" />
                            Animation
                          </Button>
                          <Button
                            type="button"
                            variant={form.watch("revealMode") === "VIDEO" ? "default" : "outline"}
                            size="sm"
                            onClick={() => form.setValue("revealMode", "VIDEO")}
                          >
                            <Video className="size-3.5" />
                            Video
                          </Button>
                        </div>
                        {form.watch("revealMode") === "ANIMATION" ? (
                          <div className="grid gap-2">
                            <select
                              className="border-input h-10 rounded-md border bg-background px-2 text-xs"
                              value={form.watch("decorAssets.revealAnimation.preset")}
                              onChange={(e) =>
                                form.setValue(
                                  "decorAssets.revealAnimation.preset",
                                  e.target.value as (typeof REVEAL_ANIMATION_PRESETS)[number],
                                )
                              }
                            >
                              {REVEAL_ANIMATION_PRESETS.map((preset) => (
                                <option key={preset} value={preset}>{ANIMATION_LABELS[preset]}</option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="number" min="0.5" max="2" step="0.1" placeholder="Intensity" {...form.register("decorAssets.revealAnimation.intensity", { valueAsNumber: true })} />
                              <Input type="number" min="0.5" max="2" step="0.1" placeholder="Speed" {...form.register("decorAssets.revealAnimation.speed", { valueAsNumber: true })} />
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-xs">
                              <Upload className="size-4" />
                              {assetUploading === "video" ? "Uploading…" : "Upload reveal video"}
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/*"
                                className="hidden"
                                disabled={assetUploading === "video"}
                                onChange={(e) => handleRevealVideo(e.target.files?.[0])}
                              />
                            </label>
                            {revealVideoLibrary.length > 0 && (
                              <select
                                className="border-input h-10 rounded-md border bg-background px-2 text-xs"
                                value={form.watch("revealVideoUrl") ?? ""}
                                onChange={(e) => form.setValue("revealVideoUrl", e.target.value)}
                              >
                                <option value="">Choose existing reveal video…</option>
                                {revealVideoLibrary.map((item) => (
                                  <option key={item.url} value={item.url}>{item.label}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid gap-3 rounded-2xl border bg-white p-3">
                      <p className="text-xs font-bold text-[#4b3659]">Theme setup</p>
                      <div className="grid gap-1">
                        <Label className="text-[10px]">Theme name</Label>
                        <Input {...form.register("name")} />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[10px]">Slug</Label>
                        <Input {...form.register("slug")} disabled={!!theme} />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[10px]">Description</Label>
                        <Textarea rows={2} {...form.register("description")} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                          <Label className="text-[10px]">Celebration</Label>
                          <select
                            className="border-input h-10 rounded-md border bg-background px-2 text-xs"
                            value={form.watch("eventCategory")}
                            onChange={(e) => form.setValue("eventCategory", e.target.value as ThemeFormValues["eventCategory"])}
                          >
                            {EVENT_CATEGORIES.map((category) => (
                              <option key={category.slug} value={category.slug}>{category.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[10px]">Style</Label>
                          <select
                            className="border-input h-10 rounded-md border bg-background px-2 text-xs capitalize"
                            value={form.watch("category")}
                            onChange={(e) => form.setValue("category", e.target.value as ThemeFormValues["category"])}
                          >
                            {THEME_CATEGORIES.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center justify-between rounded-xl border p-3">
                        <span className="text-xs font-semibold">Premium theme</span>
                        <Switch
                          checked={form.watch("isPremium")}
                          onCheckedChange={(value) => form.setValue("isPremium", value)}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="hidden md:contents">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label>Slug</Label>
              <Input {...form.register("slug")} disabled={!!theme} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} {...form.register("description")} />
          </div>

          <div className="grid gap-1.5">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-3">
              {form.watch("previewImage") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.watch("previewImage")} alt="" className="size-20 rounded-xl border object-cover" />
              ) : (
                <div className="text-muted-foreground grid size-20 place-items-center rounded-xl border border-dashed">
                  <ImageIcon className="size-5" />
                </div>
              )}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => thumbInputRef.current?.click()} disabled={thumbUploading}>
                <Upload className="size-4" />
                {thumbUploading ? "Uploading…" : "Upload thumbnail"}
              </Button>
            </div>
          </div>

          {type === "WEBSITE" && (
            <section className="grid gap-3 rounded-2xl border p-4">
              <div>
                <Label className="text-base">Envelope reveal</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Use a coded animation or a 3–5 second video. Uploaded videos automatically become reusable through the existing-theme library.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => form.setValue("revealMode", "ANIMATION")}
                  className={`rounded-xl border p-3 text-left ${form.watch("revealMode") === "ANIMATION" ? "border-primary bg-primary/5" : ""}`}
                >
                  <Sparkles className="mb-2 size-4" />
                  <span className="font-medium">Coded animation</span>
                  <p className="text-muted-foreground text-xs">Build it from a reusable preset below.</p>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("revealMode", "VIDEO")}
                  className={`rounded-xl border p-3 text-left ${form.watch("revealMode") === "VIDEO" ? "border-primary bg-primary/5" : ""}`}
                >
                  <Video className="mb-2 size-4" />
                  <span className="font-medium">Video reveal</span>
                  <p className="text-muted-foreground text-xs">Upload a new clip or pick one already used by another theme.</p>
                </button>
              </div>

              {form.watch("revealMode") === "ANIMATION" ? (
                <div className="grid gap-3 rounded-xl bg-muted/40 p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="grid min-w-0 gap-1.5 sm:col-span-1">
                      <Label>Animation style</Label>
                      <select
                        className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
                        value={form.watch("decorAssets.revealAnimation.preset")}
                        onChange={(e) =>
                          form.setValue(
                            "decorAssets.revealAnimation.preset",
                            e.target.value as (typeof REVEAL_ANIMATION_PRESETS)[number],
                          )
                        }
                      >
                        {REVEAL_ANIMATION_PRESETS.map((preset) => (
                          <option key={preset} value={preset}>{ANIMATION_LABELS[preset]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label>Intensity</Label>
                      <Input type="number" min="0.5" max="2" step="0.1" {...form.register("decorAssets.revealAnimation.intensity", { valueAsNumber: true })} />
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label>Speed</Label>
                      <Input type="number" min="0.5" max="2" step="0.1" {...form.register("decorAssets.revealAnimation.speed", { valueAsNumber: true })} />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    This is the coded-animation creator: choose the effect, then tune its intensity and speed. The saved animation is reused by every invitation using this theme.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <Upload className="size-4" />
                      {assetUploading === "video" ? "Uploading…" : "Upload new video"}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/*"
                        className="hidden"
                        disabled={assetUploading === "video"}
                        onChange={(e) => handleRevealVideo(e.target.files?.[0])}
                      />
                    </label>
                    {form.watch("revealVideoUrl") && (
                      <a href={form.watch("revealVideoUrl")} target="_blank" rel="noreferrer" className="text-primary self-center text-xs underline">
                        Preview selected video
                      </a>
                    )}
                  </div>

                  {revealVideoLibrary.length > 0 && (
                    <div className="grid gap-1.5">
                      <Label>Choose from uploaded collection</Label>
                      <select
                        className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
                        value={form.watch("revealVideoUrl") ?? ""}
                        onChange={(e) => form.setValue("revealVideoUrl", e.target.value)}
                      >
                        <option value="">Select a reveal video…</option>
                        {revealVideoLibrary.map((item) => (
                          <option key={`${item.label}-${item.url}`} value={item.url}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <Label>Video URL</Label>
                    <Input placeholder="https://…/reveal.mp4" {...form.register("revealVideoUrl")} />
                  </div>
                </div>
              )}
            </section>
          )}

          {type === "WEBSITE" && (
            <div className="grid gap-1.5">
              <Label>Celebration</Label>
              <select
                className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
                value={form.watch("eventCategory")}
                onChange={(e) => form.setValue("eventCategory", e.target.value as ThemeFormValues["eventCategory"])}
              >
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <Label>Style</Label>
              <select
                className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm capitalize"
                value={form.watch("category")}
                onChange={(e) => form.setValue("category", e.target.value as ThemeFormValues["category"])}
              >
                {THEME_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="capitalize">{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label>Premium theme</Label>
              <Switch checked={form.watch("isPremium")} onCheckedChange={(v) => form.setValue("isPremium", v)} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Color palette</Label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {(["primary", "secondary", "accent", "background", "foreground"] as const).map((key) => (
                <label key={key} className="flex min-w-0 flex-col items-center gap-1 rounded-xl border p-2">
                  <input
                    type="color"
                    value={form.watch(`colorPalette.${key}`)}
                    onChange={(e) => form.setValue(`colorPalette.${key}`, e.target.value)}
                    className="size-9 cursor-pointer rounded border"
                  />
                  <span className="text-muted-foreground text-[10px] capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Fonts</Label>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
              {(["display", "body", "script"] as const).map((key) => (
                <div key={key} className="grid min-w-0 gap-1.5">
                  <Label className="text-xs capitalize">{key} font</Label>
                  <select
                    className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-2 text-sm"
                    value={form.watch(`fontPairing.${key}`)}
                    onChange={(e) => form.setValue(`fontPairing.${key}`, e.target.value)}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {type === "WEBSITE" && (
            <section className="grid gap-4 rounded-2xl border border-violet-200/70 bg-violet-50/45 p-4">
              <div>
                <Label className="text-base">Theme text & community content</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Edit the default wording users see before they personalize it, or insert a community-specific line from the content collection.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
                <select
                  className="border-input h-10 rounded-md border bg-background px-3 text-sm"
                  value={form.watch("decorAssets.contentCommunity") ?? "General"}
                  onChange={(e) => form.setValue("decorAssets.contentCommunity", e.target.value)}
                >
                  {COMMUNITY_CONTENT_GROUPS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  className="border-input h-10 min-w-0 rounded-md border bg-background px-3 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    const preset = COMMUNITY_CONTENT_PRESETS.find((item) => item.id === e.target.value);
                    if (preset) {
                      form.setValue("content.invitationLetter", preset.text);
                      if (preset.role === "blessing") {
                        form.setValue("content.eyebrow", preset.text);
                      }
                    }
                    e.currentTarget.value = "";
                  }}
                >
                  <option value="">Choose content from collection…</option>
                  {COMMUNITY_CONTENT_PRESETS.filter((preset) => {
                    const community = form.watch("decorAssets.contentCommunity") ?? "General";
                    return preset.community === community || preset.community === "General";
                  }).map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.community} · {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Eyebrow / blessing</Label>
                  <Input {...form.register("content.eyebrow")} placeholder="॥ श्री गणेशाय नमः ॥" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Hero headline</Label>
                  <Input {...form.register("content.heroHeadline")} placeholder="We’re Getting Married" />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs">Hero subline</Label>
                  <Input {...form.register("content.heroSubline")} placeholder="Join us as we celebrate..." />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs">Invitation text</Label>
                  <Textarea rows={3} {...form.register("content.invitationLetter")} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Story heading</Label>
                  <Input {...form.register("content.storyHeadline")} placeholder="Forever Us" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Thank-you line</Label>
                  <Input {...form.register("content.thankYou")} placeholder="With love and gratitude..." />
                </div>
              </div>
            </section>
          )}

          {type === "WEBSITE" && (
            <section className="grid gap-4">
              <div>
                <Label className="text-base">Sections & image-based artwork</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Upload an image for any section. Use the live preview to check exactly which parts of the artwork will be covered by invitation content before saving.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={bulkArtworkInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleBulkArtwork(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => bulkArtworkInputRef.current?.click()}
                  disabled={assetUploading === "image"}
                >
                  <Upload className="size-4" />
                  Bulk apply one image to all sections
                </Button>
                <span className="text-muted-foreground text-xs">
                  Best for one-artwork themes that repeat the same background throughout.
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
                <div className="grid min-w-0 gap-3">
                  <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.filter((item) => !sectionOrder.includes(item)).map((item) => (
                  <button key={item} type="button" onClick={() => toggleSection(item)} className="text-muted-foreground rounded-full border px-2.5 py-1 text-xs">
                    + {item}
                  </button>
                ))}
                  </div>

                  <div className="grid gap-2">
                {sectionOrder.map((sectionType, index) => {
                  const typedSection = sectionType as (typeof SECTION_TYPES)[number];
                  const imageUrl = form.watch(`decorAssets.sectionImages.${typedSection}`);
                  const textBlocks =
                    ((form.watch("decorAssets.sectionTextBlocks") ?? {}) as NonNullable<
                      DecorAssets["sectionTextBlocks"]
                    >)[typedSection] ?? [];
                  const community = form.watch("decorAssets.contentCommunity") ?? "General";
                  const contentPresets = COMMUNITY_CONTENT_PRESETS.filter(
                    (preset) =>
                      preset.community === community || preset.community === "General",
                  );
                  return (
                    <div key={sectionType} className="grid gap-2 rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewSection(typedSection);
                            setSelectedElement(elementsForSection(typedSection)[0]?.key ?? null);
                          }}
                          className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-medium ${previewSection === typedSection ? "bg-primary/10 text-primary" : ""}`}
                        >
                          <Smartphone className="size-3.5" />
                          {sectionType}
                        </button>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveSection(index, -1)}>
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveSection(index, 1)}>
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => toggleSection(typedSection)}>
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt="" className="h-14 w-10 rounded border object-cover" />
                        )}
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs">
                          <ImageIcon className="size-3.5" />
                          {assetUploading === "image" ? "Uploading…" : imageUrl ? "Replace section image" : "Upload section image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={assetUploading === "image"}
                            onChange={(e) => handleSectionImage(typedSection, e.target.files?.[0])}
                          />
                        </label>
                        {imageUrl && (
                          <button
                            type="button"
                            className="text-destructive text-xs"
                            onClick={() => {
                              const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
                              delete current[typedSection];
                              form.setValue("decorAssets.sectionImages", current);
                            }}
                          >
                            Remove image
                          </button>
                        )}
                      </div>

                      <div className="hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <Label className="text-xs font-semibold">Text content</Label>
                            <p className="text-muted-foreground text-[10px]">
                              Add, remove and style text that belongs to this section.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTextBlock(typedSection)}
                          >
                            <Plus className="size-3.5" />
                            Add text
                          </Button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]">
                          <select
                            className="border-input h-9 rounded-md border bg-background px-2 text-xs"
                            value={community}
                            onChange={(e) =>
                              form.setValue("decorAssets.contentCommunity", e.target.value)
                            }
                          >
                            {COMMUNITY_CONTENT_GROUPS.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                          <select
                            className="border-input h-9 min-w-0 rounded-md border bg-background px-2 text-xs"
                            defaultValue=""
                            onChange={(e) => {
                              const preset = COMMUNITY_CONTENT_PRESETS.find(
                                (item) => item.id === e.target.value,
                              );
                              if (preset) addTextBlock(typedSection, preset.text);
                              e.currentTarget.value = "";
                            }}
                          >
                            <option value="">Choose from content collection…</option>
                            {contentPresets.map((preset) => (
                              <option key={preset.id} value={preset.id}>
                                {preset.community} · {preset.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {textBlocks.length === 0 ? (
                          <p className="rounded-lg border border-dashed p-3 text-center text-[11px] text-muted-foreground">
                            No extra text blocks in this section.
                          </p>
                        ) : (
                          <div className="grid gap-2">
                            {textBlocks.map((block, blockIndex) => (
                              <div key={block.id} className="grid gap-2 rounded-lg border bg-background p-3">
                                <Textarea
                                  value={block.text}
                                  rows={2}
                                  onChange={(e) => {
                                    const next = [...textBlocks];
                                    next[blockIndex] = { ...block, text: e.target.value };
                                    setSectionTextBlocks(typedSection, next);
                                  }}
                                />
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  <div className="grid gap-1">
                                    <Label className="text-[10px]">Font size</Label>
                                    <Input
                                      type="number"
                                      min={8}
                                      max={96}
                                      value={block.fontSize}
                                      onChange={(e) => {
                                        const next = [...textBlocks];
                                        next[blockIndex] = {
                                          ...block,
                                          fontSize: Number(e.target.value) || 8,
                                        };
                                        setSectionTextBlocks(typedSection, next);
                                      }}
                                    />
                                  </div>
                                  <div className="grid gap-1">
                                    <Label className="text-[10px]">Font</Label>
                                    <select
                                      className="border-input h-9 rounded-md border bg-background px-2 text-xs"
                                      value={block.fontRole}
                                      onChange={(e) => {
                                        const next = [...textBlocks];
                                        next[blockIndex] = {
                                          ...block,
                                          fontRole: e.target.value as "display" | "body" | "script",
                                        };
                                        setSectionTextBlocks(typedSection, next);
                                      }}
                                    >
                                      <option value="display">Display</option>
                                      <option value="body">Body</option>
                                      <option value="script">Script</option>
                                    </select>
                                  </div>
                                  <div className="grid gap-1">
                                    <Label className="text-[10px]">Align</Label>
                                    <select
                                      className="border-input h-9 rounded-md border bg-background px-2 text-xs"
                                      value={block.align}
                                      onChange={(e) => {
                                        const next = [...textBlocks];
                                        next[blockIndex] = {
                                          ...block,
                                          align: e.target.value as "left" | "center" | "right",
                                        };
                                        setSectionTextBlocks(typedSection, next);
                                      }}
                                    >
                                      <option value="left">Left</option>
                                      <option value="center">Center</option>
                                      <option value="right">Right</option>
                                    </select>
                                  </div>
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="w-full text-destructive"
                                      onClick={() =>
                                        setSectionTextBlocks(
                                          typedSection,
                                          textBlocks.filter((_, index) => index !== blockIndex),
                                        )
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3 rounded-xl bg-muted/35 p-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Content horizontal position</Label>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            value={sectionStyles[typedSection]?.x ?? 0}
                            onChange={(e) =>
                              updateSectionStyle(typedSection, { x: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Content vertical position</Label>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            value={sectionStyles[typedSection]?.y ?? 0}
                            onChange={(e) =>
                              updateSectionStyle(typedSection, { y: Number(e.target.value) })
                            }
                          />
                        </div>

                        <label className="flex items-center justify-between rounded-lg border bg-background p-2 sm:col-span-2">
                          <span className="text-xs font-medium">Show content background box</span>
                          <Switch
                            checked={sectionStyles[typedSection]?.showBox ?? true}
                            onCheckedChange={(value) =>
                              updateSectionStyle(typedSection, { showBox: value })
                            }
                          />
                        </label>

                        <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                          {([
                            ["primary", "Main"],
                            ["accent", "Accent"],
                            ["foreground", "Text"],
                          ] as const).map(([key, label]) => (
                            <label key={key} className="grid gap-1 text-[10px]">
                              <span>{label}</span>
                              <input
                                type="color"
                                value={
                                  sectionStyles[typedSection]?.[key] ||
                                  form.watch(`colorPalette.${key}`)
                                }
                                onChange={(e) =>
                                  updateSectionStyle(typedSection, { [key]: e.target.value })
                                }
                                className="h-9 w-full rounded border bg-transparent"
                              />
                            </label>
                          ))}
                        </div>

                        {(["display", "body", "script"] as const).map((kind) => {
                          const field =
                            kind === "display"
                              ? "displayFont"
                              : kind === "body"
                                ? "bodyFont"
                                : "scriptFont";
                          return (
                            <div key={kind} className="grid min-w-0 gap-1">
                              <Label className="text-[10px] capitalize">{kind} font</Label>
                              <select
                                className="border-input h-9 w-full min-w-0 rounded-md border bg-background px-2 text-xs"
                                value={
                                  sectionStyles[typedSection]?.[field] ||
                                  form.watch(`fontPairing.${kind}`)
                                }
                                onChange={(e) =>
                                  updateSectionStyle(typedSection, { [field]: e.target.value })
                                }
                              >
                                {FONT_OPTIONS.map((font) => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                  </div>
                </div>

                <div className="grid gap-4 lg:sticky lg:top-0 lg:self-start">
                  <ThemeRealSectionPreview
                    section={previewSection}
                    eventCategory={form.watch("eventCategory")}
                    palette={form.watch("colorPalette")}
                    fonts={form.watch("fontPairing")}
                    content={form.watch("content")}
                    revealMode={form.watch("revealMode")}
                    revealVideoUrl={form.watch("revealVideoUrl")}
                    revealAnimation={form.watch("decorAssets.revealAnimation")}
                    sectionImages={form.watch("decorAssets.sectionImages")}
                    sectionStyles={form.watch("decorAssets.sectionStyles")}
                    elementStyles={form.watch("decorAssets.elementStyles")}
                    customText={form.watch("decorAssets.customText")}
                    onSelectElement={(key) => setSelectedElement(key)}
                  />

                  <div className="grid gap-2">
                    <Label className="text-xs">Content collection community</Label>
                    <select
                      className="border-input h-10 rounded-md border bg-background px-3 text-sm"
                      value={selectedCommunity}
                      onChange={(e) =>
                        form.setValue("decorAssets.contentCommunity", e.target.value)
                      }
                    >
                      {COMMUNITY_CONTENT_GROUPS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <ThemeElementInspector
                    selectedKey={selectedElement}
                    label={selectedDefinition?.label ?? (selectedCustom ? "Added text" : undefined)}
                    text={selectedText}
                    canEditText={selectedCanEditText}
                    isCustom={Boolean(selectedCustom)}
                    style={selectedStyle}
                    presets={selectedPresets}
                    onTextChange={updateSelectedText}
                    onStyleChange={updateSelectedAppearance}
                    onChoosePreset={(preset) => updateSelectedText(preset.text)}
                    onRemove={removeSelectedCustomText}
                    onAddText={() => addCustomText()}
                  />
                </div>
              </div>
            </section>
          )}

          </div>

          <DialogFooter className="sticky bottom-0 z-30 -mx-1 border-t border-violet-200/70 bg-[#fffaff]/95 px-1 pt-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
            <Button type="submit" disabled={loading || Boolean(assetUploading)}>
              {loading ? "Saving…" : theme ? "Save changes" : type === "PDF" ? "Create PDF theme" : "Create theme"}
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
