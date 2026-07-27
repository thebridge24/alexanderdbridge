import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alexanderdbridge.com"), // Replace with your domain

  title: {
    default: "Alexander D Bridge | Founder, Software Engineer & Writer",
    template: "%s | Alexander D Bridge",
  },
  manifest: "/manifest.json",
  description:
    "Alexander D Bridge is the Founder & CEO of Stackgate International, software engineer, product builder, and creator of StackMenu. He builds high-performance web applications, mentors aspiring developers, and writes daily Christian devotionals to help people grow in faith and purpose.",

  keywords: [
    "Alexander D Bridge",
    "Stackgate International",
    "StackMenu",
    "Frontend Engineer",
    "Software Engineer",
    "Web Developer",
    "React Developer",
    "Next.js",
    "UI Designer",
    "SaaS Founder",
    "Christian Writer",
    "Daily Devotional",
    "Bridge Tribe",
    "Nigeria Developer",
    "Product Builder",
    "Tech Entrepreneur",
  ],

  authors: [
    {
      name: "Alexander D Bridge",
      url: "https://alexanderdbridge.com",
    },
  ],

  creator: "Alexander D Bridge",
  publisher: "Stackgate International",

  alternates: {
    canonical: "https://alexanderdbridge.com",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://alexanderdbridge.com",
    siteName: "Alexander D Bridge",
    title: "Alexander D Bridge | Founder, Software Engineer & Writer",
    description:
      "Founder of Stackgate International. Builder of software that solves real business problems, mentor to aspiring developers, and writer of daily Christian devotionals.",

    images: [
      {
        url: "/open_graph.png",
        width: 1200,
        height: 630,
        alt: "Alexander D Bridge",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Alexander D Bridge",
    description:
      "Founder of Stackgate International. Building software, mentoring developers, and writing daily devotionals.",

    images: ["/alexander_logo.png"],
    creator: "@yalexdbridge", // Replace if you have X/Twitter
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "Technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark selection:bg-neutral-800 selection:text-white"
    >
      <body
        className={`${bricolage.className} bg-black text-white antialiased min-h-screen tracking-tight`}
      >
        {children}
      </body>
    </html>
  );
}
