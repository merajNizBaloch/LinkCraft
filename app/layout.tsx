import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkCraft — Free QR, URL & Link Tools",
  description:
    "Paste a link once and turn it into a QR code, remove tracking parameters, build UTM campaigns, create WhatsApp links, encode URLs and inspect every part of a URL for free.",
  applicationName: "LinkCraft",
  keywords: [
    "URL tools",
    "QR code generator",
    "URL cleaner",
    "UTM builder",
    "WhatsApp link generator",
    "URL encoder",
    "link inspector",
  ],
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
