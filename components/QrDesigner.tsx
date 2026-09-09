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
  Sparkles,
  Trash2,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type QrLevel = "L" | "M" | "Q" | "H";
type DotType = "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
type CornerSquareType = "square" | "dot" | "extra-rounded";
type CornerDotType = "square" | "dot";
type ExportExtension = "svg" | "png" | "jpeg";

type QrRenderer = {
  append: (container?: HTMLElement) => void;
  update: (options: Record<string, unknown>) => void;
  getRawData: (extension?: ExportExtension) => Promise<Blob | null>;
};

type QrPreset = {
  name: string;
  foreground: string;
  secondary: string;
  background: string;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  gradient: boolean;
};

const presets: QrPreset[] = [
  { name: "Classic", foreground: "#11110f", secondary: "#11110f", background: "#ffffff", dotType: "square", cornerSquareType: "square", cornerDotType: "square", gradient: false },
  { name: "Soft", foreground: "#11110f", secondary: "#11110f", background: "#ffffff", dotType: "rounded", cornerSquareType: "extra-rounded", cornerDotType: "dot", gradient: false },
  { name: "Dots", foreground: "#004295", secondary: "#002252", background: "#eef6ff", dotType: "dots", cornerSquareType: "dot", cornerDotType: "dot", gradient: true },
  { name: "TechCraft", foreground: "#ff5c35", secondary: "#11110f", background: "#fff7f4", dotType: "classy-rounded", cornerSquareType: "extra-rounded", cornerDotType: "dot", gradient: true },
  { name: "Midnight", foreground: "#ffffff", secondary: "#ff8a6d", background: "#11110f", dotType: "extra-rounded", cornerSquareType: "extra-rounded", cornerDotType: "dot", gradient: true },
  { name: "Editorial", foreground: "#161616", secondary: "#6d6d6d", background: "#f4efe7", dotType: "classy", cornerSquareType: "square", cornerDotType: "square", gradient: true },
];

const dotTypes: { value: DotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "extra-rounded", label: "Bubble" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy round" },
];

const cornerSquareTypes: { value: CornerSquareType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "extra-rounded", label: "Rounded" },
  { value: "dot", label: "Circle" },
];

