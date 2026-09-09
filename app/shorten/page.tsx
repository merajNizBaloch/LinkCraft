"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Link2,
  LoaderCircle,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type CreatedLink = {
  code: string;
  destination: string;
  click_count: number;
  expires_at: string | null;
  created_at: string;
  shortUrl: string;
};

export default function ShortenPage() {
  const [destination, setDestination] = useState("");
  const [alias, setAlias] = useState("");
  const [expiry, setExpiry] = useState("");
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCreated(null);
    setLoading(true);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          alias,
          expiresInDays: expiry ? Number(expiry) : null,
        }),
      });

      const payload = (await response.json()) as {
        link?: CreatedLink;
        error?: string;
      };

      if (!response.ok || !payload.link) {
        throw new Error(payload.error || "Unable to create this short link.");
      }

      setCreated(payload.link);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create this short link.");
    } finally {
      setLoading(false);
    }
  }

  async function copyShortUrl() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  }

  function reset() {
    setDestination("");
    setAlias("");
    setExpiry("");
    setCreated(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#11110f]">
      <header className="border-b border-[#deded8] bg-[#f7f7f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#11110f] text-white">
              <Link2 size={19} />
            </div>
            <div>
              <div className="text-lg font-black tracking-[-0.045em]">LinkCraft</div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7a74]">by TechCraft</div>
            </div>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#deded8] bg-white px-4 py-2 text-xs font-bold transition hover:border-[#11110f]">
            <ArrowLeft size={14} /> Toolbox
          </Link>
        </div>
      </header>

      <section className="link-grid relative overflow-hidden border-b border-[#deded8]">
        <div className="hero-orb hero-orb-one" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd0c3] bg-[#fff0eb] px-3 py-1.5 text-xs font-bold text-[#b93617]">
            <Sparkles size={14} /> Persistent short links
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.065em] md:text-7xl">
            Short links that are actually <span className="text-[#ff5c35]">yours.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f5f59] md:text-lg">
            Turn long URLs into compact LinkCraft redirects. Add a memorable alias, choose an expiry, then share the short URL or its QR code.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:px-8 md:py-14 lg:grid-cols-[1.08fr_.92fr]">
        <form onSubmit={submit} className="rounded-[30px] border border-[#d8d8d2] bg-white p-5 shadow-[0_25px_70px_rgba(17,17,15,.05)] md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="section-kicker">Create short link</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Paste. Customize. Share.</h2>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0eb] text-[#ff5c35]">
              <Link2 size={20} />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="field-label">Destination URL</span>
              <input
                required
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="https://example.com/very/long/link"
                className="input-shell"
              />
              <span className="text-[11px] leading-5 text-[#888882]">HTTP and HTTPS destinations only.</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="field-label">Custom alias · optional</span>
                <div className="flex items-center rounded-xl border border-[#d8d8d2] bg-white px-4 focus-within:border-[#11110f]">
                  <span className="text-sm font-bold text-[#9a9a94]">/</span>
                  <input
                    value={alias}
                    onChange={(event) => setAlias(event.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="my-campaign"
                    maxLength={32}
                    className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold outline-none"
                  />
                </div>
                <span className="text-[11px] leading-5 text-[#888882]">3–32 letters, numbers, hyphens or underscores.</span>
              </label>

              <label className="grid gap-2">
                <span className="field-label">Expiration</span>
                <select value={expiry} onChange={(event) => setExpiry(event.target.value)} className="input-shell">
                  <option value="">Never expires</option>
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
                <span className="text-[11px] leading-5 text-[#888882]">Expired links stop redirecting automatically.</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-[#ffd0c3] bg-[#fff0eb] p-4 text-sm font-semibold leading-6 text-[#a53419]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !destination.trim()}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#11110f] px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Link2 size={17} />}
            {loading ? "Creating link..." : "Create short link"}
          </button>

          <div className="mt-5 flex items-start gap-2 rounded-2xl bg-[#f7f7f4] p-4 text-[11px] leading-5 text-[#74746f]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#52704c]" />
            Link creation goes through the LinkCraft server. Database credentials are never sent to the browser.
          </div>
        </form>

        <div className="rounded-[30px] border border-[#d8d8d2] bg-[#11110f] p-5 text-white shadow-[0_25px_70px_rgba(17,17,15,.12)] md:p-8">
          {!created ? (
            <div className="grid h-full min-h-[430px] content-center text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-white/8 text-white/70">
                <QrCode size={34} />
              </div>
              <div className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Your result</div>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.05em]">A clean link appears here.</h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/50">Create a short link to get its share URL, QR code, expiry status and starting click count.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8a6e]">Ready to share</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">Your short link is live.</h3>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#dff4d9] text-[#315e2a]">
                  <Check size={18} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Short URL</div>
                <div className="mt-2 break-all text-lg font-black text-white">{created.shortUrl}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={copyShortUrl} type="button" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#11110f]">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                  </button>
                  <a href={created.shortUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-black text-white">
                    <ExternalLink size={14} /> Test link
                  </a>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[190px_1fr] sm:items-center">
                <div className="grid aspect-square place-items-center rounded-2xl bg-white p-4">
                  <QRCodeSVG value={created.shortUrl} size={150} level="M" marginSize={1} />
                </div>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">Alias / code</div>
                    <div className="mt-1 font-black">/{created.code}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">Expires</div>
                    <div className="mt-1 text-sm font-bold">{created.expires_at ? new Date(created.expires_at).toLocaleDateString() : "Never"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">Clicks</div>
                    <div className="mt-1 text-sm font-bold">{created.click_count}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">Destination</div>
                <div className="mt-2 break-all text-xs leading-5 text-white/65">{created.destination}</div>
              </div>

              <button onClick={reset} type="button" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white">
                <RotateCcw size={14} /> Create another
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
