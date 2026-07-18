import { ImageResponse } from "next/og";
import { DEVOTIONALS_DATA } from "../devotionalData";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const devotional = DEVOTIONALS_DATA.find(
    d => d.dateString === params.slug
  );

  if (!devotional) {
    return new ImageResponse(<div>Not Found</div>);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#000",
          color: "#fff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Geist",
        }}
      >
        <h1>{devotional.topic}</h1>

        <p>{devotional.memoryVerse.reference}</p>

        <span>
          Start your day with God&lsquo;s Word.
        </span>
      </div>
    ),
    size
  );
}