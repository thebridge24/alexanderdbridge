import { ImageResponse } from "next/og";
import { DEVOTIONALS_DATA } from "../devotionalData";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function getCalendarDays(today: Date) {
  const days = [];
  for (let i = -3; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weekday = d
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const dayNum = String(d.getDate());

    days.push({ dateString, weekday, dayNum });
  }
  return days;
}

export default async function Image() {
  const today = new Date();

  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const devotional =
    DEVOTIONALS_DATA.find((d) => d.dateString === todayString) ??
    DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1];

  // Fetch Bricolage Grotesque font dynamically for Satori engine
  const fontData = await fetch(
    new URL(
      "https://fonts.gstatic.com/s/bricolagegrotesque/v3/w517RtOWia0d6sqSUuKEAx15WlcyfA.woff",
    ),
  ).then((res) => res.arrayBuffer());

  const calendarDays = getCalendarDays(today);

  return new ImageResponse(
    <div
      style={{
        background: "#000000",
        color: "#ffffff",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Bricolage",
        padding: "0 80px",
        position: "relative",
      }}
    >
      {/* Top Header Row with Title & Dynamic Date String */}
      <div
        style={{
          display: "flex",
          justifyContent: "between",
          alignItems: "center",
          width: "100%",
          marginBottom: "40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Daily Devotional
          </h1>
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: "#ef4444",
              borderRadius: "50%",
              marginLeft: "6px",
              marginBottom: "12px",
              alignSelf: "flex-end",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#737373",
            letterSpacing: "-0.01em",
          }}
        >
          {devotional.displayDate}
        </span>
      </div>

      {/* Dynamic Devotional Topic Banner */}
      {/* Dynamic Devotional Topic Banner */}
      <div style={{ display: "flex", width: "100%", marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "52px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: 0,
            color: "#f5f5f5",
            lineHeight: 1.2,
          }}
        >
          {devotional.topic}
        </h2>
      </div>

      {/* Horizontal Calendar Layer */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          width: "100%",
          marginBottom: "50px",
          justifyContent: "center",
        }}
      >
        {calendarDays.map((day) => {
          const isSelected = day.dateString === todayString;
          return (
            <div
              key={day.dateString}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "110px",
                borderRadius: "20px",
                border: isSelected ? "1px solid #ffffff" : "1px solid #1f1f1f",
                background: isSelected
                  ? "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)"
                  : "rgba(23, 23, 23, 0.6)",
                boxShadow: isSelected
                  ? "0 0 30px rgba(239, 68, 68, 0.3)"
                  : "none",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  paddingTop: "12px",
                  paddingBottom: "4px",
                  color: isSelected ? "#ffffff" : "#737373",
                }}
              >
                {day.weekday}
              </span>
              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                  background: isSelected ? "transparent" : "rgba(0, 0, 0, 0.3)",
                  fontSize: "24px",
                  fontWeight: 700,
                  paddingBottom: "12px",
                  paddingTop: "4px",
                  color: isSelected ? "#ffffff" : "#a3a3a3",
                }}
              >
                {day.dayNum}
              </div>
            </div>
          );
        })}
      </div>

      {/* Focus Scripture Reference Node */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <span
          style={{ height: "1px", width: "24px", backgroundColor: "#404040" }}
        />
        <p
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#a3a3a3",
            margin: 0,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          {devotional.memoryVerse.reference}
        </p>
        <span
          style={{ height: "1px", width: "24px", backgroundColor: "#404040" }}
        />
      </div>

      {/* Bottom Subtitle Core Message */}
      <p
        style={{
          fontSize: "36px",
          fontWeight: 400,
          color: "#ffffff",
          margin: "0 0 60px 0",
          letterSpacing: "-0.02em",
        }}
      >
        Start your day with God&apos;s Word.
      </p>

      {/* Footer Brand Node */}
      <div
        style={{
          position: "absolute",
          bottom: "36px",
          fontSize: "14px",
          fontWeight: 700,
          color: "#404040",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        POWERED BY BRIDGE TRIBE NETWORK
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Bricolage",
          data: fontData,
          style: "normal",
        },
      ],
    },
  );
}
