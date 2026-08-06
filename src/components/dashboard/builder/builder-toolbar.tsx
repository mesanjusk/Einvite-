"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Redo2, Save } from "lucide-react";
import { toast } from "sonner";

import { useBuilderStore } from "@/lib/stores/builder-store";
import { updateSectionConfigAction } from "@/lib/actions/builder";
import { Button } from "@/components/ui/button";

export function BuilderToolbar({ invitationId }: { invitationId: string }) {
  const { sections, history, future, undo, redo, markSaved } = useBuilderStore();
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // isDirty() reads live store state outside of React's subscription, so
  // useSyncExternalStore keeps this button's enabled state correct as the
  // store mutates without over-subscribing the whole toolbar to `sections`.
  const isDirty = useSyncExternalStore(
    useBuilderStore.subscribe,
    () => useBuilderStore.getState().isDirty(),
    () => false,
  );

  async function handleSave() {
    setSaving(true);
    const result = await updateSectionConfigAction({ invitationId, sections });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    markSaved();
    toast.success("Layout saved.");
    router.refresh();
  }

  return (
    <div className="bg-background sticky top-14 z-10 flex items-center justify-between gap-2 border-b py-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={history.length === 0}
          onClick={undo}
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={future.length === 0}
          onClick={redo}
          aria-label="Redo"
        >
          <Redo2 className="size-4" />
        </Button>
      </div>

      <Button onClick={handleSave} disabled={saving || !isDirty}>
        <Save />
        {saving ? "Saving…" : isDirty ? "Save layout" : "Saved"}
      </Button>
    </div>
  );
}
