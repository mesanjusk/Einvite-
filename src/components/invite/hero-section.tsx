"use client";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import { ShimmerText } from "@/components/animation/shimmer-text";
import { fadeUp } from "@/lib/animation-variants";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Translations } from "@/lib/i18n/dictionary";
import { celebrantNames, eventCategoryFor, fillContent } from "@/lib/event-categories";
import { useInviteEdit } from "./edit-context";
import { EditableText } from "./editable";
import type { InviteData, InviteFamilyMember } from "./types";

function CornerBracket({ style }: { style: React.CSSProperties }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ position: "absolute", ...style }}>
      <path d="M1 27 V5 Q1 1 5 1 H27" fill="none" stroke="var(--inv-accent)" strokeWidth="1.5" />
    </svg>
  );
}

function parentsLine(members: InviteFamilyMember[], side: "BRIDE" | "GROOM", t: Translations) {
  const parents = members.filter(
    (m) => m.side === side && /father|mother/i.test(m.relation),
  );
  if (parents.length === 0) return null;
  const prefix = parents[0].relation.startsWith("F") ? t.sonOf : t.daughterOf;
  return `${prefix} ${parents.map((p) => p.name).join(" & ")}`;
}

function parentName(
  members: InviteFamilyMember[],
  side: "BRIDE" | "GROOM",
  relation: string,
) {
  return (
    members.find(
      (member) =>
        member.side === side &&
        member.relation.trim().toLowerCase() === relation.toLowerCase(),
    )?.name ?? ""
  );
}

/**
 * The "daughter of …" line, as two tappable slots per side. Guests only ever
 * see the names that were filled in; here both slots are always present, so
 * a couple who skipped their parents in the wizard can add them by tapping
 * the line where they will print.
 */
function ParentsEditor({
  members,
  side,
  prefix,
  labels,
}: {
  members: InviteFamilyMember[];
  side: "BRIDE" | "GROOM";
  prefix: string;
  labels: string;
}) {
  return (
    <p>
      <span className="text-[11px] tracking-[0.2em] uppercase opacity-70">{labels}</span>
      <br />
      {prefix}{" "}
      <EditableText
        target={{ kind: "family", side, relation: "Father" }}
        value={parentName(members, side, "Father")}
        placeholder="Father's name"
      />{" "}
      &amp;{" "}
      <EditableText
        target={{ kind: "family", side, relation: "Mother" }}
        value={parentName(members, side, "Mother")}
        placeholder="Mother's name"
      />
    </p>
  );
}

