"use client";

import { Camera, Check, Copy, ExternalLink, Image as ImageIcon, RefreshCw, Square, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ScannerInstance = {
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
};

function getHttpUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [scanningImage, setScanningImage] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultUrl = useMemo(() => getHttpUrl(result), [result]);

  function stopCamera() {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (video) video.srcObject = null;

    setCameraActive(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    stopCamera();
    setError("");
    setResult("");
    setFileName("");
    setCopied(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera scanning is not supported by this browser. You can still upload a QR image.");
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setError("Camera preview could not be initialized.");
      return;
    }

    try {
      const { default: QrScannerEngine } = await import("qr-scanner");
      const scanner = new QrScannerEngine(
        video,
        (scanResult) => {
          const data = typeof scanResult === "string" ? scanResult : scanResult.data;
          if (!data) return;
          setResult(data);
          setError("");
          scannerRef.current?.stop();
          setCameraActive(false);
        },
        {
          preferredCamera: "environment",
          maxScansPerSecond: 15,
          returnDetailedScanResult: true,
        },
      );

      scannerRef.current = scanner;
      setCameraActive(true);
      await scanner.start();
    } catch (cause) {
      stopCamera();
      const message = cause instanceof Error ? cause.message : "Unable to access the camera.";
      if (/permission|notallowed|denied/i.test(message)) {
        setError("Camera permission was denied. Allow camera access in your browser settings, or upload a QR image instead.");
      } else if (/notfound|device|camera/i.test(message)) {
        setError("No available camera was found. You can upload a QR image instead.");
      } else {
        setError("Could not start the camera. Make sure you are using HTTPS or localhost and that camera access is allowed.");
      }
    }
  }

  async function scanImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    stopCamera();
    setResult("");
    setError("");
    setCopied(false);
    setFileName(file.name);
    setScanningImage(true);

    try {
      const { default: QrScannerEngine } = await import("qr-scanner");
      const scanResult = await QrScannerEngine.scanImage(file, { returnDetailedScanResult: true });
      setResult(typeof scanResult === "string" ? scanResult : scanResult.data);
    } catch {
      setError("No readable QR code was found in that image. Try a sharper image with the whole QR code visible.");
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
      setError("Clipboard access is blocked in this browser. Select the result and copy it manually.");
    }
  }

  function reset() {
    stopCamera();
    setResult("");
    setError("");
    setFileName("");
    setCopied(false);
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[28px] border border-[#d8d8d2] bg-white shadow-[0_24px_70px_rgba(17,17,15,.06)]">
      <div className="grid min-w-0 gap-0 lg:grid-cols-[1.05fr_.95fr]">
        <div className="min-w-0 border-b border-[#e2e2dc] p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="section-kicker">QR Scanner</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] sm:text-3xl">Scan with camera or image.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b6b65]">Point your camera at a QR code, or upload a photo or screenshot containing one.</p>
            </div>
            {(result || error || fileName) && (
              <button type="button" onClick={reset} className="mini-action"><RefreshCw size={14} /> Reset</button>
            )}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-[#11110f]">
            <div className="relative aspect-[4/3] min-h-[240px] w-full bg-[#11110f] sm:aspect-video">
              <video ref={videoRef} className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`} muted playsInline />

              {!cameraActive && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-[#ff7c5c]"><Camera size={25} /></div>
                    <div className="mt-4 text-sm font-black text-white">Camera preview</div>
                    <div className="mt-1 text-xs leading-5 text-white/45">Camera stays off until you tap Start camera.</div>
                  </div>
                </div>
              )}

              {cameraActive && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="relative h-44 w-44 rounded-3xl border-2 border-white/75 shadow-[0_0_0_999px_rgba(0,0,0,.18)] sm:h-52 sm:w-52">
                    <span className="absolute -left-0.5 -top-0.5 h-9 w-9 rounded-tl-3xl border-l-4 border-t-4 border-[#ff5c35]" />
                    <span className="absolute -right-0.5 -top-0.5 h-9 w-9 rounded-tr-3xl border-r-4 border-t-4 border-[#ff5c35]" />
                    <span className="absolute -bottom-0.5 -left-0.5 h-9 w-9 rounded-bl-3xl border-b-4 border-l-4 border-[#ff5c35]" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-9 w-9 rounded-br-3xl border-b-4 border-r-4 border-[#ff5c35]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {!cameraActive ? (
              <button type="button" onClick={startCamera} className="primary-action min-h-12"><Camera size={17} /> Start camera</button>
            ) : (
              <button type="button" onClick={stopCamera} className="primary-action min-h-12"><Square size={16} /> Stop camera</button>
            )}

            <label className={`secondary-action min-h-12 cursor-pointer ${scanningImage ? "pointer-events-none opacity-50" : ""}`}>
              <Upload size={17} /> {scanningImage ? "Scanning image…" : "Upload QR image"}
              <input type="file" accept="image/*" className="sr-only" onChange={scanImage} disabled={scanningImage} />
            </label>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#fafaf8] px-4 py-3 text-[11px] leading-5 text-[#777772]">
            <ImageIcon size={15} className="mt-0.5 shrink-0 text-[#ff5c35]" />
            <span className="min-w-0 break-words">{fileName ? `Selected image: ${fileName}` : "For best results, keep the full QR code visible, well lit and reasonably sharp."}</span>
          </div>
        </div>

        <div className="min-w-0 p-5 sm:p-7">
          <div className="section-kicker">Scan result</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">Decoded content.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6b65]">LinkCraft shows the content first and never opens scanned links automatically.</p>

          {error && (
            <div className="mt-6 break-words rounded-2xl border border-[#ffd0c3] bg-[#fff0eb] p-4 text-sm font-semibold leading-6 text-[#a53419]">{error}</div>
          )}

          {!result && !error && (
            <div className="mt-6 grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#d7d7d0] bg-[#fafaf8] p-6 text-center">
              <div>
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#fff0eb] text-[#ff5c35]"><span className="text-lg font-black leading-none">QR</span></div>
                <div className="mt-3 text-sm font-black">Nothing scanned yet</div>
                <p className="mt-1 text-xs leading-5 text-[#888882]">Use your camera or upload an image to decode its QR content.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6">
              <div className="rounded-2xl border border-[#c8d9c3] bg-[#f5faf3] p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#52704c]"><Check size={14} /> QR code found</div>
                <div className="mt-3 max-h-56 overflow-auto break-all rounded-xl bg-white/70 p-4 text-sm font-semibold leading-6 text-[#22221f]">{result}</div>
                {resultUrl && <div className="mt-3 text-[11px] font-bold text-[#52704c]">Detected as a web link</div>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={copyResult} className="primary-action"><Copy size={16} /> {copied ? "Copied" : "Copy result"}</button>
                {resultUrl && (
                  <a href={resultUrl} target="_blank" rel="noopener noreferrer" className="secondary-action"><ExternalLink size={16} /> Open link</a>
                )}
                <button type="button" onClick={reset} className="secondary-action"><RefreshCw size={16} /> Scan another</button>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-[#deded8] bg-[#fafaf8] p-4 text-xs leading-5 text-[#777772]">
            Camera and uploaded images are processed in your browser. Camera access only begins after you choose Start camera.
          </div>
        </div>
      </div>
    </div>
  );
}
