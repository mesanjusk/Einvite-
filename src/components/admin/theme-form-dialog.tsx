"use client";

import { independentThemeOrder, eventSectionName, isEventSection } from "@/lib/invitation-sections";
import { GeminiStylePanel } from "@/components/admin/gemini-style-panel";
import { designPreview } from "@/lib/media/design-preview";
import { safeDesignSuggestion, suggestionStyles, type DesignSuggestion } from "@/lib/design-assist";
import { SectionManager } from "@/components/admin/section-manager";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Undo2,
  Redo2,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Music,
  Copy,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
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
import {
  upsertThemeAction,
  upsertThemeLibraryAssetAction,
} from "@/lib/actions/admin";
import {
  COMMUNITY_CONTENT_GROUPS,
  COMMUNITY_CONTENT_PRESETS,
} from "@/lib/theme-content-library";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { sectionDisplayName } from "@/lib/section-labels";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDraftHistory } from "@/components/admin/use-draft-history";
import { ThemeStudioShell, type StudioTool } from "@/components/admin/theme-studio-shell";
import { ThemeRealSectionPreview } from "@/components/admin/theme-real-section-preview";
import { ThemeDraftPreview } from "@/components/admin/theme-draft-preview";
import { ThemeAssetReview } from "@/components/admin/theme-asset-review";
import { contentPlacements, PREVIEW_SECTION_TYPES } from "@/lib/theme-preview";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DecorAssets = {
  sectionNames?: Record<string, string>;
  eventSections?: string[];
  musicUrl?: string;
  musicName?: string;
  revealVideoWebmUrl?: string;
  revealVideoPosterUrl?: string;
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
      width?: number;
      fontSize: number;
      fontRole: "display" | "body" | "script";
      align: "left" | "center" | "right";
      color?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      letterSpacing?: number;
      lineHeight?: number;
      opacity?: number;

    }>
  >;
  elementStyles?: Record<string, ThemeElementStyleValue>;
  customText?: Record<
    string,
    Array<{
      id: string;
      text: string;
      width?: number;
      fontSize: number;
      fontRole: "display" | "body" | "script";
      align: "left" | "center" | "right";
      color?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      letterSpacing?: number;
      lineHeight?: number;
      opacity?: number;

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
      scratchShape?: "box" | "round" | "heart" | "diamond" | "hexagon";
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
  eventCategories?: string[];
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
  SPARKLES: "Lavender sparkles",
  CONFETTI: "Celebration confetti",
  PETALS: "Falling petals",
};

