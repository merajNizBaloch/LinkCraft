"use client";

import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
  QrCode,
  ScanSearch,
  Sparkles,
  Tags,
  Unlink2,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type ToolId =
  | "shorten"
  | "qr"
  | "clean"
  | "utm"
  | "whatsapp"
  | "codec"
  | "inspect";

const tools = [
  { id: "shorten" as const, label: "Shorten", icon: Link2, status: "Next" },
  { id: "qr" as const, label: "QR Code", icon: QrCode },
  { id: "clean" as const, label: "Clean URL", icon: WandSparkles },
  { id: "utm" as const, label: "UTM Builder", icon: Tags },
  { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { id: "codec" as const, label: "Encode / Decode", icon: Unlink2 },
  { id: "inspect" as const, label: "Inspect", icon: ScanSearch },
];

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
]);

function normalizeUrl(value: string) {
  const input = value.trim();
  if (!input) return "";
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

function cleanUrl(value: string) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    [...url.searchParams.keys()].forEach((key) => {
      if (key.toLowerCase().startsWith("utm_") || trackingParams.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    });
    return url.toString();
  } catch {
    return "Invalid URL";
  }
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-xl border border-[#d8d8d2] bg-white px-4 py-3 text-sm font-semibold transition hover:border-[#11110f]"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#696965]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 rounded-xl border border-[#d8d8d2] bg-white px-4 outline-none transition focus:border-[#11110f]"
      />
    </label>
  );
}

