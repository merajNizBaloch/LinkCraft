import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free URL Shortener — Custom Short Links",
  description:
    "Create free persistent short links with custom aliases, optional expiration, QR codes and click counting using LinkCraft's URL shortener.",
  alternates: { canonical: "/shorten" },
  openGraph: {
    title: "Free URL Shortener — Custom Short Links | LinkCraft",
    description: "Shorten long URLs into shareable links with custom aliases, expiration and click counting.",
    url: "/shorten",
  },
};

export default function ShortenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
