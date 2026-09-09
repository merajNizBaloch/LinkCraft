import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = (
  process.env.LINKCRAFT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://linkcraft.techcraftsolution.com")
).replace(/\/$/, "");

const description =
  "Free QR code generator, QR scanner and link tools by LinkCraft. Create custom QR codes, scan QR codes with camera or image upload, shorten URLs, clean tracking links, build UTM links, create WhatsApp links and inspect URLs.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Free QR Code Generator & Link Tools | LinkCraft",
    template: "%s | LinkCraft",
  },
  description,
  applicationName: "LinkCraft",
  authors: [{ name: "TechCraft", url: "https://techcraftsolution.com" }],
  creator: "TechCraft",
  publisher: "TechCraft",
  category: "Utilities",
  keywords: [
    "free QR code generator",
    "QR code generator",
    "custom QR code",
    "QR code maker",
    "free QR scanner",
    "QR code scanner online",
    "scan QR code from image",
    "QR scanner camera",
    "free link tools",
    "URL shortener",
    "link shortener",
    "URL cleaner",
    "UTM builder",
    "WhatsApp link generator",
    "URL encoder decoder",
    "link inspector",
  ],
  alternates: {
    canonical: "/",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "LinkCraft",
    title: "Free QR Code Generator & Link Tools | LinkCraft",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LinkCraft free QR code generator and link tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator & Link Tools | LinkCraft",
    description,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF5C35",
  colorScheme: "light",
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LinkCraft",
    url: siteUrl,
    description,
    publisher: {
      "@type": "Organization",
      name: "TechCraft",
      url: "https://techcraftsolution.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LinkCraft",
    url: siteUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Free custom QR code generator",
      "Free QR code scanner with camera",
      "Scan QR codes from uploaded images",
      "URL shortener",
      "URL tracking cleaner",
      "UTM campaign builder",
      "WhatsApp link generator",
      "URL encoder and decoder",
      "URL inspector",
    ],
    publisher: {
      "@type": "Organization",
      name: "TechCraft",
      url: "https://techcraftsolution.com",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
