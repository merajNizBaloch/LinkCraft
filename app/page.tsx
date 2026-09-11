"use client";

import {
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  ExternalLink,
  Globe2,
  Link2,
  MessageCircle,
  MousePointerClick,
  QrCode,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Tags,
  Unlink2,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QrDesigner from "@/components/QrDesigner";

type ToolId = "shorten" | "qr" | "clean" | "utm" | "whatsapp" | "codec" | "inspect";

const tools = [
  { id: "shorten" as const, label: "Shorten", description: "Persistent shareable links", icon: Link2, status: "Live" },
  { id: "qr" as const, label: "QR Code", description: "Design branded QR codes", icon: QrCode },
  { id: "clean" as const, label: "Clean URL", description: "Strip tracking parameters", icon: WandSparkles },
  { id: "utm" as const, label: "UTM Builder", description: "Build campaign links", icon: Tags },
  { id: "whatsapp" as const, label: "WhatsApp", description: "Create click-to-chat links", icon: MessageCircle },
  { id: "codec" as const, label: "Encode / Decode", description: "Make URL text safe", icon: Unlink2 },
  { id: "inspect" as const, label: "Inspect", description: "Break a URL into parts", icon: ScanSearch },
];

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "yclid",
  "twclid",
  "ttclid",
]);

function normalizeUrl(value: string) {
  const input = value.trim();
  if (!input) return "";
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

function getCleanUrl(value: string) {
  const normalized = normalizeUrl(value);
  if (!normalized) return { cleaned: "", removed: [] as string[] };

  try {
    const parsed = new URL(normalized);
    const removed: string[] = [];

    [...parsed.searchParams.keys()].forEach((key) => {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || trackingParams.has(lower)) {
        removed.push(key);
        parsed.searchParams.delete(key);
      }
    });

    return { cleaned: parsed.toString(), removed };
  } catch {
    return { cleaned: "Invalid URL", removed: [] as string[] };
  }
}

