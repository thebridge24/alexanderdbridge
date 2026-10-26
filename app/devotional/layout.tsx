import GlobalAppWrapper from "@/app/components/layout/GlobalAppWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html >
      <body className="bg-black text-white antialiased">
        <GlobalAppWrapper>{children}</GlobalAppWrapper>
      </body>
    </html>
  );
}