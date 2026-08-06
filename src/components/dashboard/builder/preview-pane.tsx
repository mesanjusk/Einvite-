"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/lib/stores/builder-store";
import { InviteExperience } from "@/components/invite/invite-experience";
import type { InviteData } from "@/components/invite/types";
import { Button } from "@/components/ui/button";

const DEVICES = {
  mobile: { width: 390, label: "Mobile", icon: Smartphone },
  tablet: { width: 768, label: "Tablet", icon: Tablet },
  desktop: { width: 1180, label: "Desktop", icon: Monitor },
} as const;

type DeviceKey = keyof typeof DEVICES;

export function PreviewPane({
  invite,
  themeStyle,
}: {
  invite: InviteData;
  themeStyle: React.CSSProperties;
}) {
  const [device, setDevice] = useState<DeviceKey>("mobile");
  const sections = useBuilderStore((state) => state.sections);

  const frameWidth = DEVICES[device].width;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-1">
        {(Object.entries(DEVICES) as [DeviceKey, (typeof DEVICES)[DeviceKey]][]).map(
          ([key, config]) => (
            <Button
              key={key}
              variant={device === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setDevice(key)}
            >
              <config.icon className="size-4" />
              {config.label}
            </Button>
          ),
        )}
      </div>

      <div className="bg-muted flex justify-center overflow-auto rounded-xl p-6">
        <div
          className={cn(
            "h-[720px] overflow-y-auto rounded-lg border shadow-lg transition-[width] duration-300",
          )}
          style={{ width: frameWidth, maxWidth: "100%" }}
        >
          <div
            className="relative mx-auto overflow-x-hidden"
            style={{ ...themeStyle, fontFamily: "var(--inv-font-body)" }}
          >
            <InviteExperience invite={invite} sectionConfig={sections} skipEnvelope />
          </div>
        </div>
      </div>
    </div>
  );
}
