import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Download, Palette, ShieldCheck } from "lucide-react";
import FreeQrTool from "@/components/FreeQrTool";

export const metadata: Metadata = {
  title: "Free QR Code Generator — Custom PNG, JPG & SVG",
  description:
    "Create a free custom QR code online. Change colors, patterns, finder eyes, gradients and logos, then download your QR code as PNG, JPG or SVG.",
  alternates: { canonical: "/free-qr-code-generator" },
  openGraph: {
    title: "Free QR Code Generator — Custom PNG, JPG & SVG | LinkCraft",
    description:
      "Create custom QR codes for free with colors, patterns, logos, transparent PNG and SVG export.",
    url: "/free-qr-code-generator",
  },
};

const benefits = [
  [Palette, "Custom QR design", "Choose module shapes, finder-eye styles, colors, gradients and branded presets."],
  [Download, "PNG, JPG & SVG", "Export in multiple formats and resolutions, including transparent PNG and SVG."],
  [ShieldCheck, "Free to use", "Generate and customize QR codes without creating an account."],
] as const;

export default function FreeQrCodeGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#11110f]">
      <header className="border-b border-[#deded8] bg-[#f7f7f4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-3 font-black tracking-[-0.04em]">
            <Image src="/linkcraft-mark.svg" alt="LinkCraft" width={36} height={36} priority />
            <span className="text-lg">Link<span className="text-[#FF5C35]">Craft</span></span>
          </Link>
          <Link href="/" className="secondary-action"><ArrowLeft size={15} /> All link tools</Link>
        </div>
      </header>

      <section className="border-b border-[#deded8] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="max-w-4xl">
            <div className="section-kicker">Free QR Code Generator</div>
            <h1 className="mt-3 text-4xl font-black leading-[0.96] tracking-[-0.06em] sm:text-5xl md:text-6xl">
              Create a custom QR code <span className="text-[#FF5C35]">for free.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#5f5f59] md:text-lg">
              Turn any website or link into a branded QR code. Customize the pattern, colors, finder eyes, gradient, center logo, background and export size, then download as PNG, JPG or SVG.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {benefits.map(([Icon, title, copy]) => (
              <div key={title} className="feature-card rounded-2xl border border-[#deded8] bg-[#fafaf8] p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0eb] text-[#FF5C35]"><Icon size={18} /></div>
                <h2 className="mt-4 text-sm font-black">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-[#777772]">{copy}</p>
              </div>
            ))}
          </div>

          <FreeQrTool />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="section-kicker">How it works</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Make a QR code in seconds.</h2>
            <div className="mt-6 grid gap-3">
              {["Paste your website or link.", "Customize the QR pattern, eyes, colors and logo.", "Choose PNG, JPG or SVG and download your QR code."].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#deded8] bg-white p-4 text-sm font-semibold"><Check size={17} className="mt-0.5 shrink-0 text-[#FF5C35]" />{item}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="section-kicker">FAQ</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Free QR generator questions.</h2>
            <div className="mt-6 grid gap-3 text-sm leading-6 text-[#5f5f59]">
              <div className="rounded-2xl border border-[#deded8] bg-white p-5"><h3 className="font-black text-[#11110f]">Can I download a transparent QR code?</h3><p className="mt-2">Yes. Use transparent background and export as PNG or SVG. JPG does not support transparency, so JPG uses your selected solid background.</p></div>
              <div className="rounded-2xl border border-[#deded8] bg-white p-5"><h3 className="font-black text-[#11110f]">Can I add a logo to the QR code?</h3><p className="mt-2">Yes. Upload a PNG, JPG, WebP or SVG logo and adjust its size in the center of the QR code.</p></div>
              <div className="rounded-2xl border border-[#deded8] bg-white p-5"><h3 className="font-black text-[#11110f]">Is the QR code generator free?</h3><p className="mt-2">Yes. LinkCraft lets you create and customize QR codes without an account.</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
