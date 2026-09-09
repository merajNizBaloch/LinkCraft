import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LinkCraft — Free QR Code Generator & Link Tools",
    short_name: "LinkCraft",
    description:
      "Free QR code generator, URL shortener, URL cleaner, UTM builder, WhatsApp link generator and other link tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F7F4",
    theme_color: "#FF5C35",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
