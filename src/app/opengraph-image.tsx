import { ImageResponse } from "next/og";

export const alt = "Personalized digital invitations by SK Digital";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "68px 82px",
        color: "#493451",
        background:
          "radial-gradient(circle at 82% 28%, #eadcf1 0, #eadcf1 20%, transparent 43%), linear-gradient(120deg, #fffaf7 0%, #f8f2fb 58%, #f0e7f5 100%)",
        fontFamily: "Georgia, serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#795a86",
            fontSize: 23,
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 42, height: 2, background: "#c5a66a" }} />
          SK Digital
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 38,
            fontSize: 66,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Your celebration,
          <br />
          invited beautifully.
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 26,
            color: "#806b8c",
            fontFamily: "Arial, sans-serif",
            fontSize: 25,
            lineHeight: 1.4,
          }}
        >
          Personalize a digital invitation
          <br />
          and share it with one link.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 42,
            color: "#76508c",
            fontFamily: "Arial, sans-serif",
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          WEDDINGS · BIRTHDAYS · CELEBRATIONS
        </div>
      </div>
      <div
        style={{
          width: 280,
          height: 455,
          borderRadius: 150,
          border: "8px solid #fff",
          background: "linear-gradient(150deg, #d4b86f 0%, #f8efe0 40%, #8e6e9e 100%)",
          boxShadow: "0 24px 70px rgba(83,56,94,.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 132,
            border: "1px solid rgba(255,255,255,.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fffaf7",
            textAlign: "center",
            textShadow: "0 2px 12px rgba(48,30,45,.45)",
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase" }}>
            You’re invited
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 20,
              fontSize: 43,
              lineHeight: 1.1,
            }}
          >
            A day to
            <br />
            remember
          </div>
          <div style={{ marginTop: 22, width: 78, height: 1, background: "#fffaf7" }} />
          <div
            style={{
              marginTop: 18,
              fontFamily: "Arial, sans-serif",
              fontSize: 16,
              letterSpacing: 2,
            }}
          >
            MADE FOR YOU
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
