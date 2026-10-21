import type { Metadata } from "next";
import DevotionalView from "./DevotionalView";
import { DEVOTIONALS_DATA } from "@/app/data/devotionalData";

type Props = {
  params: Promise<{ dateString: string }>;
};

// Define an interface for your Devotional object
interface Devotional {
  dateString: string;
  topic: string;
  explanation: string;
}

async function getDevotionalData(dateString: string): Promise<Devotional | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_SITE_URL
        : "https://alexanderdbridge.com";
    const res = await fetch(`${baseUrl}/api/devotionals`, {
      next: { revalidate: 3600 }, 
    });

    if (!res.ok) return null;

    const data = await res.json();
    const devotionals: Devotional[] = data.devotionals || [];

    return (
      devotionals.find((d) => d.dateString === dateString) ??
      devotionals[devotionals.length - 1] ??
      null
    );
  } catch (error) {
    console.error("Error fetching metadata devotional:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dateString } = await params;

  const fetchedDevotional = await getDevotionalData(dateString);
  const devotional =
    fetchedDevotional ??
    DEVOTIONALS_DATA.find((d) => d.dateString === dateString) ??
    DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1];

  const title = devotional ? `${devotional.topic} | Daily Devotional` : "Daily Devotional";
  const description = devotional ? devotional.explanation.slice(0, 160) : "Read today's daily devotional.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: "/devotional/opengraph-image",
          width: 1200,
          height: 630,
          alt: devotional?.topic || "Daily Devotional",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/devotional/opengraph-image"],
    },
  };
}

export default async function Page({ params }: Props) {
  const { dateString } = await params;

  const fetchedDevotional = await getDevotionalData(dateString);
  const devotional =
    fetchedDevotional ??
    DEVOTIONALS_DATA.find((d) => d.dateString === dateString) ??
    DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1];

  return <DevotionalView devotional={devotional} />;
}