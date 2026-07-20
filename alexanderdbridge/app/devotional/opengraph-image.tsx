import { ImageResponse } from "next/og";
import { DEVOTIONALS_DATA } from "../devotionalData";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "edge";

// Scaled up to a crisp 1200x1200px perfect square layout
export const size = {
  width: 1200,
  height: 1200,
};

export const contentType = "image/jpeg";

function getCalendarDays(today: Date) {
  const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const days = [];

  // Keeps 5 days centered with plenty of relative width padding
  for (let i = -2; i <= 2; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weekday = WEEKDAYS[d.getDay()];
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

  let devotional =
    DEVOTIONALS_DATA.find((d) => d.dateString === todayString) ??
    DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1];

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("devotionals")
      .select("*")
      .eq("date_string", todayString)
      .maybeSingle();

    if (data && !error) {
      devotional = {
        dayNumber: data.day_number,
        dateString: data.date_string,
        displayDate: data.display_date,
        topic: data.topic,
        text: data.text,
        memoryVerse: typeof data.memory_verse === "string"
          ? JSON.parse(data.memory_verse)
          : data.memory_verse,
        explanation: data.explanation,
        neededSteps: data.needed_steps,
        prayerPoints: data.prayer_points,
      };
    }
  } catch (err) {
    console.error("Error loading dynamic devotional for OG image:", err);
  }

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
        fontFamily: "sans-serif",
        padding: "0 80px",
        position: "relative",
      }}
    >
      {/* 1. Kicker Date Label */}
      <span
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#ef4444",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "24px",
        }}
      >
        {devotional.displayDate}
      </span>

      {/* 2. Primary Devotional Header Title */}
      <h1
        style={{
          fontSize: "64px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          margin: "0 0 54px 0",
          textAlign: "center",
          width: "100%",
          lineHeight: 1.25,
          color: "#ffffff",
          maxWidth: "1000px",
        }}
      >
        {devotional.topic}
      </h1>

      {/* 3. Centered Grid Horizontal Calendar Layer */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          width: "100%",
          marginBottom: "64px",
          justifyContent: "center",
          alignItems: "center",
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
                justifyContent: "center",
                width: "140px",
                height: "150px",
                borderRadius: "28px",
                border: isSelected ? "2px solid #ef4444" : "2px solid #262626",
                background: isSelected ? "#ef4444" : "rgba(23, 23, 23, 0.7)",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: isSelected ? "#ffffff" : "#737373",
                  textAlign: "center",
                  width: "100%",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                {day.weekday}
              </span>
              <span
                style={{
                  fontSize: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: "#ffffff",
                  textAlign: "center",
                  width: "100%",
                }}
              >
                {day.dayNum}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Focus Scripture Reference Node */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          marginBottom: "28px",
          width: "100%",
        }}
      >
        <span style={{ height: "2px", width: "40px", backgroundColor: "#262626" }} />
        <p
          style={{
            fontSize: "26px",
            fontWeight: 800,
            color: "#a3a3a3",
            margin: 0,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {devotional.memoryVerse.reference}
        </p>
        <span style={{ height: "2px", width: "40px", backgroundColor: "#262626" }} />
      </div>

      {/* 5. Center-aligned Core Snippet Text Block */}
      <p
        style={{
          fontSize: "30px",
          fontWeight: 400,
          color: "#a3a3a3",
          margin: "0 0 64px 0",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: "900px",
          maxHeight: "140px",
          overflow: "hidden",
        }}
      >
        {devotional.explanation.length > 140
          ? `${devotional.explanation.slice(0, 140)}...`
          : devotional.explanation}
      </p>

      {/* 6. Dynamic Conversion CTA Interactive Button Layout */}
      <div
        style={{
          display: "flex",
          background: "#ef4444",
          color: "#ffffff",
          fontSize: "24px",
          fontWeight: 700,
          padding: "22px 54px",
          borderRadius: "100px",
          letterSpacing: "0.02em",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 15px 35px -5px rgba(239, 68, 68, 0.4)",
        }}
      >
        Read Full Devotional
      </div>

      {/* 7. Footer Brand Subtext Anchor */}
      <div
        style={{
          position: "absolute",
          bottom: "48px",
          fontSize: "18px",
          fontWeight: 700,
          color: "#404040",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          width: "100%",
          textAlign: "center",
        }}
      >
        POWERED BY BRIDGE TRIBE NETWORK
      </div>
    </div>,
    {
      ...size,
    },
  );
}
