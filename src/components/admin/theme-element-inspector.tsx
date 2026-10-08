"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ContentPreset } from "@/lib/theme-content-library";

export type ThemeElementStyleValue = {
  text?: string;
  hidden?: boolean;
  width?: number;
  fontSize?: number;
  fontRole?: "display" | "body" | "script";
  align?: "left" | "center" | "right";
  color?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      letterSpacing?: number;
      lineHeight?: number;
      opacity?: number;

  x?: number;
  y?: number;
  showBackground?: boolean;
};

export function ThemeElementInspector({
  selectedKey,
  label,
  text,
  canEditText,
  isCustom,
  style,
  presets,
  onTextChange,
  onStyleChange,
  onChoosePreset,
  onRemove,
  onAddText,
}: {
  selectedKey: string | null;
  label?: string;
  text: string;
  canEditText: boolean;
  isCustom: boolean;
  style: ThemeElementStyleValue;
  presets: ContentPreset[];
  onTextChange: (value: string) => void;
  onStyleChange: (patch: Partial<ThemeElementStyleValue>) => void;
  onChoosePreset: (preset: ContentPreset) => void;
  onRemove: () => void;
  onAddText: () => void;
}) {
  if (!selectedKey) {
    return (
      <div className="grid gap-3 rounded-2xl border border-violet-200/70 bg-violet-50/55 p-4">
        <div>
          <p className="text-sm font-semibold text-violet-950">Select real content</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Click any highlighted text in the phone preview. The controls will edit that exact invitation element.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddText}>
          <Plus className="size-3.5" />
          Add new text to this section
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-violet-200/80 bg-violet-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-950">{label ?? selectedKey}</p>
          <p className="text-muted-foreground mt-0.5 text-[10px]">{selectedKey}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddText}>
          <Plus className="size-3.5" />
          Add text
        </Button>
      </div>

      {canEditText ? (
        <div className="grid gap-2">
          <Label className="text-xs">Text content</Label>
          <Textarea rows={3} value={text} onChange={(e) => onTextChange(e.target.value)} />
          <select
            className="border-input h-9 min-w-0 rounded-md border bg-background px-2 text-xs"
            defaultValue=""
            onChange={(e) => {
              const preset = presets.find((item) => item.id === e.target.value);
              if (preset) onChoosePreset(preset);
              e.currentTarget.value = "";
            }}
          >
            <option value="">Replace with content from collection…</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.community} · {preset.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-background/70 p-3 text-xs text-muted-foreground">
          This is dynamic invitation data (for example names, date or venue). The theme controls its appearance, while the customer supplies the actual value.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label className="text-[10px]">Font size</Label>
          <Input
            type="number"
            min={8}
            max={120}
            value={style.fontSize ?? ""}
            placeholder="Theme default"
            onChange={(e) =>
              onStyleChange({
                fontSize: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">Font role</Label>
          <select
            className="border-input h-10 rounded-md border bg-background px-2 text-xs"
            value={style.fontRole ?? ""}
            onChange={(e) =>
              onStyleChange({
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
        <div className="grid gap-1">
          <Label className="text-[10px]">Alignment</Label>
          <select
            className="border-input h-10 rounded-md border bg-background px-2 text-xs"
            value={style.align ?? ""}
            onChange={(e) =>
              onStyleChange({
                align: (e.target.value || undefined) as ThemeElementStyleValue["align"],
              })
            }
          >
            <option value="">Theme default</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">Text color</Label>
          <input
            type="color"
            value={style.color || "#4b3659"}
            onChange={(e) => onStyleChange({ color: e.target.value })}
            className="h-10 w-full rounded-md border bg-background"
          />
        </div>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1 text-[10px]">Content width: {style.width ?? (isCustom ? 88 : 100)}%<input type="range" min="20" max="100" value={style.width ?? (isCustom ? 88 : 100)} onChange={(event) => onStyleChange({ width: Number(event.target.value) })} /></label>
        <div className="grid gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <Label className="text-[10px]">Horizontal position</Label>
            <span>{style.x ?? 0}</span>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            value={style.x ?? 0}
            onChange={(e) => onStyleChange({ x: Number(e.target.value) })}
          />
        </div>
        <div className="grid gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <Label className="text-[10px]">Vertical position</Label>
            <span>{style.y ?? 0}</span>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            value={style.y ?? 0}
            onChange={(e) => onStyleChange({ y: Number(e.target.value) })}
          />
        </div>
      </div>

      <label className="flex items-center justify-between rounded-xl border bg-background p-3">
        <span>
          <span className="block text-xs font-semibold">Background behind selected text</span>
          <span className="text-muted-foreground block text-[10px]">
            Turn this off for text directly over the artwork.
          </span>
        </span>
        <Switch
          checked={style.showBackground ?? false}
          onCheckedChange={(value) => onStyleChange({ showBackground: value })}
        />
      </label>

      {!isCustom && (
        <label className="flex items-center justify-between rounded-xl border bg-background p-3">
          <span className="text-xs font-semibold">Hide this content</span>
          <Switch
            checked={style.hidden ?? false}
            onCheckedChange={(value) => onStyleChange({ hidden: value })}
          />
        </label>
      )}

      {isCustom && (
        <Button type="button" variant="ghost" className="justify-start text-destructive" onClick={onRemove}>
          <Trash2 className="size-4" />
          Remove this added text
        </Button>
      )}
    </div>
  );
}
