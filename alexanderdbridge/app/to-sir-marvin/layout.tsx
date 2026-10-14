import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hey Mr. Marvin",
  description: "A personal message written for you. Please click to read.",
  openGraph: {
    title: "Hey Mr. Marvin",
    description: "A personal message written for you. Please click to read.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hey Mr. Marvin",
    description: "A personal message written for you. Please click to read.",
  },
};

export default function SorryMarvinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
