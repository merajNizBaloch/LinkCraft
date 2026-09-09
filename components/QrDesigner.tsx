"use client";

import {
  Check,
  Copy,
  Download,
  ImagePlus,
  Palette,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type QrLevel = "L" | "M" | "Q" | "H";

type QrPreset = {
  name: string;
  foreground: string;
  background: string;
};

const presets: QrPreset[] = [
  { name: "Classic", foreground: "#11110f", background: "#ffffff" },
  { name: "TechCraft", foreground: "#ff5c35", background: "#fff7f4" },
  { name: "Ocean", foreground: "#004295", background: "#eef6ff" },
  { name: "Forest", foreground: "#315e2a", background: "#f2f8ef" },
  { name: "Midnight", foreground: "#f7f7f4", background: "#11110f" },
  { name: "Rose", foreground: "#9f2448", background: "#fff2f6" },
];

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(cleaned)) return null;
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function QrDesigner({ value }: { value: string }) {
  const [foreground, setForeground] = useState("#11110f");
  const [background, setBackground] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [level, setLevel] = useState<QrLevel>("M");
  const [size, setSize] = useState(240);
  const [margin, setMargin] = useState(4);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [logoSize, setLogoSize] = useState(48);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const effectiveBackground = transparent ? "transparent" : background;
  const contrast = useMemo(
    () => (transparent ? null : contrastRatio(foreground, background)),
    [foreground, background, transparent],
  );
  const contrastGood = contrast === null || contrast >= 4.5;

  function applyPreset(preset: QrPreset) {
    setForeground(preset.foreground);
    setBackground(preset.background);
    setTransparent(false);
  }

  function resetDesign() {
    setForeground("#11110f");
    setBackground("#ffffff");
    setTransparent(false);
    setLevel("M");
    setSize(240);
    setMargin(4);
    setLogo(null);
    setLogoName("");
    setLogoSize(48);
    setUploadError("");
  }

  function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setUploadError("Use a PNG, JPG, WebP or SVG logo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Keep the logo below 2 MB for a lightweight QR export.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogo(reader.result);
        setLogoName(file.name);
        setLevel("H");
        setUploadError("");
      }
    };
    reader.onerror = () => setUploadError("Could not read this logo file.");
    reader.readAsDataURL(file);
  }

  async function copyDestination() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access varies by browser and origin.
    }
  }

  function serializedSvg() {
    const svg = document.getElementById("linkcraft-qr") as SVGSVGElement | null;
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(size));
    clone.setAttribute("height", String(size));
    return new XMLSerializer().serializeToString(clone);
  }

  function downloadSvg() {
    const source = serializedSvg();
    if (!source) return;
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "linkcraft-qr.svg";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  function downloadPng() {
    const source = serializedSvg();
    if (!source) return;

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const exportSize = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = exportSize;
      canvas.height = exportSize;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      context.drawImage(image, 0, 0, exportSize, exportSize);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = pngUrl;
        anchor.download = "linkcraft-qr.png";
        anchor.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.12fr_.88fr] lg:items-start">
      <div>
        <div className="section-kicker">QR Designer</div>
        <h3 className="tool-heading">Make the QR match the brand.</h3>
        <p className="tool-copy">
          Customize colors, quiet zone, size and logo placement, then export a sharp SVG or high-resolution PNG.
        </p>

        <div className="mt-7">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#777772]">
            <Palette size={15} /> Design presets
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="group flex items-center gap-3 rounded-xl border border-[#deded8] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#bcbcb5]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-black/5" style={{ background: preset.background }}>
                  <span className="h-4 w-4 rounded-[4px]" style={{ background: preset.foreground }} />
                </span>
                <span className="text-xs font-black">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="field-label">QR color</span>
            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d8d8d2] bg-white px-3">
              <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" />
              <span className="text-sm font-semibold uppercase">{foreground}</span>
            </div>
          </label>

          <label className="grid gap-2">
            <span className="field-label">Background</span>
            <div className={`flex min-h-12 items-center gap-3 rounded-xl border border-[#d8d8d2] px-3 ${transparent ? "bg-[linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%),linear-gradient(45deg,#eee_25%,white_25%,white_75%,#eee_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px]" : "bg-white"}`}>
              <input type="color" value={background} disabled={transparent} onChange={(event) => setBackground(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0 disabled:opacity-35" />
              <span className="text-sm font-semibold uppercase">{transparent ? "Transparent" : background}</span>
            </div>
          </label>
        </div>

        <label className="mt-3 flex items-center gap-3 rounded-xl border border-[#deded8] bg-[#fafaf8] px-4 py-3 text-sm font-bold">
          <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-4 w-4 accent-[#11110f]" />
          Transparent background
        </label>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2">
            <span className="field-label">Error correction</span>
            <select value={level} onChange={(event) => setLevel(event.target.value as QrLevel)} className="input-shell">
              <option value="L">Low · 7%</option>
              <option value="M">Medium · 15%</option>
              <option value="Q">Quartile · 25%</option>
              <option value="H">High · 30%</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="field-label">QR size</span>
            <select value={size} onChange={(event) => setSize(Number(event.target.value))} className="input-shell">
              <option value="180">180 px</option>
              <option value="220">220 px</option>
              <option value="240">240 px</option>
              <option value="280">280 px</option>
              <option value="320">320 px</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="field-label">Quiet zone</span>
            <select value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="input-shell">
              <option value="2">Compact · 2</option>
              <option value="4">Standard · 4</option>
              <option value="6">Roomy · 6</option>
              <option value="8">Wide · 8</option>
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-[22px] border border-[#deded8] bg-[#fafaf8] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="field-label">Center logo</div>
              <p className="mt-1 text-xs leading-5 text-[#777772]">PNG, JPG, WebP or SVG · max 2 MB. Adding a logo automatically switches correction to High.</p>
            </div>
            <label className="secondary-action cursor-pointer">
              <ImagePlus size={16} /> {logo ? "Replace logo" : "Add logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogo} className="hidden" />
            </label>
          </div>

          {logo && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-2">
                <span className="field-label">Logo size · {logoSize}px</span>
                <input type="range" min="28" max="72" step="2" value={logoSize} onChange={(event) => setLogoSize(Number(event.target.value))} className="w-full accent-[#11110f]" />
              </label>
              <button type="button" onClick={() => { setLogo(null); setLogoName(""); }} className="secondary-action">
                <Trash2 size={15} /> Remove
              </button>
              <div className="sm:col-span-2 truncate text-[11px] font-semibold text-[#888882]">{logoName}</div>
            </div>
          )}

          {uploadError && <div className="mt-3 text-xs font-semibold text-[#a53419]">{uploadError}</div>}
        </div>

        <div className={`mt-5 flex items-start gap-2 rounded-2xl border p-4 text-xs leading-5 ${contrastGood ? "border-[#c8d9c3] bg-[#f5faf3] text-[#52704c]" : "border-[#ffd0c3] bg-[#fff0eb] text-[#a53419]"}`}>
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          {transparent
            ? "Transparent QR codes depend on the surface behind them. Keep strong light/dark contrast when placing the exported code."
            : contrastGood
              ? `Strong color contrast (${contrast?.toFixed(1)}:1). Standard 4-module quiet zones are safest for scanning.`
              : `Low color contrast (${contrast?.toFixed(1)}:1). Use a darker QR color or lighter background for reliable scanning.`}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={downloadSvg} disabled={!value} className="primary-action"><Download size={16} /> SVG</button>
          <button type="button" onClick={downloadPng} disabled={!value} className="secondary-action"><Download size={16} /> PNG · 1024px</button>
          <button type="button" onClick={copyDestination} disabled={!value} className="secondary-action">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}</button>
          <button type="button" onClick={resetDesign} className="secondary-action"><RotateCcw size={16} /> Reset design</button>
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <div className="rounded-[30px] border border-[#deded8] bg-[#f7f7f4] p-4 shadow-[0_18px_45px_rgba(17,17,15,.06)]">
          <div className="grid min-h-[320px] place-items-center rounded-[24px] bg-white p-6 shadow-sm">
            {value ? (
              <QRCodeSVG
                id="linkcraft-qr"
                value={value}
                size={size}
                level={level}
                marginSize={margin}
                fgColor={foreground}
                bgColor={effectiveBackground}
                title="LinkCraft QR code"
                imageSettings={logo ? { src: logo, width: logoSize, height: logoSize, excavate: true } : undefined}
                className="h-auto max-w-full"
              />
            ) : (
              <div className="text-center">
                <QrCode size={74} className="mx-auto text-[#c8c8c2]" />
                <div className="mt-4 text-sm font-black">Add a valid URL</div>
                <p className="mt-1 text-xs text-[#888882]">Your customized QR preview will appear here.</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8b8b85]">
            <span>Live preview</span>
            <span>{level} · {margin} margin</span>
          </div>
          <div className="mt-3 break-all rounded-xl border border-[#deded8] bg-white px-3 py-2.5 text-[11px] font-semibold leading-5 text-[#696965]">
            {value || "No destination selected"}
          </div>
        </div>
      </div>
    </div>
  );
}
