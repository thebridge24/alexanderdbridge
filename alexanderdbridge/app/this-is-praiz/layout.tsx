import type { Metadata } from "next";

const ogImageUrl =
  "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790981838/1790981699788_efb9qb.jpg";

export const metadata: Metadata = {
  title: "Happy 18th Birthday, Praiz ❤️",
  description: " Praiz Imonin. Tap to read.",
  openGraph: {
    title: "Happy 18th Birthday, Praiz ❤️",
    description: "A letter and story waiting for you. Praiz Imonin. Tap to read",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Happy 18th Birthday Praiz Imonin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Happy 18th Birthday, Praiz ❤️",
    description: "A special message written for Praiz Imonin. Tap to read.",
    images: [ogImageUrl],
  },
};

export default function PraizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
