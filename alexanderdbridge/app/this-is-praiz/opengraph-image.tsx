import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "A Special Birthday Message for Praiz Imonin";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const imageUrl =
    "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790981838/1790981699788_efb9qb.jpg";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#faf7f5",
          padding: "60px 80px",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Soft Background Accent Radial Gradient */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(136, 14, 79, 0.08)",
            filter: "blur(80px)",
          }}
        />

        {/* Left Side: Editorial Typography & Invite */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "580px",
            zIndex: 10,
          }}
        >
          {/* Header Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#880e4f",
                letterSpacing: "4px",
                textTransform: "uppercase",
                fontFamily: "sans-serif",
              }}
            >
              Happy 18th Birthday
            </span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 400,
              color: "#2c2226",
              lineHeight: 1.15,
              margin: "0 0 24px 0",
            }}
          >
            Praiz Imonin, there is a letter waiting for you.
          </h1>

          {/* Invitation Subtext */}
          <p
            style={{
              fontSize: "22px",
              color: "#5c4d54",
              fontWeight: 300,
              lineHeight: 1.5,
              margin: "0 0 36px 0",
              fontFamily: "sans-serif",
            }}
          >
            A 10-step story built just for you. Tap anywhere to open.
          </p>

          {/* Interactive Call To Action Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "#880e4f",
              color: "#ffffff",
              padding: "16px 32px",
              borderRadius: "50px",
              fontSize: "18px",
              fontWeight: 600,
              fontFamily: "sans-serif",
              width: "fit-content",
              boxShadow: "0 10px 25px -5px rgba(136, 14, 79, 0.3)",
            }}
          >
            <span>Tap to open your message ✉️</span>
          </div>
        </div>

        {/* Right Side: Framed Portrait Photo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "360px",
              height: "460px",
              borderRadius: "24px",
              overflow: "hidden",
              border: "6px solid #ffffff",
              boxShadow: "0 20px 40px rgba(44, 34, 38, 0.12)",
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Praiz Imonin"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
