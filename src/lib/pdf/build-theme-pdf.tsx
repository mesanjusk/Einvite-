import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import * as React from "react";

import type { PdfDesign } from "./theme-pdf-design";
import { monogramFor } from "./theme-pdf-design";

/**
 * The printable version of the invitation website: the same details, the
 * same design theme, the same photos — laid out for A4 instead of a phone.
 *
 * This is what runs when no admin has hand-drawn a PDF template for the
 * chosen design, which is the normal case. It needs nothing but the
 * invitation's own data and a palette, so every theme in the catalogue can
 * produce a PDF the moment it's picked.
 *
 * Photos arrive already fetched and inlined as data URIs (see images.ts) —
 * this file never touches the network, so a dead photo URL can't fail a
 * download.
 */

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

export type ThemePdfEvent = {
  name: string;
  dateDisplay: string;
  time?: string | null;
  venueName?: string | null;
  address?: string | null;
  dressCode?: string | null;
  tagline?: string | null;
};

export type ThemePdfFamilyMember = {
  side: "BRIDE" | "GROOM";
  relation: string;
  name: string;
};

export type ThemePdfData = {
  /** "Wedding Invitation", "Birthday Invitation"… */
  eyebrow: string;
  headline: string;
  /** Both name slots joined the way the category prints them. */
  names: string;
  primaryName: string;
  secondaryName: string | null;
  dateDisplay: string;
  /** Weekday line under the date, when the date is known. */
  weekdayDisplay?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  /** The invitation letter — the couple's own words, AI copy, or the theme's. */
  letter: string;
  /** Extra text the couple added for the PDF only. */
  extraText?: string | null;
  thankYou: string;
  /** Labels for the two family columns, e.g. "Bride's family". */
  familyLabels: { bride: string; groom: string };
  events: ThemePdfEvent[];
  family: ThemePdfFamilyMember[];
  /** Data URIs, already fetched. First one is used as the cover. */
  photos: string[];
};

function styleSheetFor(design: PdfDesign) {
  const { palette, fonts } = design;
  return StyleSheet.create({
    page: {
      backgroundColor: palette.background,
      color: palette.foreground,
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 1.5,
    },
    coverBand: { width: "100%", height: 330, position: "relative" },
    coverImage: { width: "100%", height: "100%", objectFit: "cover" },
    coverTint: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 90,
      backgroundColor: palette.background,
      opacity: 0.15,
    },
    body: { paddingHorizontal: 56, paddingVertical: 44 },
    frame: {
      flexGrow: 1,
      margin: 28,
      borderWidth: 1.5,
      borderColor: palette.accent,
      borderStyle: "solid",
      padding: 10,
    },
    frameInner: {
      flexGrow: 1,
      borderWidth: 0.75,
      borderColor: palette.accent,
      borderStyle: "solid",
      paddingHorizontal: 40,
      paddingVertical: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    monogram: {
      width: 62,
      height: 62,
      borderRadius: 31,
      borderWidth: 1,
      borderColor: palette.accent,
      borderStyle: "solid",
      color: palette.accent,
      fontFamily: fonts.display,
      fontSize: 22,
      textAlign: "center",
      paddingTop: 18,
      marginBottom: 22,
    },
    eyebrow: {
      color: palette.accent,
      fontSize: 10,
      letterSpacing: 3,
      textAlign: "center",
      textTransform: "uppercase",
      marginBottom: 14,
    },
    headline: {
      fontFamily: fonts.display,
      fontSize: 16,
      color: palette.foreground,
      textAlign: "center",
      marginBottom: 20,
    },
    name: {
      fontFamily: fonts.display,
      fontSize: 34,
      color: palette.primary,
      textAlign: "center",
      lineHeight: 1.25,
    },
    joiner: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: palette.accent,
      textAlign: "center",
      marginVertical: 6,
    },
    rule: { height: 1, width: 90, backgroundColor: palette.accent, marginVertical: 18 },
    ruleWide: {
      height: 1,
      alignSelf: "stretch",
      backgroundColor: palette.accent,
      opacity: 0.4,
      marginVertical: 20,
    },
    dateLine: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: palette.foreground,
      textAlign: "center",
      letterSpacing: 1,
    },
    subtle: { fontSize: 10.5, textAlign: "center", opacity: 0.75, marginTop: 6 },
    letter: { fontSize: 11.5, textAlign: "center", lineHeight: 1.7, marginTop: 4 },
    sectionTitle: {
      fontFamily: fonts.display,
      fontSize: 15,
      color: palette.primary,
      marginBottom: 12,
    },
    card: {
      backgroundColor: palette.secondary,
      borderLeftWidth: 2,
      borderLeftColor: palette.accent,
      borderLeftStyle: "solid",
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 8,
    },
    eventName: { fontFamily: fonts.display, fontSize: 12.5, color: palette.primary },
    eventMeta: { fontSize: 10, opacity: 0.8, marginTop: 3 },
    eventTagline: { fontSize: 9.5, opacity: 0.7, marginTop: 3 },
    columns: { flexDirection: "row", gap: 24 },
    column: { flexGrow: 1, flexBasis: 0 },
    columnTitle: {
      color: palette.accent,
      fontSize: 9,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    familyLine: { fontSize: 10.5, marginBottom: 2 },
    galleryRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    galleryImage: { flexGrow: 1, flexBasis: 0, height: 150, objectFit: "cover" },
    thankYou: {
      fontFamily: fonts.display,
      fontSize: 13,
      color: palette.primary,
      textAlign: "center",
      marginTop: 26,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 56,
      right: 56,
      fontSize: 8.5,
      textAlign: "center",
      opacity: 0.5,
    },
  });
}

