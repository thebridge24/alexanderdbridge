import type { Metadata } from "next";
import DevotionalView from "./DevotionalView";
import { DEVOTIONALS_DATA } from "@/app/devotionalData";

type Props = {
  params: Promise<{ dateString: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dateString } = await params;

  // Fallback to today's date if the dynamic string doesn't match an exact record
  const devotional =
    DEVOTIONALS_DATA.find((d) => d.dateString === dateString) ??
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