"use client";

import { useBuilderStore } from "@/lib/stores/builder-store";
import { InviteExperience } from "@/components/invite/invite-experience";
import type { InviteData } from "@/components/invite/types";

export function PreviewPane({
  invite,
  themeStyle,
}: {
  invite: InviteData;
  themeStyle: React.CSSProperties;
}) {
  const sections = useBuilderStore((state) => state.sections);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <p className="text-xs font-bold text-[#4b3659]">Mobile invitation preview</p>
        <p className="text-muted-foreground mt-0.5 text-[10px]">
          Guests use the invitation on mobile, so this preview stays at the real phone width.
        </p>
      </div>

      <div className="bg-muted flex justify-center overflow-auto rounded-xl p-3 sm:p-6">
        <div className="h-[720px] w-[390px] max-w-full overflow-y-auto rounded-[28px] border-[5px] border-violet-950 bg-white shadow-lg">
          <div
            className="relative mx-auto overflow-x-hidden"
            style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
          >
            <InviteExperience invite={invite} sectionConfig={sections} />
          </div>
        </div>
      </div>
    </div>
  );
}