const cornerDotTypes: { value: CornerDotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Circle" },
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

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export default function QrDesigner({ value }: { value: string }) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QrRenderer | null>(null);

  const [rendererReady, setRendererReady] = useState(false);
  const [foreground, setForeground] = useState("#11110f");
  const [secondary, setSecondary] = useState("#ff5c35");
  const [background, setBackground] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [gradient, setGradient] = useState(false);
  const [gradientRotation, setGradientRotation] = useState(45);
  const [level, setLevel] = useState<QrLevel>("M");
  const [size, setSize] = useState(280);
  const [margin, setMargin] = useState(16);
  const [exportSize, setExportSize] = useState(1024);
  const [dotType, setDotType] = useState<DotType>("rounded");
  const [cornerSquareType, setCornerSquareType] = useState<CornerSquareType>("extra-rounded");
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>("dot");
  const [cornerColor, setCornerColor] = useState("#11110f");
  const [cornerDotColor, setCornerDotColor] = useState("#ff5c35");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [logoSize, setLogoSize] = useState(0.24);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [renderError, setRenderError] = useState("");
  const [exporting, setExporting] = useState<ExportExtension | null>(null);

  const contrast = useMemo(
    () => (transparent ? null : Math.min(contrastRatio(foreground, background), gradient ? contrastRatio(secondary, background) : Infinity)),
    [foreground, secondary, background, transparent, gradient],
  );
  const contrastGood = contrast === null || contrast >= 4.5;

  const rendererOptions = useMemo<Record<string, unknown>>(() => {
    const dotsOptions = gradient
      ? {
          type: dotType,
          gradient: {
            type: "linear",
            rotation: (gradientRotation * Math.PI) / 180,
            colorStops: [
              { offset: 0, color: foreground },
              { offset: 1, color: secondary },
            ],
          },
        }
      : { type: dotType, color: foreground };

    return {
      width: size,
      height: size,
      type: "svg",
      data: value || "https://techcraftsolution.com",
      margin,
      image: logo || undefined,
      qrOptions: { errorCorrectionLevel: level },
      dotsOptions,
      backgroundOptions: { color: transparent ? "transparent" : background },
      cornersSquareOptions: { type: cornerSquareType, color: cornerColor },
      cornersDotOptions: { type: cornerDotType, color: cornerDotColor },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: logoSize,
        margin: 4,
        saveAsBlob: true,
      },
    };
  }, [size, value, margin, logo, level, dotType, foreground, secondary, gradient, gradientRotation, transparent, background, cornerSquareType, cornerColor, cornerDotType, cornerDotColor, logoSize]);

  useEffect(() => {
    let cancelled = false;

    async function createRenderer() {
      try {
        const module = await import("qr-code-styling");
        if (cancelled || !previewRef.current) return;

        previewRef.current.innerHTML = "";
        const QRCodeStyling = module.default;
        const instance = new QRCodeStyling({
          width: size,
          height: size,
          type: "svg",
          data: value || "https://techcraftsolution.com",
        }) as unknown as QrRenderer;
        instance.append(previewRef.current);
        qrRef.current = instance;
        setRendererReady(true);
        setRenderError("");
      } catch {
        setRenderError("The advanced QR renderer could not load. Run npm install after pulling the latest main branch.");
      }
    }

    void createRenderer();
    return () => {
      cancelled = true;
      qrRef.current = null;
    };
    // The renderer is created once and then updated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!rendererReady || !qrRef.current) return;
    qrRef.current.update(rendererOptions);
  }, [rendererReady, rendererOptions]);

  function applyPreset(preset: QrPreset) {
    setForeground(preset.foreground);
    setSecondary(preset.secondary);
    setBackground(preset.background);
    setDotType(preset.dotType);
    setCornerSquareType(preset.cornerSquareType);
    setCornerDotType(preset.cornerDotType);
    setCornerColor(preset.foreground);
    setCornerDotColor(preset.secondary);
    setGradient(preset.gradient);
    setTransparent(false);
  }

  function resetDesign() {
    setForeground("#11110f");
    setSecondary("#ff5c35");
    setBackground("#ffffff");
    setTransparent(false);
    setGradient(false);
    setGradientRotation(45);
    setLevel("M");
    setSize(280);
    setMargin(16);
    setExportSize(1024);
    setDotType("rounded");
    setCornerSquareType("extra-rounded");
    setCornerDotType("dot");
    setCornerColor("#11110f");
    setCornerDotColor("#ff5c35");
    setLogo(null);
    setLogoName("");
    setLogoSize(0.24);
    setUploadError("");
    setRenderError("");
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
      setUploadError("Keep the logo below 2 MB.");
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

  async function download(extension: ExportExtension) {
    if (!value || !qrRef.current || exporting) return;
    setExporting(extension);
    setRenderError("");

    try {
      const exportMargin = Math.max(8, Math.round((margin / size) * exportSize));
      const exportOptions: Record<string, unknown> = {
        ...rendererOptions,
        width: exportSize,
        height: exportSize,
        margin: exportMargin,
        backgroundOptions: {
          color: extension === "jpeg" ? background : transparent ? "transparent" : background,
        },
      };

      qrRef.current.update(exportOptions);
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const raw = await qrRef.current.getRawData(extension);

      if (raw instanceof Blob) {
        const filename = extension === "jpeg" ? "linkcraft-qr.jpg" : `linkcraft-qr.${extension}`;
        triggerDownload(raw, filename);
      } else {
        setRenderError(`Could not create the ${extension === "jpeg" ? "JPG" : extension.toUpperCase()} file.`);
      }
    } catch {
      setRenderError(`Could not export the ${extension === "jpeg" ? "JPG" : extension.toUpperCase()} file.`);
    } finally {
      qrRef.current?.update(rendererOptions);
      setExporting(null);
    }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
      <div>
        <div className="rounded-[26px] bg-[#11110f] p-5 text-white md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8a6d]">Customize QR</div>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">Design the QR before you download it.</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">Choose a pattern, colors, finder-eye shapes, gradient, logo and background. Every change appears in the live preview.</p>
            </div>
            <button type="button" onClick={resetDesign} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/15"><RotateCcw size={14} /> Reset</button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.12em] sm:grid-cols-5">
            {["Pattern", "Colors", "Eyes", "Logo", "Export"].map((item, index) => <div key={item} className="rounded-xl bg-white/7 px-3 py-2.5"><span className="mr-2 text-[#ff8a6d]">0{index + 1}</span>{item}</div>)}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#777772]"><Palette size={15} /> Design presets</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {presets.map((preset) => (
              <button key={preset.name} type="button" onClick={() => applyPreset(preset)} className="group flex items-center gap-3 rounded-xl border border-[#deded8] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#bcbcb5]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-black/5" style={{ background: preset.background }}>
                  <span className={preset.dotType === "dots" ? "h-4 w-4 rounded-full" : preset.dotType.includes("rounded") ? "h-4 w-4 rounded-[5px]" : "h-4 w-4 rounded-[1px]"} style={{ background: preset.foreground }} />
                </span>
                <span className="text-xs font-black">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <section className="mt-6 rounded-[22px] border border-[#deded8] bg-[#fafaf8] p-4 md:p-5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#777772]"><Sparkles size={15} /> 01 · Pattern</div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {dotTypes.map((option) => (
              <button key={option.value} type="button" onClick={() => setDotType(option.value)} className={`rounded-xl border px-3 py-3 text-xs font-black transition ${dotType === option.value ? "border-[#11110f] bg-[#11110f] text-white" : "border-[#deded8] bg-white hover:border-[#bcbcb5]"}`}>{option.label}</button>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[22px] border border-[#deded8] bg-white p-4 md:p-5">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#777772]">02 · Colors & background</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2"><span className="field-label">QR color</span><div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d8d8d2] bg-white px-3"><input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" /><span className="text-sm font-semibold uppercase">{foreground}</span></div></label>
            <label className="grid gap-2"><span className="field-label">Solid / JPG background</span><div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d8d8d2] bg-white px-3"><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" /><span className="text-sm font-semibold uppercase">{background}</span></div></label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-[#deded8] bg-[#fafaf8] px-4 py-3 text-sm font-bold"><input type="checkbox" checked={gradient} onChange={(event) => setGradient(event.target.checked)} className="h-4 w-4 accent-[#11110f]" /> Gradient modules</label>
            <label className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${transparent ? "border-[#11110f] bg-[#11110f] text-white" : "border-[#deded8] bg-[#fafaf8]"}`}><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-4 w-4 accent-[#ff5c35]" /> Transparent PNG / SVG</label>
          </div>
          {gradient && <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className="field-label">Gradient end</span><div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d8d8d2] bg-white px-3"><input type="color" value={secondary} onChange={(event) => setSecondary(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" /><span className="text-sm font-semibold uppercase">{secondary}</span></div></label><label className="grid gap-2"><span className="field-label">Gradient angle · {gradientRotation}°</span><input type="range" min="0" max="360" step="15" value={gradientRotation} onChange={(event) => setGradientRotation(Number(event.target.value))} className="mt-3 w-full accent-[#11110f]" /></label></div>}
        </section>

        <section className="mt-5 rounded-[22px] border border-[#deded8] bg-[#fafaf8] p-4 md:p-5">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#777772]">03 · Finder eyes</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2"><span className="field-label">Outer eye shape</span><select value={cornerSquareType} onChange={(event) => setCornerSquareType(event.target.value as CornerSquareType)} className="input-shell">{cornerSquareTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="grid gap-2"><span className="field-label">Inner eye shape</span><select value={cornerDotType} onChange={(event) => setCornerDotType(event.target.value as CornerDotType)} className="input-shell">{cornerDotTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="grid gap-2"><span className="field-label">Outer eye color</span><div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d8d8d2] bg-white px-3"><input type="color" value={cornerColor} onChange={(event) => setCornerColor(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" /><span className="text-sm font-semibold uppercase">{cornerColor}</span></div></label>
            <label className="grid gap-2"><span className="field-label">Inner eye color</span><div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d8d8d2] bg-white px-3"><input type="color" value={cornerDotColor} onChange={(event) => setCornerDotColor(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" /><span className="text-sm font-semibold uppercase">{cornerDotColor}</span></div></label>
          </div>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2"><span className="field-label">Error correction</span><select value={level} onChange={(event) => setLevel(event.target.value as QrLevel)} className="input-shell"><option value="L">Low · 7%</option><option value="M">Medium · 15%</option><option value="Q">Quartile · 25%</option><option value="H">High · 30%</option></select></label>
          <label className="grid gap-2"><span className="field-label">Preview size</span><select value={size} onChange={(event) => setSize(Number(event.target.value))} className="input-shell"><option value="220">220 px</option><option value="280">280 px</option><option value="320">320 px</option><option value="360">360 px</option></select></label>
          <label className="grid gap-2"><span className="field-label">Quiet zone</span><select value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="input-shell"><option value="8">Compact</option><option value="16">Standard</option><option value="24">Roomy</option><option value="32">Wide</option></select></label>
        </div>

        <section className="mt-6 rounded-[22px] border border-[#deded8] bg-[#fafaf8] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="text-xs font-black uppercase tracking-[0.14em] text-[#777772]">04 · Center logo</div><p className="mt-1 text-xs leading-5 text-[#777772]">PNG, JPG, WebP or SVG · max 2 MB. Logo mode automatically uses High correction.</p></div>
            <label className="secondary-action cursor-pointer"><ImagePlus size={16} /> {logo ? "Replace logo" : "Add logo"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogo} className="hidden" /></label>
          </div>
          {logo && <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="grid gap-2"><span className="field-label">Logo coverage · {Math.round(logoSize * 100)}%</span><input type="range" min="0.14" max="0.34" step="0.02" value={logoSize} onChange={(event) => setLogoSize(Number(event.target.value))} className="w-full accent-[#11110f]" /></label><button type="button" onClick={() => { setLogo(null); setLogoName(""); }} className="secondary-action"><Trash2 size={15} /> Remove</button><div className="sm:col-span-2 truncate text-[11px] font-semibold text-[#888882]">{logoName}</div></div>}
          {uploadError && <div className="mt-3 text-xs font-semibold text-[#a53419]">{uploadError}</div>}
        </section>

        <div className={`mt-5 flex items-start gap-2 rounded-2xl border p-4 text-xs leading-5 ${contrastGood ? "border-[#c8d9c3] bg-[#f5faf3] text-[#52704c]" : "border-[#ffd0c3] bg-[#fff0eb] text-[#a53419]"}`}>
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          {transparent ? "PNG and SVG will export with transparency. JPG cannot store transparency, so JPG will use your selected solid background color." : contrastGood ? `Strong module/background contrast (${contrast?.toFixed(1)}:1). Keep enough quiet space around the exported code.` : `Low contrast (${contrast?.toFixed(1)}:1). Increase the difference between the QR modules and background before publishing.`}
        </div>

        {renderError && <div className="mt-4 rounded-xl border border-[#ffd0c3] bg-[#fff0eb] p-3 text-xs font-semibold text-[#a53419]">{renderError}</div>}
      </div>

      <div className="lg:sticky lg:top-24">
        <div className="rounded-[30px] border border-[#deded8] bg-[#f7f7f4] p-4 shadow-[0_18px_45px_rgba(17,17,15,.06)]">
          <div className="mb-3 flex items-center justify-between px-1"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#777772]">Live preview</div><div className="mt-1 text-sm font-black">{dotTypes.find((item) => item.value === dotType)?.label} · {transparent ? "Transparent" : "Solid"}</div></div><QrCode size={21} className="text-[#ff5c35]" /></div>
          <div className={`grid min-h-[360px] place-items-center overflow-hidden rounded-[24px] p-5 shadow-sm ${transparent ? "bg-[linear-gradient(45deg,#ecece8_25%,transparent_25%,transparent_75%,#ecece8_75%),linear-gradient(45deg,#ecece8_25%,#fff_25%,#fff_75%,#ecece8_75%)] bg-[length:18px_18px] bg-[position:0_0,9px_9px]" : "bg-white"}`}>
            {value ? <div ref={previewRef} className="grid max-w-full place-items-center [&>svg]:h-auto [&>svg]:max-w-full" /> : <div className="text-center"><QrCode size={74} className="mx-auto text-[#c8c8c2]" /><div className="mt-4 text-sm font-black">Add a valid URL</div><p className="mt-1 text-xs text-[#888882]">Your styled QR preview will appear here.</p></div>}
          </div>

          <section className="mt-4 rounded-[20px] border border-[#d8d8d2] bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#777772]">05 · Download QR</div>
            <label className="mt-3 grid gap-2"><span className="field-label">Raster resolution</span><select value={exportSize} onChange={(event) => setExportSize(Number(event.target.value))} className="input-shell"><option value="512">512 × 512</option><option value="1024">1024 × 1024</option><option value="2048">2048 × 2048</option></select></label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button type="button" onClick={() => void download("png")} disabled={!value || !rendererReady || exporting !== null} className="primary-action"><Download size={16} /> {exporting === "png" ? "Creating…" : transparent ? "PNG · transparent" : "PNG"}</button>
              <button type="button" onClick={() => void download("jpeg")} disabled={!value || !rendererReady || exporting !== null} className="secondary-action"><Download size={16} /> {exporting === "jpeg" ? "Creating…" : "JPG · solid"}</button>
              <button type="button" onClick={() => void download("svg")} disabled={!value || !rendererReady || exporting !== null} className="secondary-action"><Download size={16} /> {exporting === "svg" ? "Creating…" : transparent ? "SVG · transparent" : "SVG"}</button>
              <button type="button" onClick={copyDestination} disabled={!value} className="secondary-action">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}</button>
            </div>
            {transparent && <p className="mt-3 text-[11px] leading-5 text-[#777772]">Transparency is preserved in PNG and SVG. JPG always uses <span className="font-black uppercase">{background}</span> because JPEG has no alpha channel.</p>}
          </section>

          <div className="mt-3 break-all rounded-xl border border-[#deded8] bg-white px-3 py-2.5 text-[11px] font-semibold leading-5 text-[#696965]">{value || "No destination selected"}</div>
        </div>
      </div>
    </div>
  );
}
