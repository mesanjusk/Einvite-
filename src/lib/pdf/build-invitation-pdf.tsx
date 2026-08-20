import { Document, Page, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import * as React from "react";

import { PDF_PAGE_SIZES, type PdfPlaceholder, type PdfTemplatePage } from "@/lib/validations/pdf-template";
import { toPdfSafeImageUrl } from "./images";

export type PdfInvitationData = {
  brideName: string;
  groomName: string;
  /** Both names joined the way this event category prints them. */
  coupleNames: string;
  weddingDateDisplay: string;
  venueName?: string | null;
  venueAddress?: string | null;
  customMessage?: string | null;
  pdfExtraText?: string | null;
};

function resolveFieldText(field: PdfPlaceholder["field"], placeholder: PdfPlaceholder, data: PdfInvitationData): string {
  switch (field) {
    case "brideName":
      return data.brideName;
    case "groomName":
      return data.groomName;
    case "coupleNames":
      return data.coupleNames;
    case "weddingDate":
      return data.weddingDateDisplay;
    case "venueName":
      return data.venueName ?? "";
    case "venueAddress":
      return data.venueAddress ?? "";
    case "customMessage":
      return data.customMessage ?? "";
    case "pdfExtraText":
      return data.pdfExtraText ?? "";
    case "STATIC":
    default:
      return placeholder.staticText ?? "";
  }
}

const styles = StyleSheet.create({
  page: { position: "relative" },
  background: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  placeholder: { position: "absolute" },
});

function PlaceholderText({
  placeholder,
  data,
  pageWidth,
  pageHeight,
}: {
  placeholder: PdfPlaceholder;
  data: PdfInvitationData;
  pageWidth: number;
  pageHeight: number;
}) {
  const text = resolveFieldText(placeholder.field, placeholder, data);
  if (!text) return null;

  return (
    <Text
      style={[
        styles.placeholder,
        {
          left: (placeholder.x / 100) * pageWidth,
          top: (placeholder.y / 100) * pageHeight,
          width: (placeholder.width / 100) * pageWidth,
          fontSize: placeholder.fontSize,
          color: placeholder.color,
          textAlign: placeholder.align,
          fontWeight: placeholder.bold ? "bold" : "normal",
        },
      ]}
    >
      {text}
    </Text>
  );
}

function InvitationPdfDocument({ pages, data }: { pages: PdfTemplatePage[]; data: PdfInvitationData }) {
  return (
    <Document>
      {pages.map((page) => {
        const { width, height } = PDF_PAGE_SIZES[page.size];
        return (
          <Page key={page.id} size={[width, height]} style={[styles.page, { backgroundColor: page.backgroundColor }]}>
            {page.backgroundImageUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF primitive, not an HTML <img>
              <Image style={styles.background} src={toPdfSafeImageUrl(page.backgroundImageUrl)} />
            )}
            {page.placeholders.map((placeholder) => (
              <PlaceholderText
                key={placeholder.id}
                placeholder={placeholder}
                data={data}
                pageWidth={width}
                pageHeight={height}
              />
            ))}
          </Page>
        );
      })}
    </Document>
  );
}

export async function buildInvitationPdf(
  pages: PdfTemplatePage[],
  data: PdfInvitationData,
): Promise<Buffer> {
  return renderToBuffer(<InvitationPdfDocument pages={pages} data={data} />);
}
