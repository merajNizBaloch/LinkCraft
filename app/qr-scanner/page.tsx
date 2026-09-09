import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, ImagePlus, ScanLine, ShieldCheck } from "lucide-react";
import QrScannerTool from "@/components/QrScannerTool";

export const metadata: Metadata = {
  title: "Free QR Code Scanner — Camera & Image Upload",
  description:
    "Scan QR codes for free with your phone camera or upload a QR image or screenshot. LinkCraft decodes QR codes privately in your browser without uploading your images.",
  keywords: [
    "free QR scanner",
    "QR code scanner online",
    "scan QR code from image",
    "QR scanner camera",
    "upload QR code image",
  ],
  alternates: { canonical: "/qr-scanner" },
  openGraph: {
    title: "Free QR Code Scanner — Camera & Image Upload | LinkCraft",
    description: "Scan QR codes with your camera or decode a QR code from an uploaded image for free.",
    url: "/qr-scanner",
  },
};

const benefits = [
  [Camera, "Live camera scanning", "Use your phone or computer camera to scan a QR code instantly."],
  [ImagePlus, "Scan from an image", "Upload a screenshot or photo containing a QR code and decode it locally."],
  [ShieldCheck, "Private in-browser decoding", "Camera frames and uploaded images are processed in your browser, not uploaded to LinkCraft."],
] as const;

export default function QrScannerPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#11110f]">
      <header className="border-b border-[#deded8] bg-[#f7f7f4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-3 font-black tracking-[-0.04em]">
            <Image src="/linkcraft-mark.svg" alt="LinkCraft" width={36} height={36} priority />
            <span className="text-lg">Link<span className="text-[#FF5C35]">Craft</span></span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/free-qr-code-generator" className="secondary-action accent-button-hover"><ScanLine size={15} /> Create QR</Link>
            <Link href="/" className="secondary-action"><ArrowLeft size={15} /> All link tools</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#deded8] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="max-w-4xl">
            <div className="section-kicker">Free QR Code Scanner</div>
            <h1 className="mt-3 text-4xl font-black leading-[0.96] tracking-[-0.06em] sm:text-5xl md:text-6xl">
              Scan a QR code with your <span className="text-[#FF5C35]">camera or photo.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#5f5f59] md:text-lg">
              Point your camera at a QR code for live scanning, or upload a screenshot or photo. LinkCraft decodes the QR content directly in your browser and shows the result instantly.
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

          <QrScannerTool />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="section-kicker">How it works</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Two ways to scan.</h2>
            <div className="mt-6 grid gap-3 text-sm leading-6 text-[#5f5f59]">
              <div className="rounded-2xl border border-[#deded8] bg-white p-5"><h3 className="font-black text-[#11110f]">Use your camera</h3><p className="mt-2">Press Start camera, allow browser permission, and point the rear camera at the QR code. Scanning stops automatically after a result is detected.</p></div>
              <div className="rounded-2xl border border-[#deded8] bg-white p-5"><h3 className="font-black text-[#11110f]">Upload a screenshot or photo</h3><p className="mt-2">Choose an image from your device. LinkCraft scans it locally and displays the decoded QR content without sending the file to a server.</p></div>
            </div>
          </div>
          <div>
            <div className="section-kicker">Privacy & safety</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Your scan stays on your device.</h2>
            <div className="mt-6 rounded-2xl border border-[#deded8] bg-white p-5 text-sm leading-6 text-[#5f5f59]">
              <p>Camera access begins only after you press the camera button. Uploaded QR images are decoded in the browser rather than uploaded to LinkCraft.</p>
              <p className="mt-3">QR codes can contain URLs, text, contact information and other data. Only open scanned links you trust.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
