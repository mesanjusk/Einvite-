import {
  Baby,
  Cake,
  Gem,
  Heart,
  HeartHandshake,
  House,
  PartyPopper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { EventCategory } from "@/lib/event-categories";

// The category catalogue is plain data (it's imported by server actions and
// the PDF renderer), so it names its icon rather than importing one.
const ICONS: Record<EventCategory["icon"], LucideIcon> = {
  heart: Heart,
  "heart-handshake": HeartHandshake,
  gem: Gem,
  cake: Cake,
  sparkles: Sparkles,
  "party-popper": PartyPopper,
  house: House,
  baby: Baby,
};

export function categoryIcon(icon: EventCategory["icon"]): LucideIcon {
  return ICONS[icon] ?? Heart;
}
