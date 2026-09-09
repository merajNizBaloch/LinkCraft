import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkCraft — Free Link Tools",
  description:
    "Shorten, clean, inspect, encode and share links. Generate QR codes, UTM URLs and WhatsApp links for free.",
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
