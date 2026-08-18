"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Icon-only button with the label carried by a tooltip and aria-label rather
 * than visible text. `label` is required so an icon never ships without an
 * accessible name.
 */
export function IconButton({
  label,
  children,
  side = "top",
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
