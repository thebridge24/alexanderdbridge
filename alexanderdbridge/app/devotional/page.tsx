import type { Metadata } from "next";
import DevotionalView from "./DevotionalView";
import { DEVOTIONALS_DATA } from "../devotionalData";

export async function generateMetadata(): Promise<Metadata> {
  const today = new Date();

  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const devotional =
    DEVOTIONALS_DATA.find((d) => d.dateString === todayString) ??
    DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1];

  return {
    title: `${devotional.topic} | Daily Devotional`,
    description: devotional.explanation.slice(0, 160),

    openGraph: {
      title: devotional.topic,
      description: devotional.explanation.slice(0, 160),
      images: [
        {
          url: "/devotional/opengraph-image",
          width: 1200,
          height: 630,
          alt: devotional.topic,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: devotional.topic,
      description: devotional.explanation.slice(0, 160),
      images: ["/devotional/opengraph-image"],
    },
  };
}

export default function Page() {
  return <DevotionalView />;
}