import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeSight AI",
  description: "Construction safety inspection dashboard powered by video AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
