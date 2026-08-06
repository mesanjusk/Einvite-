"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Lock, Unlock, Copy, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/lib/stores/builder-store";
import type { SectionConfigEntry } from "@/lib/get-invite-data";

const SECTION_LABELS: Record<string, string> = {
  ENVELOPE: "Envelope",
  HERO: "Invitation",
  COUNTDOWN: "Countdown",
  STORY: "Our Story",
  TIMELINE: "Event Timeline",
  GALLERY: "Photo Gallery",
  VENUE: "Venue",
  RSVP: "RSVP",
  REGISTRY: "Gift Registry",
  INSTAGRAM: "Instagram Feed",
  THANK_YOU: "Thank You",
};

export function SectionRow({ section }: { section: SectionConfigEntry }) {
  const { toggleVisible, toggleLock, duplicate, remove } = useBuilderStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: section.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card flex items-center gap-3 rounded-lg border p-3",
        isDragging && "opacity-50",
        !section.visible && "opacity-60",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        disabled={section.locked}
        className={cn(
          "text-muted-foreground cursor-grab touch-none disabled:cursor-not-allowed disabled:opacity-30",
        )}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      <span className="flex-1 text-sm font-medium">
        {SECTION_LABELS[section.type] ?? section.type}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => toggleVisible(section.id)}
        disabled={section.locked}
        aria-label={section.visible ? "Hide section" : "Show section"}
      >
        {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => toggleLock(section.id)}
        aria-label={section.locked ? "Unlock section" : "Lock section"}
      >
        {section.locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => duplicate(section.id)}
        aria-label="Duplicate section"
      >
        <Copy className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => remove(section.id)}
        disabled={section.locked}
        aria-label="Delete section"
      >
        <Trash2 className="text-destructive size-4" />
      </Button>
    </div>
  );
}
