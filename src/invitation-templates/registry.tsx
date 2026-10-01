"use client";

import type { ComponentType } from "react";

import type { InviteData } from "@/components/invite/types";
import {
  isCustomExperienceKey,
  type CustomExperienceKey,
} from "./experience-key";
import { RoyalStoryExperience } from "./royal-story/royal-story-experience";

export type CustomExperienceProps = {
  invite: InviteData;
  sectionConfig: Array<{
    id: string;
    type: string;
    visible: boolean;
    order: number;
  }>;
  skipEnvelope?: boolean;
  initialGuestName?: string | null;
  guestId?: string | null;
  showRemixCta?: boolean;
  guidedActiveSectionId?: string | null;
};

const REGISTRY: Record<CustomExperienceKey, ComponentType<CustomExperienceProps>> = {
  "royal-story": RoyalStoryExperience,
};

export function isRegisteredCustomExperience(
  key: string | null | undefined,
): key is CustomExperienceKey {
  return isCustomExperienceKey(key) && Boolean(REGISTRY[key]);
}

export function CustomInviteExperience(props: CustomExperienceProps) {
  const key = props.invite.customExperienceKey;
  if (!isRegisteredCustomExperience(key)) return null;
  const Experience = REGISTRY[key];
  return <Experience {...props} />;
}