export default function Home() {
  const [active, setActive] = useState<ToolId>("qr");
  const [url, setUrl] = useState("https://techcraftsolution.com/?utm_source=instagram&utm_campaign=launch");
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmMedium, setUtmMedium] = useState("social");
  const [utmCampaign, setUtmCampaign] = useState("launch");
  const [phone, setPhone] = useState("923336077281");
  const [message, setMessage] = useState("Hi, I am interested in your services.");
  const [codecValue, setCodecValue] = useState("https://example.com/product?id=12&name=Link Craft");
  const [codecMode, setCodecMode] = useState<"encode" | "decode">("encode");

  const normalized = useMemo(() => normalizeUrl(url), [url]);
  const cleaned = useMemo(() => cleanUrl(url), [url]);

  const utmUrl = useMemo(() => {
    if (!normalized) return "";
    try {
      const built = new URL(normalized);
      if (utmSource) built.searchParams.set("utm_source", utmSource);
      if (utmMedium) built.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) built.searchParams.set("utm_campaign", utmCampaign);
      return built.toString();
    } catch {
      return "Invalid URL";
    }
  }, [normalized, utmSource, utmMedium, utmCampaign]);

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
        path: parsed.pathname || "/",
        queryCount: [...parsed.searchParams.keys()].length,
        hash: parsed.hash || "None",
      };
    } catch {
      return { valid: false } as const;
    }
  }, [normalized]);

  function downloadQr() {
    const svg = document.getElementById("linkcraft-qr");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "linkcraft-qr.svg";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="border-b border-[#deded8] bg-[#f7f7f4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#11110f] text-white">
              <Link2 size={20} />
            </div>
            <div>
              <div className="text-lg font-black tracking-[-0.04em]">LinkCraft</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a74]">by TechCraft</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#deded8] bg-white px-4 py-2 text-xs font-semibold text-[#5e5e59] md:flex">
            <Sparkles size={14} /> Free link utilities. No sign-up.
          </div>
        </div>
      </header>

      <section className="link-grid border-b border-[#deded8]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ffd0c3] bg-[#fff0eb] px-3 py-1.5 text-xs font-bold text-[#b93617]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c35]" />
              Built for fast everyday link work
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] sm:text-6xl md:text-7xl">
              One link.
              <br />
              <span className="text-[#ff5c35]">Every tool.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f5f59] md:text-lg">
              Generate QR codes, clean tracking parameters, build campaign URLs, create WhatsApp links, encode URLs and inspect every part of a link — from one clean workspace.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#d5d5cf] bg-white p-3 shadow-[0_25px_80px_rgba(17,17,15,.08)]">
            <div className="rounded-[22px] bg-[#11110f] p-5 text-white md:p-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                <span>Paste any URL</span>
                <span>01</span>
              </div>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="mt-6 w-full border-b border-white/20 bg-transparent pb-4 text-lg outline-none placeholder:text-white/25 md:text-xl"
                placeholder="https://example.com"
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {["qr", "clean", "inspect"].map((id) => (
                  <button
                    key={id}
                    onClick={() => setActive(id as ToolId)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#11110f] transition hover:-translate-y-0.5"
                  >
                    {id === "qr" ? "Make QR" : id === "clean" ? "Clean link" : "Inspect"}
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#deded8] bg-[#11110f] py-3 text-white/65">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em]">
          {Array.from({ length: 2 }).flatMap((_, i) => [
            <span key={`${i}-1`}>QR Generator</span>,
            <span key={`${i}-2`}>URL Cleaner</span>,
            <span key={`${i}-3`}>UTM Builder</span>,
            <span key={`${i}-4`}>WhatsApp Links</span>,
            <span key={`${i}-5`}>URL Encoder</span>,
            <span key={`${i}-6`}>Link Inspector</span>,
            <span key={`${i}-7`}>Free Tools</span>,
          ])}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5c35]">Toolbox</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] md:text-4xl">Choose what you need.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#696965]">Most tools run directly in your browser, so there is nothing to upload and no account required.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const selected = active === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActive(tool.id)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                    selected ? "border-[#11110f] bg-[#11110f] text-white" : "border-[#deded8] bg-white hover:border-[#b8b8b1]"
                  }`}
                >
                  <span className="flex items-center gap-3 text-sm font-bold"><Icon size={18} /> {tool.label}</span>
                  {tool.status && <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${selected ? "bg-white/10" : "bg-[#fff0eb] text-[#c33d1c]"}`}>{tool.status}</span>}
                </button>
              );
            })}
          </nav>

          <div className="min-h-[470px] rounded-[28px] border border-[#d8d8d2] bg-white p-5 md:p-8">
            {active === "shorten" && (
              <div className="grid h-full content-center gap-6 py-10 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0eb] text-[#ff5c35]"><Link2 size={28} /></div>
                <div>
                  <span className="rounded-full bg-[#f2f2ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">Backend module</span>
                  <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">Persistent URL Shortener</h3>
                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#696965]">The interface is reserved for real short links with redirect persistence, custom aliases and click analytics. It will be connected to Supabase instead of generating fake local links.</p>
                </div>
                <div className="mx-auto flex max-w-xl items-center rounded-2xl border border-dashed border-[#cfcfc8] bg-[#fafaf8] p-2 pl-4 text-left">
                  <span className="min-w-0 flex-1 truncate text-sm text-[#696965]">{normalized || "https://your-long-link.com"}</span>
                  <button disabled className="rounded-xl bg-[#deded8] px-4 py-3 text-sm font-bold text-[#8a8a84]">Shorten soon</button>
                </div>
              </div>
            )}

            {active === "qr" && (
              <div className="grid gap-8 md:grid-cols-[1fr_260px] md:items-center">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff5c35]">QR Generator</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">Turn any link into a QR.</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#696965]">The QR is created in your browser. Update the URL above and the code refreshes instantly.</p>
                  <div className="mt-7 rounded-2xl border border-[#deded8] bg-[#fafaf8] p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#777772]">Destination</div>
                    <div className="mt-2 break-all text-sm font-semibold">{normalized || "Add a URL above"}</div>
                  </div>
                  <button onClick={downloadQr} disabled={!normalized} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"><QrCode size={17} /> Download SVG</button>
                </div>
                <div className="grid aspect-square place-items-center rounded-[28px] border border-[#deded8] bg-[#f7f7f4] p-7">
                  {normalized ? <QRCodeSVG id="linkcraft-qr" value={normalized} size={190} level="M" marginSize={2} /> : <QrCode size={70} className="text-[#c8c8c2]" />}
                </div>
              </div>
            )}

            {active === "clean" && (
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff5c35]">URL Cleaner</div>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">Remove common tracking noise.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#696965]">Removes UTM parameters and common ad identifiers such as fbclid, gclid and msclkid while keeping the destination intact.</p>
                <div className="mt-7 grid gap-4">
                  <div className="rounded-2xl border border-[#deded8] bg-[#fafaf8] p-5"><div className="text-xs font-bold uppercase tracking-[0.14em] text-[#777772]">Original</div><div className="mt-2 break-all text-sm">{url || "—"}</div></div>
                  <ArrowRight className="ml-4 rotate-90 text-[#ff5c35] md:rotate-0" size={22} />
                  <div className="rounded-2xl border border-[#bfcfbb] bg-[#f6faf5] p-5"><div className="text-xs font-bold uppercase tracking-[0.14em] text-[#53714d]">Cleaned</div><div className="mt-2 break-all text-sm font-semibold">{cleaned || "—"}</div></div>
                  <div><CopyButton value={cleaned === "Invalid URL" ? "" : cleaned} /></div>
                </div>
              </div>
            )}

            {active === "utm" && (
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff5c35]">UTM Builder</div>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">Build trackable campaign URLs.</h3>
                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  <Field label="Source" value={utmSource} onChange={setUtmSource} placeholder="instagram" />
                  <Field label="Medium" value={utmMedium} onChange={setUtmMedium} placeholder="social" />
                  <Field label="Campaign" value={utmCampaign} onChange={setUtmCampaign} placeholder="launch" />
                </div>
                <div className="mt-5 rounded-2xl border border-[#deded8] bg-[#fafaf8] p-5"><div className="text-xs font-bold uppercase tracking-[0.14em] text-[#777772]">Campaign URL</div><div className="mt-2 break-all text-sm font-semibold">{utmUrl || "Add a valid URL above"}</div></div>
                <div className="mt-4"><CopyButton value={utmUrl === "Invalid URL" ? "" : utmUrl} /></div>
              </div>
            )}

            {active === "whatsapp" && (
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff5c35]">WhatsApp Link</div>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">Create a click-to-chat link.</h3>
                <div className="mt-7 grid gap-4">
                  <Field label="Phone with country code" value={phone} onChange={setPhone} placeholder="923001234567" />
                  <label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-[#696965]">Prefilled message</span><textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="rounded-xl border border-[#d8d8d2] bg-white px-4 py-3 outline-none transition focus:border-[#11110f]" /></label>
                </div>
                <div className="mt-5 rounded-2xl border border-[#deded8] bg-[#fafaf8] p-5"><div className="text-xs font-bold uppercase tracking-[0.14em] text-[#777772]">Generated link</div><div className="mt-2 break-all text-sm font-semibold">{whatsappUrl || "—"}</div></div>
                <div className="mt-4 flex flex-wrap gap-2"><CopyButton value={whatsappUrl} />{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-3 text-sm font-bold text-white"><ExternalLink size={16} /> Open</a>}</div>
              </div>
            )}

            {active === "codec" && (
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff5c35]">Encoder / Decoder</div>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">Make URL text safe — or readable again.</h3>
                <div className="mt-6 inline-flex rounded-xl border border-[#deded8] bg-[#f5f5f2] p-1">{(["encode", "decode"] as const).map((mode) => <button key={mode} onClick={() => setCodecMode(mode)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${codecMode === mode ? "bg-white shadow-sm" : "text-[#777772]"}`}>{mode}</button>)}</div>
                <textarea rows={5} value={codecValue} onChange={(event) => setCodecValue(event.target.value)} className="mt-5 w-full rounded-2xl border border-[#d8d8d2] bg-white p-4 outline-none focus:border-[#11110f]" />
                <div className="mt-4 rounded-2xl border border-[#deded8] bg-[#fafaf8] p-5"><div className="text-xs font-bold uppercase tracking-[0.14em] text-[#777772]">Result</div><div className="mt-2 break-all text-sm font-semibold">{codecResult || "—"}</div></div>
                <div className="mt-4"><CopyButton value={codecResult} /></div>
              </div>
            )}

            {active === "inspect" && (
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff5c35]">Link Inspector</div>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">Understand what is inside a URL.</h3>
                {inspection.valid ? (
                  <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["Protocol", inspection.protocol],
                      ["Host", inspection.host],
                      ["Path", inspection.path],
                      ["Query params", String(inspection.queryCount)],
                      ["Fragment", inspection.hash],
                      ["Status", "Valid URL"],
                    ].map(([label, value]) => <div key={label} className="tool-card rounded-2xl border border-[#deded8] bg-[#fafaf8] p-5"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#777772]">{label}</div><div className="mt-2 break-all text-sm font-bold">{value}</div></div>)}
                  </div>
                ) : <div className="mt-7 rounded-2xl border border-[#ffd0c3] bg-[#fff0eb] p-5 text-sm font-semibold text-[#a53419]">Enter a valid URL in the field above to inspect it.</div>}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[#deded8] bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-3 md:px-8">
          {["Runs in your browser", "No sign-up for core tools", "Made by TechCraft"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#e1e1dc] p-4 text-sm font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#11110f] text-[10px] text-white">0{index + 1}</span>{item}</div>)}
        </div>
      </section>

      <footer className="border-t border-[#deded8] px-5 py-7 text-center text-xs text-[#777772] md:px-8">LinkCraft · Free link utilities by TechCraft</footer>
    </main>
  );
}
