import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Happy 18th Birthday, Praiz ❤️",
  description: "A special message written for Praiz Imonin. Tap to read.",
  openGraph: {
    title: "Happy 18th Birthday, Praiz ❤️",
    description: "A 10-step personal letter and story waiting for you.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Happy 18th Birthday, Praiz ❤️",
    description: "A special message written for Praiz Imonin. Tap to read.",
  },
};

export default function PraizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
