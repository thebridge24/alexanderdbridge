import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Bridge Daily Community Feedback";
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
              gap: "8px",
              backgroundColor: "rgba(20, 20, 20, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "10px 20px",
              borderRadius: "9999px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
              }}
            />
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
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Has the devotional helped you in your personal walk with God?
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "#888888",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            Real testimonies, verified streaks, and community impact from believers worldwide.
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
          <span>bridgedaily.com/feedback</span>
          <span style={{ color: "#ef4444", fontWeight: "bold" }}>#StayWokeInTheWord</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}