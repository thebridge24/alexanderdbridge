/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Bridge Daily Community Feedback";
export const size = {
  width: 1200,
  height: 800,
};
export const contentType = "image/png";

export default async function Image() {
  // Helper to safely load local public assets into a Base64 string for Satori
  async function getBase64Image(relativePath: string) {
    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://alexanderdbridge.com";
    try {
      const res = await fetch(`${baseUrl}${relativePath}`);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = relativePath.endsWith(".png")
        ? "image/png"
        : "image/jpeg";
      return `data:${mimeType};base64,${base64}`;
    } catch (err) {
      console.error("Failed to load image for OG:", err);
      return null;
    }
  }

  const logoSrc = await getBase64Image("/alexander_logo.png");

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#000000",
        color: "#ffffff",
        padding: "60px 80px",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Red Glow Background */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          backgroundColor: "rgba(220, 38, 38, 0.12)",
          borderRadius: "50%",
          filter: "blur(120px)",
        }}
      />

      {/* Center-Top Small Branded Logo / Pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Safe base64 image rendering with pure inline CSS */}
          {logoSrc && (
            <img
              src={logoSrc}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "20px",
              }}
              alt="Logo"
            />
          )}
          <span
            style={{
              fontSize: "13px",
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "#a3a3a3",
            }}
          >
            BRIDGE DAILY DEVOTIONAL
          </span>
        </div>
      </div>

      {/* Big Bold Headline Text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "20px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "120px",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "#ffffff",
          }}
        >
          Feedbacks
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#888888",
            lineHeight: 1.4,
            maxWidth: "800px",
          }}
        >
          Read Your Daily Devotional Today
        </p>
      </div>

      {/* Bottom Metadata Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "24px",
          width: "100%",
          fontSize: "15px",
          color: "#666666",
          fontFamily: "monospace",
        }}
      >
        <span>https://alexanderdbridge.com/feedback</span>
        <span style={{ color: "#ef4444", fontWeight: "bold" }}>
          #StayConsistent
        </span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
