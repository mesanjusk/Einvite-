"use client";

import { createContext, useContext } from "react";

/**
 * The channel between the invitation's own sections and the live editor
 * wrapped around them.
 *
 * The sections are the same components the public invitation renders — they
 * ask for this context, get `null` on a real invite, and render exactly what
 * they always did. Inside the editor they get an implementation, and the
 * same headings and photos become the thing you tap to change them. That's
 * the whole point: there is no separate form view of the invitation to keep
 * in sync with the invitation.
 */

/** An invitation field that is edited by tapping the text that shows it. */
export type EditTarget =
  | {
      kind: "invitation";
      field:
        | "brideName"
        | "groomName"
        | "venueName"
        | "venueAddress"
        | "customMessage"
        | "googleMapsUrl";
    }
  | { kind: "copy"; field: "heroHeadline" | "invitationLetter" | "storyHeadline" }
  // A relative, addressed by their place on the invitation ("the bride's
  // father") — clearing the name takes them off it.
  | { kind: "family"; side: "BRIDE" | "GROOM"; relation: string }
  | {
      kind: "event";
      eventId: string;
      field:
        | "name"
        | "time"
        | "venueName"
        | "address"
        | "dressCode"
        | "tagline"
        | "googleMapsUrl";
    };

/** A date field. Dates go through the OS picker, never through free text. */
export type EditDateTarget =
  { kind: "invitation" } | { kind: "event"; eventId: string };

export type EditPanel = "design" | "music" | "photos";

export type InviteEditApi = {
  /** Edit affordances are drawn only while this is true (the preview toggle turns it off). */
  active: boolean;
  setText: (target: EditTarget, value: string) => void;
  /** `value` is `yyyy-mm-dd`, as produced by an `<input type="date">`. */
  setDate: (target: EditDateTarget, value: string) => void;
  addEvent: () => void;
  removeEvent: (eventId: string) => void;
  /** Opens one of the editor's sheets — optionally scrolled to a photo. */
  openPanel: (panel: EditPanel, focusMediaId?: string) => void;
  /** Number of writes still in flight, so the toolbar can say "Saving…". */
  pending: number;
};

const InviteEditContext = createContext<InviteEditApi | null>(null);

export const InviteEditProvider = InviteEditContext.Provider;

/** Null on the public invitation — every section must handle that. */
export function useInviteEdit(): InviteEditApi | null {
  return useContext(InviteEditContext);
}
