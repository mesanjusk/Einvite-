"use client";

import { useEffect } from "react";

import { useBuilderStore } from "@/lib/stores/builder-store";
import type { SectionConfigEntry } from "@/lib/get-invite-data";
import type { InviteData } from "@/components/invite/types";
import { BuilderToolbar } from "./builder-toolbar";
import { SectionList } from "./section-list";
import { PreviewPane } from "./preview-pane";

export function BuilderClient({
  invitationId,
  initialSections,
  invite,
  themeStyle,
}: {
  invitationId: string;
  initialSections: SectionConfigEntry[];
  invite: InviteData;
  themeStyle: React.CSSProperties;
}) {
  const init = useBuilderStore((state) => state.init);

  useEffect(() => {
    init(initialSections);
    // Only re-sync when the selected invitation actually changes — not on
    // every store mutation, which would stomp the user's in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <div className="flex flex-col gap-2">
        <BuilderToolbar invitationId={invitationId} />
        <SectionList />
      </div>
      <PreviewPane invite={invite} themeStyle={themeStyle} />
    </div>
  );
}
