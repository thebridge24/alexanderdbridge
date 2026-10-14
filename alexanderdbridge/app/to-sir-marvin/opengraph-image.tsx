import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "A Personal Letter for Mr. Marvin";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
          padding: "60px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Subtle Top Crimson Accent Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundColor: "#dc2626",
          }}
        />

        {/* Small Red Badge */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "4px",
            color: "#dc2626",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          A Letter For You
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: "68px",
            fontWeight: 600,
            color: "#111111",
            margin: "0 0 24px 0",
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
          }}
        >
          Hey Mr. Marvin
        </h1>

        {/* Simple Invitation Subtext */}
        <p
          style={{
            fontSize: "28px",
            fontWeight: 400,
            color: "#666666",
            margin: "0 0 44px 0",
          }}
        >
          Please click to read this message.
        </p>

        {/* Minimal Button Visual */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "1.5px solid #111111",
            borderRadius: "50px",
            padding: "16px 36px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#111111",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          <span>Click to open letter</span>
          <span style={{ color: "#dc2626" }}>→</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
