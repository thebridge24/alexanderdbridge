import { ImageResponse } from "next/og";
import { DEVOTIONALS_DATA } from "../../devotionalData";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/jpeg";

function getCalendarDays(today: Date) {
  const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const days = [];
  
  for (let i = -3; i <= 4; i++) {
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

  // Default to today's static devotional
  let devotional =
    DEVOTIONALS_DATA.find((d) => d.dateString === todayString) ??
    DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1];

  // Try to load devotional dynamically from the database
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
      }}
    >
      
      {/* Top Header Row with Title & Dynamic Date String */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
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
              backgroundColor: "#ff0000",
              borderRadius: "50%",
              marginLeft: "6px",
              marginTop: "24px",
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
      <div style={{ display: "flex", width: "100%", marginBottom: "40px" }}>
        <h2
          style={{
            fontSize: "52px",
            fontWeight: 900,
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
          marginBottom: "40px",
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
                background: isSelected ? "#ff0000" : "rgba(23, 23, 23, 0.6)",
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

      {/* Bottom Subtitle Core Message (Reflects first 120 chars of dynamic explanation) */}
      <p
        style={{
          fontSize: "24px",
          fontWeight: 400,
          color: "#d4d4d4",
          margin: "0 0 50px 0",
          letterSpacing: "-0.01em",
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: "800px",
          height: "68px",
          overflow: "hidden",
        }}
      >
        {devotional.explanation.length > 120
          ? `${devotional.explanation.slice(0, 120)}...`
          : devotional.explanation}
      </p>

      {/* Footer Brand Node */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
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
    },
  );
}