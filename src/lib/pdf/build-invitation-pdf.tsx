import { Document, Page, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import * as React from "react";

import { PDF_PAGE_SIZES, type PdfPlaceholder, type PdfTemplatePage } from "@/lib/validations/pdf-template";

export type PdfInvitationData = {
  brideName: string;
  groomName: string;
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
      return `${data.brideName} & ${data.groomName}`;
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

/**
 * Forces a Cloudinary-hosted background to a PDF-safe raster format
 * (Cloudinary's default auto-format can pick AVIF/WebP, which most PDF
 * viewers can't decode) — inserted right after `/upload/` in the URL.
 */
function toPdfSafeImageUrl(url: string): string {
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const insertAt = index + marker.length;
  return `${url.slice(0, insertAt)}f_jpg,q_auto/${url.slice(insertAt)}`;
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