function defaultValues(type: ThemeType, theme?: ThemeRecord): ThemeFormValues {
  const decor = theme?.decorAssets ?? {};
  const result: ThemeFormValues = {
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
    eventCategories:
      ((theme?.eventCategories?.length ? theme.eventCategories : [theme?.eventCategory ?? "wedding"]) as ThemeFormValues["eventCategories"]),
    isPremium: theme?.isPremium ?? false,
    sortOrder: theme?.sortOrder ?? 0,
    colorPalette: theme?.colorPalette ?? {
      primary: "#76508c",
      secondary: "#eee6f4",
      accent: "#a987bd",
      background: "#ffffff",
      foreground: "#4b3659",
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
      sectionNames: decor.sectionNames ?? {},
      eventSections: decor.eventSections ?? ["Sangeet", "Mehendi", "Wedding"],
      musicUrl: decor.musicUrl ?? "",
      musicName: decor.musicName ?? "",
      revealVideoWebmUrl: decor.revealVideoWebmUrl ?? "",
      revealVideoPosterUrl: decor.revealVideoPosterUrl ?? "",
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
      independentThemeOrder((theme?.sectionOrder as ThemeFormValues["sectionOrder"]) ?? [
        "ENVELOPE",
        "HERO",
        "COUNTDOWN",
        "TIMELINE",
        "GALLERY",
        "VENUE",
        "RSVP",
        "THANK_YOU",
      ], decor.eventSections ?? ["Sangeet", "Mehendi", "Wedding"]),
  };
  for (const section of result.sectionOrder.filter(isEventSection)) {
    const assets = result.decorAssets!;
    assets.sectionImages ??= {}; assets.sectionStyles ??= {}; assets.elementStyles ??= {};
    if (decor.sectionImages?.TIMELINE && !assets.sectionImages[section]) assets.sectionImages[section] = decor.sectionImages.TIMELINE;
    if (decor.sectionStyles?.TIMELINE && !assets.sectionStyles[section]) assets.sectionStyles[section] = decor.sectionStyles.TIMELINE as NonNullable<typeof assets.sectionStyles>[string];
    for (const [key, value] of Object.entries(decor.elementStyles ?? {})) if (key.startsWith("TIMELINE.")) assets.elementStyles[key.replace("TIMELINE.", `${section}.`)] ??= value;
  }
  return result;
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
  const [aiKey, setAiKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<DesignSuggestion | null>(null);
  const aiVersion = useRef(0);
  const [open, setOpen] = useState(standalone);
  const [loading, setLoading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [assetUploading, setAssetUploading] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<string>("HERO");
  const [selectedElement, setSelectedElement] = useState<string | null>("HERO.invitationLetter");
  const [mobileTool, setMobileTool] = useState<StudioTool>(theme ? "content" : "theme");
  const formId = useId();
  const [libraryQuery, setLibraryQuery] = useState("");
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bulkArtworkInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<ThemeFormValues, unknown, ThemeFormInput>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: defaultValues(type, theme),
  });

  const sectionOrder = form.watch("sectionOrder");
  const draft = form.watch();
  function displaySectionName(section: string) { return draft.decorAssets?.sectionNames?.[section] ?? sectionDisplayName(section); }
  const history = useDraftHistory(draft, (next) => {
    form.reset(next);
    if (!next.sectionOrder.includes(previewSection)) {
      setPreviewSection(next.sectionOrder[0]);
      setSelectedElement(elementsForSection(next.sectionOrder[0])[0]?.key ?? null);
    }
  });
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
    sectionType: string,
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
    sectionType: string,
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

  function addCustomText(text = "New text", appearance: Partial<ThemeElementStyleValue> = {}) {
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
        fontSize: appearance.fontSize ?? 22,
        fontRole: appearance.fontRole ?? "body",
        align: appearance.align ?? "center",
        color: appearance.color,
        bold: appearance.bold,
        italic: appearance.italic,
        underline: appearance.underline,
        letterSpacing: appearance.letterSpacing,
        lineHeight: appearance.lineHeight,
        opacity: appearance.opacity,
        x: appearance.x ?? 0,
        y: appearance.y ?? 0,
      },
    ]);
    setSelectedElement(id);
  }

  // Legacy PR #79 helpers remain only so old saved data can be opened safely.
  // The corresponding UI is hidden and these blocks are no longer rendered publicly.
  function setSectionTextBlocks(
    sectionType: string,
    blocks: NonNullable<DecorAssets["sectionTextBlocks"]>[string],
  ) {
    const current = (form.getValues("decorAssets.sectionTextBlocks") ?? {}) as NonNullable<
      DecorAssets["sectionTextBlocks"]
    >;
    form.setValue("decorAssets.sectionTextBlocks", { ...current, [sectionType]: blocks });
  }

  function addTextBlock(_sectionType: string, text = "New text") {
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
      setCustomText(custom.section as string, blocks);
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
        ...(patch.width !== undefined ? { width: patch.width } : {}),
        ...(patch.fontSize !== undefined ? { fontSize: patch.fontSize } : {}),
        ...(patch.fontRole !== undefined ? { fontRole: patch.fontRole } : {}),
        ...(patch.align !== undefined ? { align: patch.align } : {}),
        ...(patch.color !== undefined ? { color: patch.color } : {}),
        ...(patch.bold !== undefined ? { bold: patch.bold } : {}),
        ...(patch.italic !== undefined ? { italic: patch.italic } : {}),
        ...(patch.underline !== undefined ? { underline: patch.underline } : {}),
        ...(patch.letterSpacing !== undefined ? { letterSpacing: patch.letterSpacing } : {}),
        ...(patch.lineHeight !== undefined ? { lineHeight: patch.lineHeight } : {}),
        ...(patch.opacity !== undefined ? { opacity: patch.opacity } : {}),
        ...(patch.x !== undefined ? { x: patch.x } : {}),
        ...(patch.y !== undefined ? { y: patch.y } : {}),
      };
      setCustomText(custom.section as string, blocks);
      return;
    }
    updateElementStyle(selectedElement, patch);
  }

  function removeSelectedCustomText() {
    if (!selectedElement) return;
    const custom = findCustomText(selectedElement);
    if (!custom) return;
    setCustomText(
      custom.section as string,
      customTextBySection[custom.section].filter((_, index) => index !== custom.index),
    );
    setSelectedElement(null);
  }

  function toggleSection(sectionType: string) {
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

  function designLayers() {
    const current = form.getValues();
    return current.sectionOrder.flatMap((section) => [...elementsForSection(section).map((element) => ({ key: element.key, text: current.decorAssets?.elementStyles?.[element.key]?.text ?? element.fallbackText ?? element.label })), ...(current.decorAssets?.customText?.[section] ?? []).map((block) => ({ key: block.id, text: block.text }))]);
  }
  function applyDesignSuggestion(suggestion: DesignSuggestion) {
    const styles = suggestionStyles(suggestion);
    form.setValue("colorPalette", suggestion.palette, { shouldDirty: true });
    form.setValue("fontPairing", suggestion.fonts, { shouldDirty: true });
    const existing = form.getValues("decorAssets.elementStyles") ?? {};
    form.setValue("decorAssets.elementStyles", { ...existing, ...Object.fromEntries(Object.entries(styles).filter(([key]) => !key.startsWith("CUSTOM.")).map(([key, value]) => [key, { ...existing[key], ...value }])) }, { shouldDirty: true });
    const custom = form.getValues("decorAssets.customText") ?? {};
    form.setValue("decorAssets.customText", Object.fromEntries(Object.entries(custom).map(([section, blocks]) => [section, blocks.map((block) => ({ ...block, ...styles[block.id] }))])), { shouldDirty: true });
    toast.success("Suggested styles applied. Review the preview; all tools and Undo remain available.");
  }
  async function analyzeDesignFile(file: File, automatic = false) {
    if (!aiKey) { if (!automatic) toast.message("Add your Gemini API key in AI style."); return; }
    const version = ++aiVersion.current;
    const elements = designLayers(); if (!elements.length) return;
    const before = JSON.stringify([form.getValues("sectionOrder"), form.getValues("colorPalette"), form.getValues("fontPairing"), form.getValues("decorAssets.elementStyles"), form.getValues("decorAssets.customText")]);
    setAiBusy(true);
    try {
      const response = await fetch("/api/design/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: aiKey, image: await designPreview(file), elements }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (data.skipped || version !== aiVersion.current) return;
      const suggestion = safeDesignSuggestion(data.suggestion, elements.map((element) => element.key)); setAiSuggestion(suggestion);
      const after = JSON.stringify([form.getValues("sectionOrder"), form.getValues("colorPalette"), form.getValues("fontPairing"), form.getValues("decorAssets.elementStyles"), form.getValues("decorAssets.customText")]);
      if (automatic && before === after) applyDesignSuggestion(suggestion); else { setMobileTool("ai"); toast.message("Suggestion ready. Apply it when ready."); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Design analysis failed; manual editing is available."); }
    finally { if (version === aiVersion.current) setAiBusy(false); }
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
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
      return null;
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
      form.setValue("previewImage", uploaded.posterUrl ?? "");
      form.setValue("decorAssets.revealVideoWebmUrl", uploaded.webmUrl ?? "");
      form.setValue("decorAssets.revealVideoPosterUrl", uploaded.posterUrl ?? "");
      if (file && aiEnabled) void analyzeDesignFile(file, true);
      const saved = await upsertThemeLibraryAssetAction({
        name: file?.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") || `${form.getValues("name") || "Theme"} reveal`,
        kind: "REVEAL_VIDEO",
        url: uploaded.url,
        thumbnailUrl: uploaded.posterUrl,
        sortOrder: revealVideoLibrary.length,
      });
      if (!saved.success) {
        toast.error(saved.error);
      } else {
        toast.success("Reveal video uploaded, selected and saved to the gallery.");
      }
    }
  }

  async function handleSectionImage(
    sectionType: string,
    file?: File,
  ) {
    const uploaded = await uploadAsset(file, "image");
    if (!uploaded?.url) return;
    const current = form.getValues("decorAssets.sectionImages") ?? {};
    form.setValue("decorAssets.sectionImages", {
      ...current,
      [sectionType]: uploaded.url,
    });
    if (file && aiEnabled) void analyzeDesignFile(file, true);
    const saved = await upsertThemeLibraryAssetAction({
      name:
        file?.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") ||
        `${form.getValues("name") || "Theme"} ${sectionType.toLowerCase()} artwork`,
      kind: "IMAGE",
      url: uploaded.url,
      category: sectionType,
      community: form.getValues("decorAssets.contentCommunity") || "General",
      sortOrder: imageLibrary.length,
    });
    setPreviewSection(sectionType);
    if (!saved.success) {
      toast.error(saved.error);
    } else {
      toast.success(`${displaySectionName(sectionType)} artwork uploaded and saved to Template Library.`);
    }
  }

  async function handleBulkArtwork(file?: File) {
    const uploaded = await uploadAsset(file, "image");
    if (!uploaded?.url) return;
    const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
    for (const sectionType of form.getValues("sectionOrder")) {
      current[sectionType] = uploaded.url;
    }
    form.setValue("decorAssets.sectionImages", current);
    if (file && aiEnabled) void analyzeDesignFile(file, true);
    const saved = await upsertThemeLibraryAssetAction({
      name:
        file?.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") ||
        `${form.getValues("name") || "Theme"} shared artwork`,
      kind: "IMAGE",
      url: uploaded.url,
      category: "ALL_SECTIONS",
      community: form.getValues("decorAssets.contentCommunity") || "General",
      sortOrder: imageLibrary.length,
    });
    setPreviewSection((form.getValues("sectionOrder")[0] ?? "HERO") as string);
    if (!saved.success) {
      toast.error(saved.error);
    } else {
      toast.success("Artwork applied to every active section and saved to Template Library.");
    }
  }

  function toggleThemeCategory(slug: string) {
    const current = (form.getValues("eventCategories") ?? []).filter(
      (item): item is ThemeFormInput["eventCategory"] => Boolean(item),
    );
    const typedSlug = slug as ThemeFormInput["eventCategory"];
    const exists = current.includes(typedSlug);
    if (exists && current.length === 1) {
      toast.error("Keep at least one celebration selected.");
      return;
    }
    const next = exists
      ? current.filter((item) => item !== slug)
      : [...current, typedSlug];
    form.setValue("eventCategories", next, { shouldValidate: true });
    form.setValue("eventCategory", next[0] ?? "wedding");
  }

  function applyLibraryImageToAll(url: string) {
    const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
    for (const sectionType of form.getValues("sectionOrder")) {
      current[sectionType] = url;
    }
    form.setValue("decorAssets.sectionImages", current);
    toast.success("Library artwork applied to every active section.");
  }

  const selectedDefinition = selectedElement
    ? definitionForElement(selectedElement)
    : undefined;
  const selectedCustom = findCustomText(selectedElement);
  const selectedStyle: ThemeElementStyleValue = selectedCustom
    ? {
        width: selectedCustom.block.width,
        fontSize: selectedCustom.block.fontSize,
        fontRole: selectedCustom.block.fontRole,
        align: selectedCustom.block.align,
        color: selectedCustom.block.color,
        bold: selectedCustom.block.bold,
        italic: selectedCustom.block.italic,
        underline: selectedCustom.block.underline,
        letterSpacing: selectedCustom.block.letterSpacing,
        lineHeight: selectedCustom.block.lineHeight,
        opacity: selectedCustom.block.opacity,
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
  const canEditSectionText = previewSection !== "ENVELOPE" && PREVIEW_SECTION_TYPES.has(previewSection);
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

  function chooseTool(tool: StudioTool) {
    setMobileTool(tool);
    if (tool === "video" && sectionOrder.includes("ENVELOPE")) {
      setPreviewSection("ENVELOPE");
      setSelectedElement(null);
    }
  }

  function selectSectionForEditing(section: string) {
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
        | string
        | undefined;
    toggleSection(previewSection);
    if (nextSection) selectSectionForEditing(nextSection);
  }

  function duplicateSelectedContent() {
    const text = selectedText.trim();
    addCustomText(text || "New text", selectedStyle);
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

  async function handleMusicUpload(file?: File) {
    if (!file) return;
    setAssetUploading("audio");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/music/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.url) { toast.error(result.error ?? "Music upload failed."); return; }
      form.setValue("decorAssets.musicUrl", result.url, { shouldDirty: true });
      form.setValue("decorAssets.musicName", file.name, { shouldDirty: true });
      toast.success("Music selected. Press Play to check it before saving.");
    } catch {
      toast.error("Music upload failed. Check your connection and try again.");
    } finally { setAssetUploading(null); }
  }

  async function onSubmit(values: ThemeFormInput) {
    setLoading(true);
    try {
      const result = await upsertThemeAction(values);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(theme ? "Theme updated." : "Theme saved privately. Publish it from Content Library when ready.");
      if (standalone) router.push(returnHref);
      else { setOpen(false); router.refresh(); }
    } catch {
      toast.error("Could not save the theme. Your draft is still here; check your connection and retry.");
    } finally { setLoading(false); }
  }

  const themeSettings = (<div className="grid gap-5">
<div className="grid gap-4 ">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold text-[#4b3659]">
                    Theme name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    aria-label="Theme name"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    value={form.watch("name")}
                    onChange={(e) => form.setValue("name", e.target.value, { shouldValidate: true })}
                    placeholder="e.g. Lavender Floral Wedding"
                    autoFocus={!theme}
                  />
                  {form.formState.errors.name && <p role="alert" className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold text-[#4b3659]">Celebrations</Label>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {EVENT_CATEGORIES.map((category) => {
                      const active = (form.watch("eventCategories") ?? []).includes(
                        category.slug as ThemeFormInput["eventCategory"],
                      );
                      return (
                        <button
                          key={category.slug}
                          type="button"
                          onClick={() => toggleThemeCategory(category.slug)}
                          className={
                            active
                              ? "shrink-0 rounded-full border border-violet-500 bg-violet-100 px-3 py-2 text-[10px] font-bold text-[#5a3d6d]"
                              : "shrink-0 rounded-full border border-violet-200 bg-white px-3 py-2 text-[10px] font-semibold text-[#765f81]"
                          }
                        >
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex min-w-[150px] items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/45 px-3 py-2.5">
                  <span className="text-xs font-bold text-[#4b3659]">Premium <span className="text-destructive">*</span></span>
                  <Switch
                    checked={form.watch("isPremium")}
                    onCheckedChange={(value) => form.setValue("isPremium", value)}
                  />
                </label>
              </div>
                <section className="grid gap-3">
                  <Label className="text-sm font-bold">Colour palette</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["primary", "secondary", "accent", "background", "foreground"] as const).map((key) => (
                      <label key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-white p-3">
                        <span className="text-xs font-semibold capitalize text-[#5a4168]">{key}</span>
                        <input type="color" value={form.watch(`colorPalette.${key}`)} onChange={(e) => form.setValue(`colorPalette.${key}`, e.target.value)} className="size-9 rounded-lg border bg-white" />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="grid gap-3">
                  <Label className="text-sm font-bold">Fonts</Label>
                  {(["display", "body", "script"] as const).map((key) => (
                    <div key={key} className="grid gap-1.5">
                      <Label className="text-xs capitalize">{key} font</Label>
                      <select className="border-input h-10 rounded-md border bg-white px-3 text-sm" value={form.watch(`fontPairing.${key}`)} onChange={(e) => form.setValue(`fontPairing.${key}`, e.target.value)}>
                        {FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
                      </select>
                    </div>
                  ))}
                </section>

</div>);
  const revealPanel = (<div className="grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/35 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#4b3659]">Opening reveal</p>
                    <p className="text-[9px] text-[#8a7397]">Thumbnail is generated from this reveal — no separate thumbnail field.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant={form.watch("revealMode") === "ANIMATION" ? "default" : "outline"} size="sm" onClick={() => {
                      form.setValue("revealMode", "ANIMATION");
                      form.setValue("previewImage", "");
                    }}>
                      <Sparkles className="size-3.5" />
                      Animation
                    </Button>
                    <Button type="button" variant={form.watch("revealMode") === "VIDEO" ? "default" : "outline"} size="sm" onClick={() => form.setValue("revealMode", "VIDEO")}>
                      <Video className="size-3.5" />
                      Video reveal
                    </Button>
                  </div>
                </div>

                {form.watch("revealMode") === "ANIMATION" ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Animation style</Label>
                      <select
                        className="border-input h-10 rounded-md border bg-white px-2 text-xs"
                        value={form.watch("decorAssets.revealAnimation.preset")}
                        onChange={(e) => form.setValue("decorAssets.revealAnimation.preset", e.target.value as (typeof REVEAL_ANIMATION_PRESETS)[number])}
                      >
                        {REVEAL_ANIMATION_PRESETS.map((preset) => <option key={preset} value={preset}>{ANIMATION_LABELS[preset]}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Intensity</Label>
                      <Input type="number" min="0.5" max="2" step="0.1" {...form.register("decorAssets.revealAnimation.intensity", { valueAsNumber: true })} />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Speed</Label>
                      <Input type="number" min="0.5" max="2" step="0.1" {...form.register("decorAssets.revealAnimation.speed", { valueAsNumber: true })} />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-[#6c4a7d]">
                        <Upload className="size-4" />
                        {assetUploading === "video" ? "Uploading…" : "Upload new reveal"}
                        <input type="file" accept="video/mp4,video/webm,video/*" className="hidden" disabled={assetUploading === "video"} onChange={(e) => handleRevealVideo(e.target.files?.[0])} />
                      </label>
                      <Link prefetch={false} href="/admin/library/video-reveals" className="inline-flex items-center rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-[#76508c]">
                        Manage gallery
                      </Link>
                    </div>
                    {revealVideoLibrary.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {revealVideoLibrary.map((item) => (
                          <button
                            key={item.url}
                            type="button"
                            aria-pressed={draft.revealVideoUrl === item.url}
                            onClick={() => {
                              form.setValue("revealVideoUrl", item.url);
                              form.setValue("previewImage", item.thumbnailUrl ?? "");
                              form.setValue("decorAssets.revealVideoWebmUrl", "");
                              form.setValue("decorAssets.revealVideoPosterUrl", item.thumbnailUrl ?? "");
                            }}
                            className={form.watch("revealVideoUrl") === item.url ? "overflow-hidden rounded-xl border-2 border-violet-600 bg-violet-50 text-left" : "overflow-hidden rounded-xl border border-violet-200 bg-white text-left"}
                          >
                            {item.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.thumbnailUrl} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                            ) : (
                              <span className="grid aspect-video w-full place-items-center bg-violet-50 text-violet-700"><Video className="size-6" /><span className="sr-only">Video thumbnail unavailable</span></span>
                            )}
                            <span className="block truncate px-2 py-2 text-[11px] font-semibold text-[#5f476c]">{draft.revealVideoUrl === item.url && <span className="mb-1 flex items-center gap-1 text-violet-700"><CheckCircle2 className="size-3" />Selected</span>}{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="flex items-center gap-1 text-xs font-semibold text-violet-700">
                  <CheckCircle2 className="size-3.5" />
                  {draft.revealMode === "VIDEO" ? (draft.revealVideoUrl ? `Selected: ${revealVideoLibrary.find((item) => item.url === draft.revealVideoUrl)?.label || "Uploaded or linked reveal video"}` : "Video mode selected — choose a video") : `Selected: ${ANIMATION_LABELS[draft.decorAssets?.revealAnimation?.preset ?? "MAGIC_BLOOM"]}`}
                </p>
                {form.formState.errors.revealVideoUrl && <p role="alert" className="text-xs text-destructive">{form.formState.errors.revealVideoUrl.message}</p>}
              </div>);
  const musicPanel = (<section className="grid gap-3 rounded-2xl border border-violet-200 bg-violet-50/35 p-3">
                <div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-bold text-[#4b3659]"><Music className="size-4" />Theme music (optional)</p><p className="mt-1 text-[10px] text-muted-foreground">Upload your own audio. It becomes the starting music for new invitations using this theme; customers can replace or remove it.</p></div>{draft.decorAssets?.musicUrl && <Button type="button" variant="ghost" size="sm" onClick={() => { form.setValue("decorAssets.musicUrl", ""); form.setValue("decorAssets.musicName", ""); }}>Remove</Button>}</div>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed bg-white p-3 text-xs font-semibold"><Upload className="size-4" />{assetUploading === "audio" ? "Uploading music…" : "Upload music (up to 15 MB)"}<input type="file" accept="audio/*" className="hidden" disabled={Boolean(assetUploading)} onChange={(event) => handleMusicUpload(event.target.files?.[0])} /></label>
                <details><summary className="cursor-pointer text-xs text-muted-foreground">Use an existing audio URL</summary><Input className="mt-2" aria-label="Theme music URL" placeholder="https://…/your-audio.mp3" value={draft.decorAssets?.musicUrl ?? ""} onChange={(event) => { form.setValue("decorAssets.musicUrl", event.target.value, { shouldValidate: true }); form.setValue("decorAssets.musicName", "Linked theme music"); }} /></details>
                {form.formState.errors.decorAssets?.musicUrl && <p role="alert" className="text-xs text-destructive">{form.formState.errors.decorAssets.musicUrl.message}</p>}
                {draft.decorAssets?.musicUrl ? <ThemeAssetReview kind="audio" url={draft.decorAssets.musicUrl} label={draft.decorAssets.musicName || "Theme music"} /> : <p className="text-xs text-muted-foreground">No music selected</p>}
              </section>);
  const artworkPanel = (<div><div className="grid gap-3 rounded-2xl border border-violet-200/70 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#4b3659]">Section artwork</p>
                          <p className="text-[9px] text-[#8a7397]">Background for {displaySectionName(previewSection)}</p>
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
                      {imageLibrary.length > 0 && (
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px]">Choose from Template Library</Label>
                            <Link prefetch={false} href="/admin/library/templates" className="text-[9px] font-semibold text-[#76508c]">Manage library</Link>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {imageLibrary.map((asset) => (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
                                  form.setValue("decorAssets.sectionImages", { ...current, [previewSection]: asset.url });
                                }}
                                className={
                                  (form.watch("decorAssets.sectionImages") ?? {})[previewSection] === asset.url
                                    ? "overflow-hidden rounded-xl border-2 border-[#76508c] bg-violet-50"
                                    : "overflow-hidden rounded-xl border border-violet-200 bg-white"
                                }
                                aria-pressed={draft.decorAssets?.sectionImages?.[previewSection] === asset.url}
                                title={asset.name}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={asset.thumbnailUrl || asset.url} alt={asset.name} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                                <span className="block truncate px-2 py-2 text-[11px] font-semibold text-[#5f476c]">{draft.decorAssets?.sectionImages?.[previewSection] === asset.url && <span className="block font-bold text-violet-700">✓ Selected</span>}{asset.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-3 py-3 text-xs font-semibold text-[#6c4a7d]">
                        <ImageIcon className="size-4" />
                        {assetUploading === "image" ? "Uploading…" : "Upload new image"}
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
                        Upload artwork for all sections
                      </Button>
                      <input
                        ref={bulkArtworkInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleBulkArtwork(e.target.files?.[0])}
                      />
                    </div>
<div className="mt-3 grid gap-2 rounded-xl border p-3"><p className="text-xs text-muted-foreground">Apply the selected section artwork to every active section.</p><Button type="button" variant="outline" disabled={!draft.decorAssets?.sectionImages?.[previewSection]} onClick={() => applyLibraryImageToAll(draft.decorAssets?.sectionImages?.[previewSection] || "")}>Apply selected artwork to all sections</Button></div></div>);
  const sectionNavigation = (<div className="flex min-w-0 items-center gap-2">
                {standalone && <Link prefetch={false} href={returnHref} aria-label="Back to themes" className="grid size-8 shrink-0 place-items-center rounded-full border"><ArrowLeft className="size-4" /></Link>}
                <span title={draft.name || "New theme"} className="hidden max-w-32 shrink-0 truncate text-xs font-semibold xl:block">{draft.name || "New theme"}</span>
                <div className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto">
                  {sectionOrder.map((sectionType) => {
                    const typedSection = sectionType as string;
                    return (
                      <button
                        key={sectionType}
                        type="button"
                        onClick={() => selectSectionForEditing(typedSection)}
                        aria-pressed={previewSection === typedSection}
                        className={
                          previewSection === typedSection
                            ? "shrink-0 rounded-full bg-[#76508c] px-3 py-2 text-[11px] font-bold text-white shadow-sm"
                            : "shrink-0 rounded-full border border-violet-200 bg-white px-3 py-2 text-[11px] font-semibold text-[#5a4168]"
                        }
                      >
                        {displaySectionName(sectionType)}
                      </button>
                    );
                  })}
                  {SECTION_TYPES.filter((item) => item !== "TIMELINE" && !sectionOrder.includes(item)).map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={!PREVIEW_SECTION_TYPES.has(item)}
                      title={PREVIEW_SECTION_TYPES.has(item) ? `Add ${displaySectionName(item)}` : "Website section not available yet"}
                      onClick={() => {
                        toggleSection(item);
                        selectSectionForEditing(item);
                      }}
                      className="disabled:cursor-not-allowed disabled:opacity-40 shrink-0 rounded-full border border-dashed border-violet-300 bg-violet-50 px-3 py-2 text-[11px] font-semibold text-[#76508c]"
                    >
                      + {displaySectionName(item)}
                    </button>
                  ))}
                </div>

                <div className="flex shrink-0 items-center gap-1 border-l border-violet-200 pl-2"><Button type="button" variant="ghost" size="icon" aria-label="Undo theme change" disabled={!history.canUndo} onClick={history.undo}><Undo2 className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="Redo theme change" disabled={!history.canRedo} onClick={history.redo}><Redo2 className="size-4" /></Button>
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
              </div>);
  const sectionCanvas = (<div className="rounded-[1.75rem] border border-violet-200/70 bg-[radial-gradient(circle_at_top,#fbf5ff_0%,#f2e9f8_48%,#ede2f5_100%)] mx-auto h-full min-h-0 w-full max-w-[520px] p-2 shadow-inner">
                <ThemeRealSectionPreview
                  eventName={draft.decorAssets?.sectionNames?.[previewSection] ?? (isEventSection(previewSection) ? eventSectionName(previewSection) : draft.decorAssets?.eventSections?.[0])}
                  section={previewSection}
                  eventCategory={(form.watch("eventCategories")?.[0] ?? form.watch("eventCategory") ?? "wedding") as ThemeFormInput["eventCategory"]}
                  palette={form.watch("colorPalette")}
                  fonts={form.watch("fontPairing")}
                  content={form.watch("content")}
                  revealMode={form.watch("revealMode")}
                  revealVideoUrl={form.watch("revealVideoUrl")}
                  revealVideoWebmUrl={draft.decorAssets?.revealVideoWebmUrl}
                  revealVideoPosterUrl={draft.decorAssets?.revealVideoPosterUrl || draft.previewImage}
                  selectedElement={selectedElement}
                  revealAnimation={form.watch("decorAssets.revealAnimation")}
                  sectionImages={form.watch("decorAssets.sectionImages")}
                  sectionStyles={form.watch("decorAssets.sectionStyles")}
                  elementStyles={form.watch("decorAssets.elementStyles")}
                  customText={form.watch("decorAssets.customText")}
                  onSelectElement={(key) => {
                    setSelectedElement(key);
                    setMobileTool((current) => current === "text" ? "text" : "content");
                  }}
                  onMoveElement={(key, position) => {
                    const custom = findCustomText(key);
                    if (custom) {
                      const blocks = [...customTextBySection[custom.section]];
                      blocks[custom.index] = { ...custom.block, ...position };
                      setCustomText(custom.section as string, blocks);
                    } else { updateElementStyle(key, position); }
                  }}
                />
              </div>);
  const toolPanel = (<div className="grid gap-3">
                {!canEditSectionText && ["content", "library", "text", "advanced"].includes(mobileTool) && <p className="rounded-xl border bg-violet-50 p-4 text-xs leading-relaxed text-violet-900">{previewSection === "ENVELOPE" ? "The opening uses a reveal video or coded animation. Use Video or Templates below to edit it. Choose a body section above to add or style text." : "This section does not have a website renderer yet. Choose an available invitation section above."}</p>}
                {mobileTool === "content" && canEditSectionText && (
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
                                {elementStyles[definition.key]?.hidden ? "Hidden · select to restore" : layerText || "Empty"}
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
                          <p className="text-[9px] text-[#8a7397]">Edit the selected layer only · library text remains reusable</p>
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
                          Customer placeholder: names, date, functions or venue. Style or position it here; the customer enters its value on mobile.
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
                                updateElementStyle(selectedElement, { hidden: !selectedStyle.hidden });
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                            {selectedCustom ? "Delete" : selectedStyle.hidden ? "Show" : "Hide"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {mobileTool === "library" && canEditSectionText && (
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

                    <div className="grid grid-cols-2 gap-2">
                      {libraryPresets.map((preset) => {
                        const cardImage =
                          preset.previewImage ||
                          (form.watch("decorAssets.sectionImages") ?? {})[previewSection] ||
                          theme?.previewImage ||
                          null;
                        return (
                          <div key={preset.id} className={`grid min-w-0 content-between overflow-hidden rounded-2xl border bg-white shadow-sm ${contentPlacements(draft, preset.text).length ? "border-2 border-violet-600" : "border-violet-200/70"}`}>
                            <div>
                              {cardImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cardImage} alt="" className="aspect-[16/9] w-full object-cover" />
                              ) : (
                                <div className="grid aspect-[16/9] place-items-center bg-violet-50 text-[#76508c]">
                                  <BookOpen className="size-5" />
                                </div>
                              )}
                              <div className="p-2">
                                {contentPlacements(draft, preset.text).length > 0 && <p className="mb-1 flex items-center gap-1 text-[9px] font-bold text-violet-700"><CheckCircle2 className="size-3 shrink-0" />Selected · {contentPlacements(draft, preset.text).map(sectionDisplayName).join(", ")}</p>}
                                <p className="line-clamp-2 text-[10px] font-bold leading-tight text-[#4b3659]">{preset.label}</p>
                                <p className="mt-1 truncate text-[8px] font-semibold text-[#9a82a7]">
                                  {preset.community} · {displaySectionName(preset.suggestedSection)}
                                </p>
                                <p className="mt-1 line-clamp-2 text-[8px] leading-relaxed text-[#75617f]">{preset.text}</p>
                              </div>
                            </div>
                            <div className="px-2 pb-2">
                              <Button type="button" variant="outline" size="sm" className="h-8 w-full text-[9px]" onClick={() => applyLibraryPreset(preset)}>
                                <Plus className="size-3" />
                                Apply
                              </Button>
                              <button type="button" className="mt-2 w-full text-[9px] font-semibold text-violet-700" onClick={() => { addCustomText(preset.text); setMobileTool("content"); }}>Add as new text</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {libraryPresets.length === 0 && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                        No library content matches this search.
                      </div>
                    )}
                  </div>
                )}

                {mobileTool === "text" && canEditSectionText && (
                  <div className="grid gap-4 p-3">
                    {!selectedElement ? (
                      <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                        Select a text layer or tap text in the preview first.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="grid gap-1">
                            <label className="mb-3 grid gap-1 text-[10px]">Content width: {selectedStyle.width ?? 100}%<input type="range" min="20" max="100" value={selectedStyle.width ?? 100} onChange={(event) => updateSelectedAppearance({ width: Number(event.target.value) })} /></label>
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
                                aria-label="Text size"
                                min={8}
                                max={120}
                                value={selectedStyle.fontSize ?? ""}
                                placeholder="Auto"
                                onChange={(e) =>
                                  updateSelectedAppearance({
                                    fontSize: e.target.value ? Math.max(8, Math.min(120, Number(e.target.value))) : undefined,
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
                          <div className="flex gap-2">{([['bold', 'Bold'], ['italic', 'Italic'], ['underline', 'Underline']] as const).map(([key, label]) => <Button key={key} type="button" size="sm" variant={selectedStyle[key] ? "default" : "outline"} aria-pressed={Boolean(selectedStyle[key])} onClick={() => updateSelectedAppearance({ [key]: !selectedStyle[key] })}>{label}</Button>)}</div>
                          <label className="grid gap-1 text-xs">Letter spacing<Input type="number" aria-label="Letter spacing" min={-2} max={12} step={0.5} value={selectedStyle.letterSpacing ?? 0} onChange={(event) => updateSelectedAppearance({ letterSpacing: Math.max(-2, Math.min(12, Number(event.target.value))) })} /></label>
                          <label className="grid gap-1 text-xs">Line height<Input type="number" aria-label="Line height" min={0.8} max={3} step={0.1} value={selectedStyle.lineHeight ?? 1.25} onChange={(event) => updateSelectedAppearance({ lineHeight: Math.max(0.8, Math.min(3, Number(event.target.value))) })} /></label>
                          <label className="grid gap-1 text-xs">Opacity · {Math.round((selectedStyle.opacity ?? 1) * 100)}%<input type="range" aria-label="Text opacity" min={0} max={1} step={0.05} value={selectedStyle.opacity ?? 1} onChange={(event) => updateSelectedAppearance({ opacity: Number(event.target.value) })} /></label>
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

                {mobileTool === "ai" && <GeminiStylePanel apiKey={aiKey} onApiKey={setAiKey} enabled={aiEnabled} onEnabled={setAiEnabled} busy={aiBusy} ready={Boolean(aiSuggestion)} onApply={() => aiSuggestion && applyDesignSuggestion(aiSuggestion)} onAnalyze={(file) => void analyzeDesignFile(file)} />}
                {mobileTool === "sections" && <SectionManager names={draft.decorAssets?.sectionNames} onCustomSection={(key, name) => form.setValue("decorAssets.sectionNames", { ...form.getValues("decorAssets.sectionNames"), [key]: name }, { shouldDirty: true })} selected={sectionOrder} onChange={(next) => { form.setValue("sectionOrder", next, { shouldDirty: true }); if (!next.includes(previewSection)) selectSectionForEditing(next[0]); }} onSelect={selectSectionForEditing} />}
                {mobileTool === "advanced" && canEditSectionText && (
                  <div className="grid gap-4 p-3">
                    {previewSection === "COUNTDOWN" && (
                      <label className="grid gap-2 rounded-xl border bg-white p-3 text-xs font-semibold">
                        Scratch-card shape
                        <select className="rounded-lg border p-2" value={sectionStyles.COUNTDOWN?.scratchShape ?? "box"}
                          onChange={(event) => updateSectionStyle("COUNTDOWN", { scratchShape: event.target.value as "box" | "round" | "heart" | "diamond" | "hexagon" })}>
                          {["box", "round", "heart", "diamond", "hexagon"].map((shape) => <option key={shape} value={shape}>{shape}</option>)}
                        </select>
                        <span className="font-normal text-muted-foreground">All three date cards use this shape. Scratch the preview to check the reveal.</span>
                      </label>
                    )}
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
                          checked={sectionStyles[previewSection]?.showBox ?? !draft.decorAssets?.sectionImages?.[previewSection]}
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
                  </div>
                )}
                {mobileTool === "theme" && <div className="grid gap-5 p-3">{themeSettings}</div>}
                {mobileTool === "templates" && <div className="p-3">{artworkPanel}</div>}
                {mobileTool === "video" && <div className="grid gap-3 p-3">{revealPanel}{draft.revealMode === "VIDEO" && draft.revealVideoUrl && <ThemeAssetReview kind="video" url={draft.revealVideoUrl} poster={draft.decorAssets?.revealVideoPosterUrl || draft.previewImage} label="Selected opening video" />}</div>}
                {mobileTool === "music" && <div className="p-3">{musicPanel}</div>}
              </div>);

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
            ? "fixed inset-0 top-0 left-0 h-svh w-screen max-w-none translate-x-0 translate-y-0 flex flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#fbf9fd] p-0 shadow-none data-[state=open]:zoom-in-100 sm:max-w-none"
            : "flex h-[92svh] max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]"
        }
      >
        {standalone && <DialogHeader className="sr-only"><DialogTitle>Theme studio</DialogTitle><DialogDescription>Edit theme content, artwork, opening video and music in the desktop admin studio.</DialogDescription></DialogHeader>}
        {standalone && type !== "WEBSITE" ? (
          <div className="z-50 flex h-11 shrink-0 items-center justify-between gap-3 border-b border-violet-200/70 bg-white/95 px-3 backdrop-blur-xl sm:px-6">
            <Link prefetch={false} href={returnHref} className="inline-flex size-10 items-center justify-center rounded-full border border-violet-200 bg-white text-[#5b4268]">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate font-display text-base font-semibold text-[#4b3659]">
                {draft.name || "New Theme"}
              </p>
              <p className="sr-only">Theme Editor</p>
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
        ) : !standalone ? (
          <DialogHeader>
            <DialogTitle>
              {theme ? `Edit ${theme.name}` : type === "PDF" ? "New PDF theme" : "New theme"}
            </DialogTitle>
          </DialogHeader>
        ) : null}

        <div className={type === "WEBSITE" ? "flex min-h-0 flex-1 flex-col overflow-hidden" : standalone ? "mx-auto w-full max-w-7xl px-3 py-4 sm:px-6" : ""}>

        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          if (errors.name || errors.eventCategories) chooseTool("theme");
          else if (errors.revealVideoUrl) chooseTool("video");
          else if (errors.decorAssets?.musicUrl) chooseTool("music");
          toast.error(errors.name?.message ?? errors.revealVideoUrl?.message ?? "Check the highlighted theme settings before saving.");
        })} id={formId} className={type === "WEBSITE" ? "flex min-h-0 flex-1 flex-col" : "grid min-w-0 gap-6"}>
          {type === "WEBSITE" && <ThemeStudioShell
            canEditText={canEditSectionText}
            tool={mobileTool}
            onToolChange={chooseTool}
            sections={sectionNavigation}
            canvas={sectionCanvas}
            panel={toolPanel}
            onAddText={() => { addCustomText(); setMobileTool("content"); }}
            status="Draft preview · save theme to apply changes"
            actions={<><ThemeDraftPreview draft={draft} /><Button type="submit" disabled={loading || Boolean(assetUploading)}>{loading ? "Saving…" : theme ? "Save changes" : "Create theme"}</Button></>}
          />}

          {Boolean(type === "PDF") && <div className="hidden">
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
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Reveal Video Gallery</Label>
                        <Link prefetch={false} href="/admin/library/video-reveals" className="text-xs font-semibold text-violet-700">
                          Manage gallery
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {revealVideoLibrary.map((item) => (
                          <button
                            key={item.url}
                            type="button"
                            aria-pressed={draft.revealVideoUrl === item.url}
                            onClick={() => form.setValue("revealVideoUrl", item.url)}
                            className={
                              form.watch("revealVideoUrl") === item.url
                                ? "overflow-hidden rounded-xl border-2 border-violet-600 bg-violet-50 text-left"
                                : "overflow-hidden rounded-xl border border-violet-200 bg-white text-left"
                            }
                          >
                            {item.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                            ) : (
                              <video src={item.url} className="aspect-video w-full bg-black object-cover" muted playsInline preload="metadata" />
                            )}
                            <span className="block truncate px-2 py-2 text-[10px] font-semibold text-[#5f476c]">{item.label}</span>
                          </button>
                        ))}
                      </div>
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
                    const chosen = [...databaseContent, ...COMMUNITY_CONTENT_PRESETS].find(
                      (item) => item.id === e.target.value,
                    );
                    if (chosen) {
                      form.setValue("content.invitationLetter", chosen.text);
                      if (chosen.role === "blessing") {
                        form.setValue("content.eyebrow", chosen.text);
                      }
                    }
                    e.currentTarget.value = "";
                  }}
                >
                  <option value="">Choose content from collection…</option>
                  {[...databaseContent, ...COMMUNITY_CONTENT_PRESETS]
                    .filter((preset) => {
                      const community = form.watch("decorAssets.contentCommunity") ?? "General";
                      return preset.community === community || preset.community === "General";
                    })
                    .map((preset) => (
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
                {SECTION_TYPES.filter((item) => item !== "TIMELINE" && !sectionOrder.includes(item)).map((item) => (
                  <button key={item} type="button" onClick={() => toggleSection(item)} className="text-muted-foreground rounded-full border px-2.5 py-1 text-xs">
                    + {displaySectionName(item)}
                  </button>
                ))}
                  </div>

                  <div className="grid gap-2">
                {sectionOrder.map((sectionType, index) => {
                  const typedSection = sectionType as string;
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
                          {displaySectionName(sectionType)}
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

                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl} alt="" className="h-14 w-10 rounded border object-cover" />
                          )}
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs">
                            <ImageIcon className="size-3.5" />
                            {assetUploading === "image" ? "Uploading…" : imageUrl ? "Upload new / replace" : "Upload new image"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={assetUploading === "image"}
                              onChange={(e) => handleSectionImage(typedSection, e.target.files?.[0])}
                            />
                          </label>
                          {imageLibrary.length > 0 && (
                            <span className="text-[10px] font-semibold text-violet-700">or choose from Template Library below</span>
                          )}
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

                        {imageLibrary.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {imageLibrary.slice(0, 12).map((asset) => (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
                                  form.setValue("decorAssets.sectionImages", { ...current, [typedSection]: asset.url });
                                }}
                                className={
                                  imageUrl === asset.url
                                    ? "overflow-hidden rounded-lg border-2 border-violet-600 bg-violet-50"
                                    : "overflow-hidden rounded-lg border border-violet-200 bg-white"
                                }
                                aria-pressed={draft.decorAssets?.sectionImages?.[previewSection] === asset.url}
                                title={asset.name}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={asset.thumbnailUrl || asset.url} alt={asset.name} className="aspect-[3/4] w-full object-cover" />
                              </button>
                            ))}
                          </div>
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
                            checked={sectionStyles[typedSection]?.showBox ?? !draft.decorAssets?.sectionImages?.[typedSection]}
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
                    eventCategory={(form.watch("eventCategories")?.[0] ?? form.watch("eventCategory")) as ThemeFormValues["eventCategory"]}
                    palette={form.watch("colorPalette")}
                    fonts={form.watch("fontPairing")}
                    content={form.watch("content")}
                    revealMode={form.watch("revealMode")}
                    revealVideoUrl={form.watch("revealVideoUrl")}
                  revealVideoWebmUrl={draft.decorAssets?.revealVideoWebmUrl}
                  revealVideoPosterUrl={draft.decorAssets?.revealVideoPosterUrl || draft.previewImage}
                  selectedElement={selectedElement}
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

          </div>}

          {Boolean(type === "PDF") && <DialogFooter className="sticky bottom-0 z-30 -mx-1 border-t border-violet-200/70 bg-[#fffaff]/95 px-1 pt-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
            {type === "WEBSITE" && <ThemeDraftPreview draft={draft} />}
            <Button type="submit" disabled={loading || Boolean(assetUploading)}>
              {loading ? "Saving…" : theme ? "Save changes" : type === "PDF" ? "Create PDF theme" : "Create theme"}
            </Button>
          </DialogFooter>}
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
