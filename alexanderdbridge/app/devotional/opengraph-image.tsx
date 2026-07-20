import { ImageResponse } from "next/og";
import { DEVOTIONALS_DATA } from "../devotionalData";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "edge";

// Changed to a perfect square so the card crops perfectly on WhatsApp/social platforms
export const size = {
  width: 700,
  height: 700,
};

export const contentType = "image/jpeg";

function getCalendarDays(today: Date) {
  const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const days = [];

  // Reduced window to 5 days to fit cleanly in a 700px width grid
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
        padding: "0 40px",
        position: "relative",
      }}
    >
      {/* 1. Kicker Date Label */}
      <span
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#ef4444",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        {devotional.displayDate}
      </span>

      {/* 2. Primary Devotional Header Title */}
      <h1
        style={{
          fontSize: "38px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          margin: "0 0 24px 0",
          textAlign: "center",
          width: "100%",
          lineHeight: 1.2,
          color: "#ffffff",
        }}
      >
        {devotional.topic}
      </h1>

      {/* 3. Centered Grid Horizontal Calendar Layer */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          width: "100%",
          marginBottom: "32px",
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
                width: "80px",
                height: "85px",
                borderRadius: "16px",
                border: isSelected ? "1px solid #ef4444" : "1px solid #262626",
                background: isSelected ? "#ef4444" : "rgba(23, 23, 23, 0.7)",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: isSelected ? "#ffffff" : "#737373",
                  textAlign: "center",
                  width: "100%",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                {day.weekday}
              </span>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 900, // Maximized boldness weight profile
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
          gap: "10px",
          marginBottom: "16px",
          width: "100%",
        }}
      >
        <span style={{ height: "1px", width: "20px", backgroundColor: "#262626" }} />
        <p
          style={{
            fontSize: "15px",
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
        <span style={{ height: "1px", width: "20px", backgroundColor: "#262626" }} />
      </div>

      {/* 5. Center-aligned Core Snippet Text Block */}
      <p
        style={{
          fontSize: "18px",
          fontWeight: 400,
          color: "#a3a3a3",
          margin: "0 0 36px 0",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: "540px",
          maxHeight: "80px",
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
          fontSize: "15px",
          fontWeight: 700,
          padding: "14px 32px",
          borderRadius: "50px",
          letterSpacing: "0.02em",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
        }}
      >
        Read Full Devotional
      </div>

      {/* 7. Footer Brand Subtext Anchor */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#404040",
          letterSpacing: "0.25em",
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
