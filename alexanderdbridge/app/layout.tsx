import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

// Configure Bricolage Grotesque with native CSS variables
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Alexander D Bridge | Profile",
  description: "Founder & Developer at Stackgate International. Designing premium minimalist web architectures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark selection:bg-neutral-800 selection:text-white">
      <body 
        className={`${bricolage.className} bg-black text-white antialiased min-h-screen tracking-tight`}
      >
        {children}
      </body>
    </html>
  );
}