function CopyButton({ value, dark = false, label = "Copy" }: { value: string; dark?: boolean; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access can be blocked on insecure origins.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        dark ? "bg-[#11110f] text-white accent-button-hover hover:-translate-y-0.5" : "border border-[#d8d8d2] bg-white accent-button-hover"
      }`}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2">
      <span className="field-label">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input-shell" />
    </label>
  );
}

function ResultBox({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${positive ? "border-[#c8d9c3] bg-[#f5faf3]" : "border-[#deded8] bg-[#fafaf8]"}`}>
      <div className={`text-[10px] font-black uppercase tracking-[0.16em] ${positive ? "text-[#52704c]" : "text-[#777772]"}`}>{label}</div>
      <div className="mt-2 break-all text-sm font-semibold leading-6">{value || "—"}</div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<ToolId>("shorten");
  const [url, setUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [codecValue, setCodecValue] = useState("");
  const [codecMode, setCodecMode] = useState<"encode" | "decode">("encode");

  useEffect(() => {
    const requestedTool = new URLSearchParams(window.location.search).get("tool") as ToolId | null;
    if (!requestedTool || !tools.some((tool) => tool.id === requestedTool)) return;

    setActive(requestedTool);
    if (window.location.hash === "#workspace") {
      window.requestAnimationFrame(() => {
        document.getElementById("workspace")?.scrollIntoView({ block: "start" });
      });
    }
  }, []);

  const normalized = useMemo(() => normalizeUrl(url), [url]);
  const cleanedResult = useMemo(() => getCleanUrl(url), [url]);

  const urlStatus = useMemo(() => {
    if (!url.trim()) return { valid: false, label: "Waiting for a link", host: "" };
    try {
      const parsed = new URL(normalized);
      return { valid: true, label: "Valid URL", host: parsed.hostname };
    } catch {
      return { valid: false, label: "Check this URL", host: "" };
    }
  }, [normalized, url]);

  const utmUrl = useMemo(() => {
    if (!normalized) return "";
    try {
      const built = new URL(normalized);
      if (utmSource) built.searchParams.set("utm_source", utmSource);
      if (utmMedium) built.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) built.searchParams.set("utm_campaign", utmCampaign);
      if (utmTerm) built.searchParams.set("utm_term", utmTerm);
      if (utmContent) built.searchParams.set("utm_content", utmContent);
      return built.toString();
    } catch {
      return "Invalid URL";
    }
  }, [normalized, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const whatsappUrl = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  }, [phone, message]);

  const codecResult = useMemo(() => {
    if (!codecValue) return "";
    try {
      return codecMode === "encode" ? encodeURIComponent(codecValue) : decodeURIComponent(codecValue);
    } catch {
      return "Unable to decode this value";
    }
  }, [codecMode, codecValue]);

  const inspection = useMemo(() => {
    try {
      const parsed = new URL(normalized);
      return {
        valid: true,
        protocol: parsed.protocol.replace(":", "").toUpperCase(),
        host: parsed.hostname,
        origin: parsed.origin,
        path: parsed.pathname || "/",
        port: parsed.port || "Default",
        queryCount: [...parsed.searchParams.keys()].length,
        hash: parsed.hash || "None",
        params: [...parsed.searchParams.entries()],
      };
    } catch {
      return { valid: false } as const;
    }
  }, [normalized]);

  function selectTool(tool: ToolId, scroll = true) {
    setActive(tool);
    if (scroll) {
      window.requestAnimationFrame(() => {
        document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async function pasteUrl() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // Clipboard permissions vary by browser and protocol.
    }
  }

  function sendToQr(value: string) {
    if (!value || value === "Invalid URL") return;
    setUrl(value);
    selectTool("qr");
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-[#deded8] bg-[#f7f7f4]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="group flex items-center gap-3 text-left" aria-label="LinkCraft home">
            <div className="logo-mark grid h-10 w-10 place-items-center"><Image src="/linkcraft-mark.svg" alt="" width={40} height={40} priority /></div>
            <div>
              <div className="text-lg font-black tracking-[-0.045em]"><span>Link</span><span className="text-[#ff5c35]">Craft</span></div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7a74]">by TechCraft</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <a href="/link-page" className="hidden rounded-full border border-[#ffd0c3] bg-[#fff0eb] px-4 py-2 text-xs font-black text-[#b93617] transition hover:-translate-y-0.5 hover:border-[#ff5c35] sm:block">Link Page</a>
            <a href="/free-qr-code-generator" className="hidden rounded-full border border-[#deded8] bg-white px-4 py-2 text-xs font-bold text-[#11110f] transition accent-button-hover md:block">Free QR</a>
            <a href="/shorten" className="hidden rounded-full bg-[#11110f] px-4 py-2 text-xs font-bold text-white transition accent-button-hover hover:-translate-y-0.5 sm:block">Shorten a link</a>
          </div>
        </div>
      </header>

      <section className="link-grid relative border-b border-[#deded8]">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.03fr_.97fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ffd0c3] bg-[#fff0eb]/90 px-3 py-1.5 text-xs font-bold text-[#b93617] shadow-sm"><Sparkles size={14} /> Seven link tools in one workspace</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-6xl md:text-7xl lg:text-[82px]">Work smarter<br />with <span className="accent-underline text-[#ff5c35]">every link.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#5f5f59] md:text-lg">Use LinkCraft as a free QR code generator and link toolkit: shorten URLs, create branded QR codes, remove trackers, build UTM campaigns, create WhatsApp links and inspect URLs in one place.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-[#5f5f59]">
              <span className="proof-pill"><Zap size={14} /> Fast</span>
              <span className="proof-pill"><ShieldCheck size={14} /> Server secrets stay private</span>
              <span className="proof-pill"><Globe2 size={14} /> Free tools</span>
            </div>
          </div>

          <div className="hero-console rounded-[30px] border border-[#d5d5cf] bg-white/88 p-3 shadow-[0_28px_90px_rgba(17,17,15,.12)] backdrop-blur">
            <div className="rounded-[24px] bg-[#11110f] p-5 text-white md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Universal input</div><div className="mt-1 text-sm font-bold">Paste once. Reuse everywhere.</div></div>
                <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${urlStatus.valid ? "bg-[#dff4d9] text-[#315e2a]" : "bg-white/10 text-white/60"}`}>{urlStatus.label}</div>
              </div>
              <div className="mt-7 flex items-center gap-2 border-b border-white/20 pb-3">
                <Link2 size={18} className="shrink-0 text-white/35" />
                <input value={url} onChange={(event) => setUrl(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-white/25 md:text-lg" placeholder="Paste a URL or link" aria-label="URL" />
                {url && <button type="button" onClick={() => setUrl("")} className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white" aria-label="Clear URL"><X size={16} /></button>}
                <button type="button" onClick={pasteUrl} className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Paste URL"><Clipboard size={16} /></button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["shorten", "Shorten", Link2],
                  ["qr", "Make QR", QrCode],
                  ["clean", "Clean", WandSparkles],
                  ["inspect", "Inspect", ScanSearch],
                ].map(([id, label, Icon]) => {
                  const ToolIcon = Icon as typeof QrCode;
                  return <button key={id as string} type="button" onClick={() => selectTool(id as ToolId)} className="group flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-xs font-black text-[#11110f] transition accent-button-hover hover:-translate-y-0.5"><ToolIcon size={15} />{label as string}</button>;
                })}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/40"><span className="truncate pr-4">{urlStatus.host || "Core transformations stay in your browser"}</span><span className="shrink-0 font-bold text-white/60">LINKCRAFT / 01</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#deded8] bg-[#11110f] py-3.5 text-white/60">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.24em]">
          {Array.from({ length: 3 }).flatMap((_, i) => [
            <span key={`${i}-0`}>URL Shortener</span>,
            <span key={`${i}-1`}>Free QR Code Generator</span>,
            <span key={`${i}-2`}>URL Cleaner</span>,
            <span key={`${i}-3`}>UTM Builder</span>,
            <span key={`${i}-4`}>WhatsApp Links</span>,
            <span key={`${i}-5`}>URL Encoder</span>,
            <span key={`${i}-6`}>Link Inspector</span>,
          ])}
        </div>
      </section>

      <section id="workspace" className="scroll-mt-20 mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><div className="section-kicker">LinkCraft workspace</div><h2 className="mt-2 text-3xl font-black tracking-[-0.05em] md:text-4xl">One link. Seven useful actions.</h2></div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#deded8] bg-white px-4 py-3 shadow-sm">
            <div className={`h-2 w-2 rounded-full ${urlStatus.valid ? "bg-[#5f9d52]" : "bg-[#d1d1ca]"}`} />
            <div className="min-w-0 max-w-[280px]"><div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#888882]">Current link</div><div className="truncate text-xs font-bold text-[#4f4f4a]">{urlStatus.host || "No valid URL yet"}</div></div>
          </div>
        </div>

        <div className="workspace-shell grid gap-5 lg:grid-cols-[300px_1fr]">
          <nav className="grid gap-2 sm:grid-cols-2 lg:sticky lg:top-24 lg:grid-cols-1 lg:self-start">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const selected = active === tool.id;
              return (
                <button key={tool.id} type="button" onClick={() => selectTool(tool.id, false)} className={`tool-nav group flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${selected ? "border-[#11110f] bg-[#11110f] text-white shadow-[0_16px_35px_rgba(17,17,15,.12)]" : "border-[#deded8] bg-white hover:-translate-y-0.5 hover:border-[#bebeb7]"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-white/10" : "bg-[#f3f3ef] text-[#4d4d48]"}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-black">{tool.label}{tool.status && <span className={`rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] ${selected ? "bg-white/10 text-white/70" : "bg-[#e8f5e4] text-[#417238]"}`}>{tool.status}</span>}</span>
                    <span className={`mt-0.5 block truncate text-[11px] ${selected ? "text-white/45" : "text-[#888882]"}`}>{tool.description}</span>
                  </span>
                  <ArrowRight size={15} className={selected ? "text-white/45" : "text-[#b2b2ac]"} />
                </button>
              );
            })}
          </nav>

          <div className="min-h-[560px] rounded-[30px] border border-[#d8d8d2] bg-white p-5 shadow-[0_25px_70px_rgba(17,17,15,.05)] md:p-8">
            {active !== "whatsapp" && active !== "codec" && active !== "shorten" && (
              <div className="mb-8 rounded-2xl border border-[#deded8] bg-[#fafaf8] p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-2"><Link2 size={16} className="shrink-0 text-[#9a9a94]" /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a URL" className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold outline-none" /></div>
                  <div className="flex gap-2"><button type="button" onClick={pasteUrl} className="mini-action"><Clipboard size={14} /> Paste</button>{url && <button type="button" onClick={() => setUrl("")} className="mini-action"><X size={14} /> Clear</button>}</div>
                </div>
              </div>
            )}

            {active === "shorten" && (
              <div>
                <div className="section-kicker">URL Shortener · Live</div>
                <h3 className="tool-heading">Create a real persistent short link.</h3>
                <p className="tool-copy">LinkCraft now has a dedicated server-backed shortener with custom aliases, optional expiration, QR output and click counting.</p>
                <div className="mt-7 rounded-[26px] border border-[#deded8] bg-[#fafaf8] p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4"><div><div className="field-label">Current destination</div><div className="mt-2 max-w-xl break-all text-sm font-bold leading-6">{urlStatus.valid ? normalized : "Paste a valid destination in the universal field above."}</div></div><div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff0eb] text-[#ff5c35] sm:grid"><Link2 size={21} /></div></div>
                  <div className="mt-5 flex flex-wrap gap-2"><a href="/shorten" className="primary-action">Open shortener <ArrowRight size={16} /></a>{urlStatus.valid && <CopyButton value={normalized} label="Copy destination" />}</div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[["Custom aliases", "Choose a memorable 3–32 character slug."], ["Expiration", "Set links to stop redirecting automatically."], ["Click counting", "Each successful redirect increments its counter."]].map(([title, copy]) => <div key={title} className="tool-card rounded-2xl border border-[#e1e1dc] bg-white p-4"><Check size={15} className="text-[#ff5c35]" /><div className="mt-3 text-sm font-black">{title}</div><p className="mt-1 text-xs leading-5 text-[#777772]">{copy}</p></div>)}
                </div>
                <div className="mt-5 flex items-start gap-2 rounded-2xl border border-[#c8d9c3] bg-[#f5faf3] p-4 text-xs leading-5 text-[#52704c]"><ShieldCheck size={15} className="mt-0.5 shrink-0" />Database credentials stay on the LinkCraft server and are never sent to the browser.</div>
              </div>
            )}

            {active === "qr" && <QrDesigner value={urlStatus.valid ? normalized : ""} />}

            {active === "clean" && (
              <div>
                <div className="section-kicker">URL Cleaner</div><h3 className="tool-heading">Keep the destination. Remove tracking noise.</h3><p className="tool-copy">Removes UTM tags and common advertising click identifiers while preserving the rest of the URL.</p>
                <div className="mt-7 grid gap-4"><ResultBox label="Original link" value={url} /><div className="flex items-center gap-3 px-3 text-xs font-black uppercase tracking-[0.14em] text-[#ff5c35]"><ArrowRight size={18} className="rotate-90 sm:rotate-0" />{cleanedResult.removed.length ? `${cleanedResult.removed.length} parameter${cleanedResult.removed.length === 1 ? "" : "s"} removed` : "Nothing unnecessary found"}</div><ResultBox label="Cleaned link" value={cleanedResult.cleaned} positive /></div>
                {cleanedResult.removed.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{cleanedResult.removed.map((param) => <span key={param} className="rounded-full bg-[#fff0eb] px-3 py-1.5 text-[10px] font-black text-[#b93617]">{param}</span>)}</div>}
                <div className="mt-5 flex flex-wrap gap-2"><CopyButton value={cleanedResult.cleaned === "Invalid URL" ? "" : cleanedResult.cleaned} dark /><button type="button" onClick={() => sendToQr(cleanedResult.cleaned)} disabled={!cleanedResult.cleaned || cleanedResult.cleaned === "Invalid URL"} className="secondary-action"><QrCode size={16} /> Make QR</button>{cleanedResult.cleaned && cleanedResult.cleaned !== "Invalid URL" && cleanedResult.cleaned !== url && <button type="button" onClick={() => setUrl(cleanedResult.cleaned)} className="secondary-action"><Check size={16} /> Use cleaned link</button>}</div>
              </div>
            )}

            {active === "utm" && (
              <div>
                <div className="section-kicker">UTM Builder</div><h3 className="tool-heading">Build campaign links without formatting mistakes.</h3><p className="tool-copy">Source, medium and campaign are the core fields. Term and content are optional.</p>
                <div className="mt-7 grid gap-4 md:grid-cols-3"><Field label="Source" value={utmSource} onChange={setUtmSource} placeholder="instagram" /><Field label="Medium" value={utmMedium} onChange={setUtmMedium} placeholder="social" /><Field label="Campaign" value={utmCampaign} onChange={setUtmCampaign} placeholder="launch" /></div>
                <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Term · optional" value={utmTerm} onChange={setUtmTerm} placeholder="campaign-term" /><Field label="Content · optional" value={utmContent} onChange={setUtmContent} placeholder="button-variant" /></div>
                <div className="mt-5"><ResultBox label="Campaign URL" value={utmUrl || "Add a valid URL above"} /></div>
                <div className="mt-4 flex flex-wrap gap-2"><CopyButton value={utmUrl === "Invalid URL" ? "" : utmUrl} dark /><button type="button" onClick={() => sendToQr(utmUrl)} disabled={!utmUrl || utmUrl === "Invalid URL"} className="secondary-action"><QrCode size={16} /> Make QR</button><button type="button" onClick={() => utmUrl !== "Invalid URL" && setUrl(utmUrl)} disabled={!utmUrl || utmUrl === "Invalid URL"} className="secondary-action"><ArrowRight size={16} /> Use this link</button></div>
              </div>
            )}

            {active === "whatsapp" && (
              <div>
                <div className="section-kicker">WhatsApp Link</div><h3 className="tool-heading">Create a clean click-to-chat link.</h3><p className="tool-copy">Use the full international number without a plus sign, then optionally prefill the opening message.</p>
                <div className="mt-7 grid gap-4"><Field label="Phone with country code" value={phone} onChange={setPhone} placeholder="Country code + phone number" /><label className="grid gap-2"><span className="field-label">Prefilled message</span><textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="input-shell resize-y py-3" placeholder="Type an optional message..." /></label></div>
                <div className="mt-5"><ResultBox label="Generated WhatsApp link" value={whatsappUrl} positive /></div>
                <div className="mt-4 flex flex-wrap gap-2"><CopyButton value={whatsappUrl} dark />{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="secondary-action"><ExternalLink size={16} /> Open WhatsApp</a>}<button type="button" onClick={() => sendToQr(whatsappUrl)} disabled={!whatsappUrl} className="secondary-action"><QrCode size={16} /> Make QR</button></div>
              </div>
            )}

            {active === "codec" && (
              <div>
                <div className="section-kicker">Encoder / Decoder</div><h3 className="tool-heading">Make URL text safe — or readable again.</h3><p className="tool-copy">Encode special characters for URLs or decode percent-encoded text back into a readable value.</p>
                <div className="mt-6 inline-flex rounded-xl border border-[#deded8] bg-[#f5f5f2] p-1">{(["encode", "decode"] as const).map((mode) => <button key={mode} type="button" onClick={() => setCodecMode(mode)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${codecMode === mode ? "bg-white shadow-sm" : "text-[#777772] hover:text-[#11110f]"}`}>{mode}</button>)}</div>
                <textarea rows={5} value={codecValue} onChange={(event) => setCodecValue(event.target.value)} className="input-shell mt-5 resize-y p-4" placeholder="Paste text or a URL" />
                <div className="mt-4"><ResultBox label="Result" value={codecResult} /></div><div className="mt-4"><CopyButton value={codecResult.startsWith("Unable to") ? "" : codecResult} dark /></div>
              </div>
            )}

            {active === "inspect" && (
              <div>
                <div className="section-kicker">Link Inspector</div><h3 className="tool-heading">See exactly what a URL contains.</h3><p className="tool-copy">Break the link into its protocol, host, path, port, fragment and query parameters.</p>
                {inspection.valid ? <><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Protocol", inspection.protocol], ["Host", inspection.host], ["Origin", inspection.origin], ["Path", inspection.path], ["Port", inspection.port], ["Fragment", inspection.hash]].map(([label, value]) => <div key={label} className="tool-card rounded-2xl border border-[#deded8] bg-[#fafaf8] p-5"><div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#888882]">{label}</div><div className="mt-2 break-all text-sm font-bold leading-5">{value}</div></div>)}</div>
                <div className="mt-5 overflow-hidden rounded-2xl border border-[#deded8]"><div className="flex items-center justify-between bg-[#f5f5f2] px-5 py-3"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#777772]">Query parameters</div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black">{inspection.queryCount}</span></div>{inspection.params.length ? <div className="divide-y divide-[#ecece7]">{inspection.params.map(([key, value]) => <div key={`${key}-${value}`} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[180px_1fr]"><span className="font-bold text-[#4f4f4a]">{key}</span><span className="break-all text-[#777772]">{value || "(empty)"}</span></div>)}</div> : <div className="px-5 py-5 text-sm text-[#777772]">No query parameters in this URL.</div>}</div>
                <div className="mt-5 flex flex-wrap gap-2"><CopyButton value={normalized} dark label="Copy full URL" /><button type="button" onClick={() => selectTool("clean")} className="secondary-action"><WandSparkles size={16} /> Check trackers</button></div></> : <div className="mt-7 rounded-2xl border border-[#ffd0c3] bg-[#fff0eb] p-5 text-sm font-semibold text-[#a53419]">Enter a valid URL above to inspect it.</div>}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-[#deded8] bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-12 md:grid-cols-3 md:px-8">
          {[[MousePointerClick, "Paste once", "Reuse the same destination across the toolbox."], [ShieldCheck, "Private server credentials", "Shortener database secrets never reach the browser."], [Zap, "Useful immediately", "Most transformations run instantly without an account."]].map(([Icon, title, copy]) => {
            const BenefitIcon = Icon as typeof Zap;
            return <div key={title as string} className="feature-card rounded-2xl border border-[#e1e1dc] bg-[#fafaf8] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#11110f] text-white"><BenefitIcon size={18} /></div><div className="mt-5 text-sm font-black">{title as string}</div><p className="mt-2 text-xs leading-5 text-[#777772]">{copy as string}</p></div>;
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="overflow-hidden rounded-[30px] bg-[#11110f] p-7 text-white md:p-10"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8a6d]">LinkCraft</div><h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] md:text-4xl">Small link tasks should not need seven different websites.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/50">Keep shortening, QR creation, cleanup and campaign utilities in one coherent workspace.</p></div><a href="/shorten" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#11110f] transition accent-button-hover hover:-translate-y-0.5">Create short link <ArrowRight size={16} /></a></div></div>
      </section>

      <footer className="border-t border-[#deded8] px-5 py-7 md:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-[#777772] sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex items-center gap-2"><Image src="/linkcraft-mark.svg" alt="" width={24} height={24} /><span><strong className="text-[#11110f]">Link<span className="text-[#ff5c35]">Craft</span></strong> · Free link utilities by TechCraft</span></span><nav className="flex flex-wrap gap-4"><a className="footer-link" href="/free-qr-code-generator">Free QR Generator</a><a className="footer-link" href="/free-link-tools">Free Link Tools</a><a className="footer-link" href="/shorten">URL Shortener</a><a className="footer-link" href="/link-page">Link Pages</a></nav></div></footer>
    </main>
  );
}