export function HeroSection({
  invite,
  guestName,
}: {
  invite: InviteData;
  guestName?: string | null;
}) {
  const { t } = useLocale();
  const edit = useInviteEdit();
  const category = eventCategoryFor(invite.eventCategory);
  const secondName = invite.groomName.trim();
  // The translated default is written for a wedding; anything else falls back
  // to its own category's letter rather than inviting people to a wedding
  // that isn't happening.
  const heroSubline =
    invite.copy?.invitationLetter ??
    (category.slug === "wedding"
      ? t.invitationLetterDefault
      : fillContent(category.content.invitationLetter, {
          names: celebrantNames(category, invite.brideName, secondName),
          date: invite.weddingDate.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          venue: invite.venueName,
        }));
  const brideLine = parentsLine(invite.familyMembers, "BRIDE", t);
  const groomLine = parentsLine(invite.familyMembers, "GROOM", t);
  // An empty second name is simply absent from a guest's invitation; in the
  // editor it has to be there to be tapped, or there is no way to fill it in.
  const showSecondName = Boolean(secondName) || Boolean(edit?.active);

  return (
    <section
      className="relative flex min-h-svh items-center justify-center overflow-hidden px-5 py-8"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, var(--inv-secondary) 0%, var(--inv-background) 55%)",
      }}
    >
      <PetalField count={10} seed={7} />

      <RevealGroup className="relative z-[2] w-full max-w-md">
        <div
          className="relative rounded-[20px] border px-6 py-10 text-center"
          style={{
            background: "color-mix(in srgb, var(--inv-background) 92%, white 8%)",
            borderColor: "color-mix(in srgb, var(--inv-accent) 35%, transparent)",
            boxShadow: "0 20px 45px rgba(0,0,0,0.12)",
          }}
        >
          <CornerBracket style={{ top: -12, left: -12 }} />
          <CornerBracket style={{ top: -12, right: -12, transform: "scaleX(-1)" }} />
          <CornerBracket style={{ bottom: -12, left: -12, transform: "scaleY(-1)" }} />
          <CornerBracket style={{ bottom: -12, right: -12, transform: "scale(-1,-1)" }} />

          <Reveal variants={fadeUp}>
            <div
              className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border text-xl"
              style={{
                borderColor: "var(--inv-accent)",
                fontFamily: "var(--inv-font-script)",
                color: "var(--inv-accent)",
              }}
            >
              {invite.brideName[0]}
              {secondName[0]}
            </div>
          </Reveal>

          {guestName && (
            <Reveal variants={fadeUp}>
              <p
                className="mb-3 text-xs tracking-[0.25em] uppercase"
                style={{ color: "var(--inv-accent)" }}
              >
                {t.dearGuestPrefix} {guestName}
              </p>
            </Reveal>
          )}

          <Reveal variants={fadeUp}>
            <p
              className="mb-5 text-[15px] leading-relaxed"
              style={{ fontFamily: "var(--inv-font-body)", fontStyle: "italic", color: "var(--inv-foreground)", opacity: 0.75 }}
            >
              <EditableText
                target={{ kind: "copy", field: "invitationLetter" }}
                value={invite.copy?.invitationLetter ?? heroSubline}
                placeholder="Write your invitation line"
                multiline
              >
                {heroSubline}
              </EditableText>
            </p>
          </Reveal>

          <Reveal variants={fadeUp}>
            <h1 className="text-[42px] leading-tight" style={{ fontFamily: "var(--inv-font-display)" }}>
              <EditableText
                target={{ kind: "invitation", field: "brideName" }}
                value={invite.brideName}
                placeholder={category.primaryNameLabel}
              >
                <ShimmerText>{invite.brideName}</ShimmerText>
              </EditableText>
            </h1>
          </Reveal>

          {showSecondName && (
            <>
              <Reveal variants={fadeUp}>
                <div className="my-2.5 flex items-center justify-center gap-3.5">
                  <span className="h-px w-9" style={{ background: "color-mix(in srgb, var(--inv-accent) 50%, transparent)" }} />
                  <span style={{ fontFamily: "var(--inv-font-script)", color: "var(--inv-accent)" }} className="text-2xl">
                    {category.joiner}
                  </span>
                  <span className="h-px w-9" style={{ background: "color-mix(in srgb, var(--inv-accent) 50%, transparent)" }} />
                </div>
              </Reveal>

              <Reveal variants={fadeUp}>
                <h1 className="mb-5 text-[42px] leading-tight" style={{ fontFamily: "var(--inv-font-display)" }}>
                  <EditableText
                    target={{ kind: "invitation", field: "groomName" }}
                    value={secondName}
                    placeholder={category.secondaryNameLabel}
                  >
                    <ShimmerText>{secondName}</ShimmerText>
                  </EditableText>
                </h1>
              </Reveal>
            </>
          )}

          {edit?.active ? (
            <Reveal variants={fadeUp}>
              <div
                className="flex flex-col gap-1.5 text-sm opacity-75"
                style={{ fontFamily: "var(--inv-font-body)" }}
              >
                <ParentsEditor
                  members={invite.familyMembers}
                  side="BRIDE"
                  prefix={t.daughterOf}
                  labels={category.familyLabels.bride}
                />
                <ParentsEditor
                  members={invite.familyMembers}
                  side="GROOM"
                  prefix={t.sonOf}
                  labels={category.familyLabels.groom}
                />
              </div>
            </Reveal>
          ) : (
            (brideLine || groomLine) && (
              <Reveal variants={fadeUp}>
                <p className="text-sm opacity-75" style={{ fontFamily: "var(--inv-font-body)" }}>
                  {brideLine}
                  {brideLine && groomLine && <br />}
                  {groomLine}
                </p>
              </Reveal>
            )
          )}
        </div>
      </RevealGroup>
    </section>
  );
}