type Styles = ReturnType<typeof styleSheetFor>;

function NameBlock({
  data,
  styles,
  joiner,
}: {
  data: ThemePdfData;
  styles: Styles;
  joiner: string;
}) {
  return (
    <View>
      <Text style={styles.name}>{data.primaryName}</Text>
      {data.secondaryName ? (
        <>
          <Text style={styles.joiner}>{joiner}</Text>
          <Text style={styles.name}>{data.secondaryName}</Text>
        </>
      ) : null}
    </View>
  );
}

function CoverDetails({
  data,
  styles,
  joiner,
}: {
  data: ThemePdfData;
  styles: Styles;
  joiner: string;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.eyebrow}>{data.eyebrow}</Text>
      <Text style={styles.headline}>{data.headline}</Text>
      <NameBlock data={data} styles={styles} joiner={joiner} />
      <View style={styles.rule} />
      <Text style={styles.dateLine}>{data.dateDisplay}</Text>
      {data.weekdayDisplay ? (
        <Text style={styles.subtle}>{data.weekdayDisplay}</Text>
      ) : null}
      {data.venueName ? <Text style={styles.subtle}>{data.venueName}</Text> : null}
      {data.venueAddress ? (
        <Text style={styles.subtle}>{data.venueAddress}</Text>
      ) : null}
    </View>
  );
}

/** Photos laid out two to a row, so a page of six stays readable. */
function GalleryGrid({ photos, styles }: { photos: string[]; styles: Styles }) {
  const rows: string[][] = [];
  for (let i = 0; i < photos.length; i += 2) rows.push(photos.slice(i, i + 2));

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.galleryRow}>
          {row.map((photo, index) => (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF primitive, not an HTML <img>
            <Image key={index} style={styles.galleryImage} src={photo} />
          ))}
          {/* Keeps a lone photo on the last row at half width instead of
              stretching it across the page. */}
          {row.length === 1 && <View style={{ flexGrow: 1, flexBasis: 0 }} />}
        </View>
      ))}
    </View>
  );
}

