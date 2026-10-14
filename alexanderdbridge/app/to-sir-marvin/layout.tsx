import type { Metadata } from "next";

export const metadata: Metadata = {
  // Replace with your actual deployed domain so WhatsApp knows where to find the image
  metadataBase: new URL("https://alexanderdbridge.vercel.app"), 
  title: "Hey Mr. Marvin",
  description: "A personal message written for you. Please click to read.",
  openGraph: {
    title: "Hey Mr. Marvin",
    description: "A personal message written for you. Please click to read.",
    type: "website",
    images: [
      {
        url: "/to-sir-marvin/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Hey Mr. Marvin — Please click to read",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hey Mr. Marvin",
    description: "A personal message written for you. Please click to read.",
    images: ["/to-sir-marvin/opengraph-image"],
  },
};

export default function SorryMarvinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
