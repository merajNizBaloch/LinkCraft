"use client";

import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  Flashlight,
  ImagePlus,
  Loader2,
  RotateCcw,
  ScanLine,
  Square,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type ScannerInstance = {
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
  hasFlash: () => Promise<boolean>;
  toggleFlash: () => Promise<void>;
  isFlashOn: () => boolean;
};

function readableCameraError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/notallowed|permission|denied/i.test(message)) {
    return "Camera permission was blocked. Allow camera access in your browser and try again.";
  }
  if (/notfound|device|camera/i.test(message)) {
    return "No usable camera was found on this device.";
  }
  if (/secure|https/i.test(message)) {
    return "Camera scanning requires a secure HTTPS connection.";
  }
  return "The camera could not start. Check camera permission and try again.";
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function QrScannerTool() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<ScannerInstance | null>(null);

  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [flashAvailable, setFlashAvailable] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultIsUrl = useMemo(() => isHttpUrl(result), [result]);

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  function stopCamera() {
    scannerRef.current?.stop();
    setScanning(false);
    setFlashAvailable(false);
    setFlashOn(false);
  }

  async function startCamera() {
    setError("");
    setStartingCamera(true);

    try {
      const { default: QrScanner } = await import("qr-scanner");
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError("No camera is available on this device.");
        return;
      }

      if (!videoRef.current) return;

      scannerRef.current?.destroy();
      scannerRef.current = null;

      const scanner = new QrScanner(
        videoRef.current,
        (scanResult) => {
          const data = scanResult.data.trim();
          if (!data) return;
          setResult(data);
          setError("");
          scanner.stop();
          setScanning(false);
          setFlashAvailable(false);
          setFlashOn(false);
        },
        {
          returnDetailedScanResult: true,
          preferredCamera: "environment",
          maxScansPerSecond: 12,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      ) as unknown as ScannerInstance;

      scannerRef.current = scanner;
      await scanner.start();
      setScanning(true);

      try {
        const canUseFlash = await scanner.hasFlash();
        setFlashAvailable(canUseFlash);
      } catch {
        setFlashAvailable(false);
      }
    } catch (cameraError) {
      setError(readableCameraError(cameraError));
      scannerRef.current?.destroy();
      scannerRef.current = null;
      setScanning(false);
    } finally {
      setStartingCamera(false);
    }
  }

  async function toggleFlash() {
    if (!scannerRef.current || !flashAvailable) return;
    try {
      await scannerRef.current.toggleFlash();
      setFlashOn(scannerRef.current.isFlashOn());
    } catch {
      setError("Flash control is not available in this browser.");
    }
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file containing a QR code.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Use an image smaller than 15 MB.");
      return;
    }

    stopCamera();
    setError("");
    setScanningImage(true);

    try {
      const { default: QrScanner } = await import("qr-scanner");
      const scanResult = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
        alsoTryWithoutScanRegion: true,
      });
      const data = scanResult.data.trim();
      if (!data) throw new Error("No QR content found");
      setResult(data);
    } catch {
      setResult("");
      setError("No readable QR code was found in that image. Try a sharper or larger image.");
    } finally {
      setScanningImage(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  }

  function resetScanner() {
    stopCamera();
    setResult("");
    setError("");
    setCopied(false);
  }

  return (
    <section className="mt-10 rounded-[28px] border border-[#deded8] bg-[#fafaf8] p-4 sm:p-6 md:p-7">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="section-kicker">QR Scanner</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] sm:text-3xl">Scan with camera or upload a QR image.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#696965]">
            Decode QR codes directly in your browser. Camera frames and uploaded images stay on your device.
          </p>
        </div>
        {result && (
          <button type="button" onClick={resetScanner} className="secondary-action w-full sm:w-auto">
            <RotateCcw size={16} /> Scan another
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <div className="overflow-hidden rounded-[24px] border border-[#252522] bg-[#11110f]">
          <div className="relative aspect-[4/3] min-h-[250px] overflow-hidden bg-[#0b0b0a] sm:min-h-[320px]">
            <video
              ref={videoRef}
              className={`h-full w-full object-cover transition-opacity ${scanning ? "opacity-100" : "opacity-20"}`}
              playsInline
              muted
            />

            {!scanning && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#ff7655]">
                    <ScanLine size={28} />
                  </div>
                  <div className="mt-4 text-sm font-black text-white">Camera scanner is ready</div>
                  <div className="mt-2 text-xs leading-5 text-white/45">Tap Start camera and point the rear camera at a QR code.</div>
                </div>
              </div>
            )}

            {scanning && (
              <div className="pointer-events-none absolute inset-x-6 bottom-5 rounded-full border border-white/10 bg-black/55 px-4 py-2 text-center text-[11px] font-bold text-white/75 backdrop-blur">
                Hold the QR code steady inside the scan area
              </div>
            )}
          </div>

          <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2">
            {!scanning ? (
              <button
                type="button"
                onClick={startCamera}
                disabled={startingCamera || scanningImage}
                className="primary-action !bg-white !text-[#11110f] accent-button-hover"
              >
                {startingCamera ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {startingCamera ? "Starting camera…" : "Start camera"}
              </button>
            ) : (
              <button type="button" onClick={stopCamera} className="primary-action !bg-white !text-[#11110f] accent-button-hover">
                <Square size={15} /> Stop camera
              </button>
            )}

            <label className="secondary-action cursor-pointer !border-white/15 !bg-white/5 !text-white accent-button-hover">
              {scanningImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {scanningImage ? "Scanning image…" : "Upload QR image"}
              <input type="file" accept="image/*" className="sr-only" onChange={handleImage} disabled={scanningImage} />
            </label>

            {scanning && flashAvailable && (
              <button type="button" onClick={toggleFlash} className="secondary-action sm:col-span-2 !border-white/15 !bg-white/5 !text-white accent-button-hover">
                <Flashlight size={16} /> {flashOn ? "Turn flash off" : "Turn flash on"}
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-[24px] border border-[#deded8] bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#777772]">
            <Check size={14} className={result ? "text-[#ff5c35]" : "text-[#bdbdb7]"} /> Scan result
          </div>

          {result ? (
            <>
              <div className="mt-4 max-h-52 overflow-auto rounded-2xl border border-[#e4e4df] bg-[#fafaf8] p-4">
                <p className="break-all text-sm font-semibold leading-6 text-[#2f2f2c]">{result}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={copyResult} className="primary-action">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy result"}
                </button>
                {resultIsUrl && (
                  <a href={result} target="_blank" rel="noreferrer" className="secondary-action">
                    <ExternalLink size={16} /> Open link
                  </a>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-[#ffd0c3] bg-[#fff0eb] p-4 text-xs leading-5 text-[#9d351d]">
                QR codes can contain links, text, contact data or other instructions. Only open links you trust.
              </div>
            </>
          ) : (
            <div className="mt-5 grid min-h-56 place-items-center rounded-2xl border border-dashed border-[#d8d8d2] bg-[#fafaf8] p-6 text-center">
              <div>
                <ScanLine size={28} className="mx-auto text-[#b4b4ae]" />
                <p className="mt-3 text-sm font-bold text-[#5f5f59]">Your decoded QR content will appear here.</p>
                <p className="mt-2 text-xs leading-5 text-[#8a8a84]">Use the camera or upload a screenshot/photo containing a QR code.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-[#ffd0c3] bg-[#fff0eb] p-4 text-xs font-semibold leading-5 text-[#a53419]">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
