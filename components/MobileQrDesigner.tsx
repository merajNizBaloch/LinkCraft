"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ImagePlus, Palette, QrCode, RotateCcw, Sparkles, Trash2 } from "lucide-react";

type ExportExtension = "png" | "jpeg" | "svg";
type DotType = "square" | "rounded" | "dots" | "extra-rounded";

type QrRenderer = {
  append: (container?: HTMLElement) => void;
  update: (options: Record<string, unknown>) => void;
  getRawData: (extension?: ExportExtension) => Promise<Blob | null>;
};

const presets = [
  { name: "Classic", foreground: "#11110f", background: "#ffffff", dotType: "rounded" as DotType },
  { name: "Coral", foreground: "#ff5c35", background: "#fff7f4", dotType: "rounded" as DotType },
  { name: "Dots", foreground: "#11110f", background: "#ffffff", dotType: "dots" as DotType },
  { name: "Bold", foreground: "#11110f", background: "#fff0eb", dotType: "extra-rounded" as DotType },
] as const;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MobileQrDesigner({ value }: { value: string }) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QrRenderer | null>(null);
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState("#11110f");
  const [background, setBackground] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [dotType, setDotType] = useState<DotType>("rounded");
  const [exportSize, setExportSize] = useState(1024);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<ExportExtension | null>(null);
  const [error, setError] = useState("");

  const options = useMemo<Record<string, unknown>>(
    () => ({
      width: 280,
      height: 280,
      type: "svg",
      data: value || "https://example.com",
      margin: 16,
      image: logo || undefined,
      qrOptions: { errorCorrectionLevel: logo ? "H" : "M" },
      dotsOptions: { type: dotType, color: foreground },
      cornersSquareOptions: { type: "extra-rounded", color: foreground },
      cornersDotOptions: { type: "dot", color: foreground },
      backgroundOptions: { color: transparent ? "transparent" : background },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.24, margin: 4, saveAsBlob: true },
    }),
    [value, logo, dotType, foreground, transparent, background],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const module = await import("qr-code-styling");
        if (cancelled || !previewRef.current) return;
        previewRef.current.innerHTML = "";
        const QRCodeStyling = module.default;
        const instance = new QRCodeStyling(options) as unknown as QrRenderer;
        instance.append(previewRef.current);
        qrRef.current = instance;
        setReady(true);
        setError("");
      } catch {
        setError("QR preview could not load. Refresh the page and try again.");
      }
    }

    void load();
    return () => {
      cancelled = true;
      qrRef.current = null;
    };
    // Create once; changes are handled by the update effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !qrRef.current) return;
    qrRef.current.update(options);
  }, [ready, options]);

  function applyPreset(preset: (typeof presets)[number]) {
    setForeground(preset.foreground);
    setBackground(preset.background);
    setDotType(preset.dotType);
    setTransparent(false);
  }

  function reset() {
    setForeground("#11110f");
    setBackground("#ffffff");
    setTransparent(false);
    setDotType("rounded");
    setExportSize(1024);
    setLogo(null);
    setLogoName("");
    setError("");
  }

  function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      setError("Use a PNG, JPG, WebP or SVG logo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Keep the logo below 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogo(reader.result);
        setLogoName(file.name);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  }

  async function copyLink() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Copy is not available in this browser.");
    }
  }

  async function download(extension: ExportExtension) {
    if (!value || !qrRef.current || exporting) return;
    setExporting(extension);
    setError("");

    try {
      qrRef.current.update({
        ...options,
        width: exportSize,
        height: exportSize,
        margin: Math.max(12, Math.round(exportSize * 0.055)),
        backgroundOptions: {
          color: extension === "jpeg" ? background : transparent ? "transparent" : background,
        },
      });
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const raw = await qrRef.current.getRawData(extension);
      if (!(raw instanceof Blob)) throw new Error("No file");
      triggerDownload(raw, extension === "jpeg" ? "linkcraft-qr.jpg" : `linkcraft-qr.${extension}`);
    } catch {
      setError(`Could not create the ${extension === "jpeg" ? "JPG" : extension.toUpperCase()} file.`);
    } finally {
      qrRef.current?.update(options);
      setExporting(null);
    }
  }

  return (
    <div className="grid gap-4 pb-2">
      <section className="rounded-[24px] border border-[#deded8] bg-[#f7f7f4] p-3 shadow-sm">
        <div className="flex items-center justify-between px-1 pb-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5c35]">Quick QR</div>
            <div className="mt-1 text-base font-black">Preview & download</div>
          </div>
          <span className="rounded-full bg-[#e8f5e4] px-2.5 py-1 text-[10px] font-black text-[#417238]">Auto-generates</span>
        </div>

        <div className={`grid min-h-[300px] place-items-center overflow-hidden rounded-[20px] p-4 ${transparent ? "bg-[linear-gradient(45deg,#ecece8_25%,transparent_25%,transparent_75%,#ecece8_75%),linear-gradient(45deg,#ecece8_25%,#fff_25%,#fff_75%,#ecece8_75%)] bg-[length:18px_18px] bg-[position:0_0,9px_9px]" : "bg-white"}`}>
          {value ? (
            <div ref={previewRef} className="grid max-w-full place-items-center [&>svg]:h-auto [&>svg]:max-w-full" />
          ) : (
            <div className="px-5 text-center">
              <QrCode size={66} className="mx-auto text-[#c8c8c2]" />
              <div className="mt-4 text-sm font-black">Paste a link above</div>
              <p className="mt-1 text-xs leading-5 text-[#888882]">Your QR code will appear here immediately.</p>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void download("png")}
            disabled={!value || !ready || exporting !== null}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#11110f] px-3 text-sm font-black text-white transition active:scale-[.98] disabled:opacity-40"
          >
            <Download size={16} /> {exporting === "png" ? "Creating…" : transparent ? "PNG transparent" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={() => void download("jpeg")}
            disabled={!value || !ready || exporting !== null}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#deded8] bg-white px-3 text-sm font-black transition active:scale-[.98] disabled:opacity-40"
          >
            <Download size={16} /> {exporting === "jpeg" ? "Creating…" : "JPG"}
          </button>
          <button
            type="button"
            onClick={() => void download("svg")}
            disabled={!value || !ready || exporting !== null}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#deded8] bg-white px-3 text-xs font-black disabled:opacity-40"
          >
            <Download size={15} /> SVG
          </button>
          <button
            type="button"
            onClick={copyLink}
            disabled={!value}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#deded8] bg-white px-3 text-xs font-black disabled:opacity-40"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </section>

      <details className="group overflow-hidden rounded-[22px] border border-[#deded8] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0eb] text-[#ff5c35]"><Palette size={18} /></div>
            <div><div className="text-sm font-black">Customize QR</div><div className="mt-0.5 text-[11px] text-[#777772]">Optional · colors, style, logo & transparency</div></div>
          </div>
          <span className="text-xl font-light text-[#777772] transition group-open:rotate-45">+</span>
        </summary>

        <div className="border-t border-[#ecece7] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#777772]"><Sparkles size={14} /> Presets</div>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#777772]"><RotateCcw size={13} /> Reset</button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button key={preset.name} type="button" onClick={() => applyPreset(preset)} className="rounded-xl border border-[#deded8] bg-[#fafaf8] p-2 text-center text-[10px] font-black">
                <span className="mx-auto mb-1.5 block h-5 w-5 rounded-md border border-black/5" style={{ background: preset.foreground }} />
                {preset.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="grid gap-1.5"><span className="field-label">QR color</span><div className="flex min-h-11 items-center gap-2 rounded-xl border border-[#deded8] px-3"><input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-7 w-8 border-0 bg-transparent p-0" /><span className="text-[11px] font-bold uppercase">{foreground}</span></div></label>
            <label className="grid gap-1.5"><span className="field-label">Background</span><div className="flex min-h-11 items-center gap-2 rounded-xl border border-[#deded8] px-3"><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-7 w-8 border-0 bg-transparent p-0" /><span className="text-[11px] font-bold uppercase">{background}</span></div></label>
          </div>

          <label className="mt-3 flex items-center justify-between rounded-xl border border-[#deded8] bg-[#fafaf8] px-4 py-3 text-sm font-bold">
            Transparent PNG / SVG
            <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-5 w-5 accent-[#ff5c35]" />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="grid gap-1.5"><span className="field-label">Pattern</span><select value={dotType} onChange={(event) => setDotType(event.target.value as DotType)} className="input-shell"><option value="square">Square</option><option value="rounded">Rounded</option><option value="dots">Dots</option><option value="extra-rounded">Bubble</option></select></label>
            <label className="grid gap-1.5"><span className="field-label">Download size</span><select value={exportSize} onChange={(event) => setExportSize(Number(event.target.value))} className="input-shell"><option value="512">512 px</option><option value="1024">1024 px</option><option value="2048">2048 px</option></select></label>
          </div>

          <div className="mt-3 rounded-xl border border-[#deded8] bg-[#fafaf8] p-3">
            <div className="flex items-center justify-between gap-3">
              <div><div className="text-xs font-black">Center logo</div><div className="mt-0.5 max-w-[190px] truncate text-[10px] text-[#888882]">{logoName || "PNG, JPG, WebP or SVG"}</div></div>
              {logo ? (
                <button type="button" onClick={() => { setLogo(null); setLogoName(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black"><Trash2 size={13} /> Remove</button>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#11110f] px-3 py-2 text-[11px] font-black text-white"><ImagePlus size={13} /> Add<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogo} className="hidden" /></label>
              )}
            </div>
          </div>
        </div>
      </details>

      {transparent && <div className="rounded-xl bg-[#fff0eb] px-4 py-3 text-[11px] font-semibold leading-5 text-[#a53419]">PNG and SVG keep transparency. JPG always uses the selected solid background.</div>}
      {error && <div className="rounded-xl border border-[#ffd0c3] bg-[#fff0eb] p-3 text-xs font-semibold text-[#a53419]">{error}</div>}
    </div>
  );
}
