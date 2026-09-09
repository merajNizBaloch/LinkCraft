import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Link2, MessageCircle, QrCode, ScanSearch, Tags, Unlink2, WandSparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Link Tools — QR, URL Shortener, Cleaner & UTM Builder",
  description:
    "Use free online link tools in one place: QR code generator, URL shortener, tracking URL cleaner, UTM builder, WhatsApp link generator, encoder and URL inspector.",
  alternates: { canonical: "/free-link-tools" },
  openGraph: {
    title: "Free Link Tools — QR, URL Shortener, Cleaner & More | LinkCraft",
    description: "Free tools for QR codes, short links, clean URLs, UTM campaigns, WhatsApp links and URL inspection.",
    url: "/free-link-tools",
  },
};

const tools = [
  [QrCode, "Free QR Code Generator", "Create branded QR codes with custom patterns, colors, logos and PNG/JPG/SVG downloads.", "/free-qr-code-generator"],
  [Link2, "URL Shortener", "Create persistent short links with custom aliases, expiration and click counting.", "/shorten"],
  [WandSparkles, "URL Cleaner", "Remove UTM tags and common advertising click identifiers from links.", "/#workspace"],
  [Tags, "UTM Builder", "Build correctly formatted campaign URLs with source, medium, campaign, term and content fields.", "/#workspace"],
  [MessageCircle, "WhatsApp Link Generator", "Create click-to-chat WhatsApp links with a phone number and pre-filled message.", "/#workspace"],
  [Unlink2, "URL Encoder & Decoder", "Encode special URL characters or decode percent-encoded text into readable content.", "/#workspace"],
  [ScanSearch, "URL Inspector", "Inspect protocol, host, path, port, fragment and query parameters inside a URL.", "/#workspace"],
] as const;

export default function FreeLinkToolsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#11110f]">
      <header className="border-b border-[#deded8] bg-[#f7f7f4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-3 font-black tracking-[-0.04em]">
            <Image src="/linkcraft-mark.svg" alt="LinkCraft" width={36} height={36} priority />
            <span className="text-lg">Link<span className="text-[#FF5C35]">Craft</span></span>
          </Link>
          <Link href="/" className="primary-action">Open workspace <ArrowRight size={15} /></Link>
        </div>
      </header>

      <section className="border-b border-[#deded8] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="max-w-4xl">
            <div className="section-kicker">Free Link Tools</div>
            <h1 className="mt-3 text-4xl font-black leading-[0.96] tracking-[-0.06em] sm:text-5xl md:text-6xl">
              Free tools for <span className="text-[#FF5C35]">everyday link work.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#5f5f59] md:text-lg">
              Generate QR codes, shorten URLs, remove tracking parameters, build UTM campaign links, create WhatsApp links, encode URLs and inspect link structure from one free toolkit.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map(([Icon, title, copy, href]) => (
              <Link key={title} href={href} className="feature-card group rounded-[22px] border border-[#deded8] bg-[#fafaf8] p-5">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#11110f] text-white transition group-hover:bg-[#FF5C35]"><Icon size={19} /></div>
                <h2 className="mt-5 text-lg font-black tracking-[-0.03em]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#696965]">{copy}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#FF5C35]">Use this tool <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        <div className="rounded-[30px] bg-[#11110f] p-7 text-white md:p-10">
          <div className="section-kicker">LinkCraft</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] md:text-4xl">One link. Seven useful actions.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">LinkCraft is built by TechCraft as a fast, practical collection of link utilities that work together instead of forcing you across multiple websites.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#11110f] transition hover:bg-[#FF5C35] hover:text-white">Open LinkCraft <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