function ThemePdfDocument({
  design,
  data,
  joiner,
}: {
  design: PdfDesign;
  data: ThemePdfData;
  joiner: string;
}) {
  const styles = styleSheetFor(design);
  const coverPhoto = design.layout === "classic" ? null : (data.photos[0] ?? null);
  // The cover photo is already on page one, so the gallery shows the rest.
  const galleryPhotos = design.layout === "story" ? data.photos.slice(1, 7) : [];
  const brideFamily = data.family.filter((member) => member.side === "BRIDE");
  const groomFamily = data.family.filter((member) => member.side === "GROOM");
  const hasFamily = brideFamily.length > 0 || groomFamily.length > 0;

  return (
    <Document title={`${data.names} — ${data.eyebrow}`}>
      {/* Cover */}
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        {coverPhoto ? (
          <>
            <View style={styles.coverBand}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf primitive */}
              <Image style={styles.coverImage} src={coverPhoto} />
              <View style={styles.coverTint} />
            </View>
            <View style={styles.body}>
              <CoverDetails data={data} styles={styles} joiner={joiner} />
            </View>
          </>
        ) : (
          <View style={styles.frame}>
            <View style={styles.frameInner}>
              <Text style={styles.monogram}>
                {monogramFor(data.primaryName, data.secondaryName)}
              </Text>
              <CoverDetails data={data} styles={styles} joiner={joiner} />
            </View>
          </View>
        )}
      </Page>

      {/* Details: the letter, the schedule, the venue, the family */}
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        <View style={styles.body}>
          <Text style={styles.eyebrow}>{data.eyebrow}</Text>
          <Text style={styles.letter}>{data.letter}</Text>

          {data.events.length > 0 && (
            <>
              <View style={styles.ruleWide} />
              <Text style={styles.sectionTitle}>Schedule</Text>
              {data.events.map((event, index) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>
                    {[event.dateDisplay, event.time, event.venueName, event.address]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </Text>
                  {event.dressCode ? (
                    <Text style={styles.eventMeta}>Dress code: {event.dressCode}</Text>
                  ) : null}
                  {event.tagline ? (
                    <Text style={styles.eventTagline}>{event.tagline}</Text>
                  ) : null}
                </View>
              ))}
            </>
          )}

          {(data.venueName || data.venueAddress) && (
            <>
              <View style={styles.ruleWide} />
              <Text style={styles.sectionTitle}>Venue</Text>
              {data.venueName ? (
                <Text style={{ fontSize: 11.5 }}>{data.venueName}</Text>
              ) : null}
              {data.venueAddress ? (
                <Text style={{ fontSize: 10.5, opacity: 0.8, marginTop: 2 }}>
                  {data.venueAddress}
                </Text>
              ) : null}
            </>
          )}

          {hasFamily && (
            <>
              <View style={styles.ruleWide} />
              <Text style={styles.sectionTitle}>With the blessings of</Text>
              <View style={styles.columns}>
                {[
                  { label: data.familyLabels.bride, members: brideFamily },
                  { label: data.familyLabels.groom, members: groomFamily },
                ]
                  .filter((group) => group.members.length > 0)
                  .map((group) => (
                    <View key={group.label} style={styles.column}>
                      <Text style={styles.columnTitle}>{group.label}</Text>
                      {group.members.map((member, index) => (
                        <Text key={index} style={styles.familyLine}>
                          {member.relation}: {member.name}
                        </Text>
                      ))}
                    </View>
                  ))}
              </View>
            </>
          )}

          {data.extraText ? (
            <>
              <View style={styles.ruleWide} />
              <Text style={{ fontSize: 10.5, lineHeight: 1.7 }}>{data.extraText}</Text>
            </>
          ) : null}

          {galleryPhotos.length === 0 && (
            <Text style={styles.thankYou}>{data.thankYou}</Text>
          )}
        </View>
        <Text style={styles.footer} fixed>
          {data.names} · {data.dateDisplay}
        </Text>
      </Page>

      {/* Gallery */}
      {galleryPhotos.length > 0 && (
        <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
          <View style={styles.body}>
            <Text style={styles.eyebrow}>Our photos</Text>
            <GalleryGrid photos={galleryPhotos} styles={styles} />
            <Text style={styles.thankYou}>{data.thankYou}</Text>
          </View>
          <Text style={styles.footer} fixed>
            {data.names} · {data.dateDisplay}
          </Text>
        </Page>
      )}
    </Document>
  );
}

export async function buildThemePdf(
  design: PdfDesign,
  data: ThemePdfData,
  joiner: string,
): Promise<Buffer> {
  return renderToBuffer(
    <ThemePdfDocument design={design} data={data} joiner={joiner} />,
  );
}
