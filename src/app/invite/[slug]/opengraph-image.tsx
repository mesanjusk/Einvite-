import { ImageResponse } from "next/og";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Wedding Invitation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = await db.invitation.findUnique({
    where: { slug },
    include: { theme: true },
  });

  const palette = (invitation?.colorPalette ?? invitation?.theme?.colorPalette) as
    | { primary: string; accent: string; background: string; foreground: string }
    | undefined;
  const primary = palette?.primary ?? "#7a2e2e";
  const accent = palette?.accent ?? "#c9942a";
  const background = palette?.background ?? "#faf3ea";
  const foreground = palette?.foreground ?? "#3a1414";

  const brideName = invitation?.brideName ?? "Bride";
  const groomName = invitation?.groomName ?? "Groom";
  const dateDisplay = invitation
    ? invitation.weddingDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(120% 100% at 50% 0%, ${background} 0%, ${background} 100%)`,
          border: `18px solid ${accent}`,
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 8,
            color: accent,
            marginBottom: 24,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          We&apos;re Getting Married
        </div>
        <div
          style={{
            fontSize: 96,
            color: primary,
            fontWeight: 700,
            display: "flex",
            gap: 24,
          }}
        >
          <span>{brideName}</span>
          <span style={{ color: accent }}>&amp;</span>
          <span>{groomName}</span>
        </div>
        <div style={{ fontSize: 30, color: foreground, marginTop: 28, display: "flex" }}>
          {dateDisplay}
        </div>
      </div>
    ),
    { ...size },
  );
}
