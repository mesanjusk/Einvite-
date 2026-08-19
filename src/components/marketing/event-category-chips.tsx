"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  Baby,
  Cake,
  Gem,
  Heart,
  House,
  PartyPopper,
  HeartHandshake,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const CATEGORIES: {
  label: string;
  icon: LucideIcon;
  href?: string;
  live: boolean;
}[] = [
  { label: "Wedding", icon: Heart, href: "/create", live: true },
  { label: "Ring Ceremony", icon: HeartHandshake, live: false },
  { label: "Engagement", icon: Gem, live: false },
  { label: "Birthday", icon: Cake, live: false },
  { label: "Naming", icon: Sparkles, live: false },
  { label: "Anniversary", icon: PartyPopper, live: false },
  { label: "Housewarming", icon: House, live: false },
  { label: "Baby Shower", icon: Baby, live: false },
];

const circle =
  "flex size-16 items-center justify-center rounded-full border transition-transform sm:size-18";

export function EventCategoryChips() {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:flex sm:flex-wrap sm:justify-center sm:gap-6">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const content = (
          <>
            <span
              className={
                category.live
                  ? `${circle} border-primary bg-primary text-primary-foreground group-hover:scale-105`
                  : `${circle} bg-card text-muted-foreground group-hover:border-primary group-hover:text-foreground group-hover:scale-105`
              }
            >
              <Icon className="size-6" strokeWidth={1.5} />
            </span>
            <span className="text-center text-xs font-medium">{category.label}</span>
          </>
        );

        return category.live && category.href ? (
          <Link
            key={category.label}
            href={category.href}
            className="group focus-visible:ring-primary flex flex-col items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {content}
          </Link>
        ) : (
          <button
            key={category.label}
            type="button"
            onClick={() =>
              toast(`${category.label} invitations are coming soon`, {
                description: "Wedding invitations are live today — more event types are on the way.",
              })
            }
            className="group focus-visible:ring-primary flex flex-col items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
