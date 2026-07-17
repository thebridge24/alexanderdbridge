import type { Metadata } from "next";
import "../styles/globals.css"; // Ensure this matches your CSS path

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
      <body className="bg-black text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}