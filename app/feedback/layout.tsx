import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Feedback & Testimonies | Bridge Daily",
  description:
    "Has the devotional helped you in your personal walk with God? Read community feedback, verified streaks, and testimonies.",
  openGraph: {
    title: "Community Feedback | Bridge Daily Devotional",
    description:
      "Has the devotional helped you in your personal walk with God? Read community feedback and active streaks.",
    url: "https://alexanderdbridge.com/feedback",
    siteName: "Bridge Daily",
    images: [
      {
        url: "/feedback/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bridge Daily Community Feedback Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Feedback | Bridge Daily Devotional",
    description:
      "See how Bridge Daily is helping believers grow daily in God's word.",
    images: ["/feedback/opengraph-image"],
  },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
