"use client";

import { ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const TARGET_BYTES = 220 * 1024;
const HARD_LIMIT_BYTES = 300 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

function canvasToWebp(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("This browser could not compress the image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

async function compressAvatar(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPG, PNG, WebP or other image file.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("The original image must be 5 MB or smaller.");
  }

  const bitmap = await createImageBitmap(file);
  const sourceSize = Math.min(bitmap.width, bitmap.height);
  const sourceX = Math.max(0, (bitmap.width - sourceSize) / 2);
  const sourceY = Math.max(0, (bitmap.height - sourceSize) / 2);

  let smallest: Blob | null = null;

  try {
    for (const dimension of [512, 448, 384, 320]) {
      const canvas = document.createElement("canvas");
      canvas.width = dimension;
      canvas.height = dimension;
      const context = canvas.getContext("2d", { alpha: false });

      if (!context) {
        throw new Error("This browser could not process the image.");
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        bitmap,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        dimension,
        dimension,
      );

      for (const quality of [0.76, 0.66, 0.56, 0.46, 0.38]) {
        const blob = await canvasToWebp(canvas, quality);

        if (!smallest || blob.size < smallest.size) {
          smallest = blob;
        }

        if (blob.size <= TARGET_BYTES) {
          return blob;
        }
      }
    }
  } finally {
    bitmap.close();
  }

  if (smallest && smallest.size <= HARD_LIMIT_BYTES) {
    return smallest;
  }

  throw new Error("This image could not be compressed below 300 KB. Try a simpler or smaller photo.");
}

export function LinkPageAvatarUpload({
  avatarUrl,
  displayName,
  onUploaded,
  onRemove,
}: {
  avatarUrl: string;
  displayName: string;
  onUploaded: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;

    setBusy(true);
    setError("");
    setMessage("Compressing image…");

    try {
      const compressed = await compressAvatar(file);
      setMessage(`Compressed to ${formatBytes(compressed.size)} · uploading…`);

      const formData = new FormData();
      formData.append("avatar", compressed, "avatar.webp");

      const response = await fetch("/api/link-page/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        avatarUrl?: string;
        size?: number;
        error?: string;
      };

      if (!response.ok || !payload.avatarUrl) {
        throw new Error(payload.error || "Unable to upload profile image.");
      }

      onUploaded(payload.avatarUrl);
      setMessage(
        `Uploaded · ${formatBytes(payload.size || compressed.size)} · 512px max WebP`,
      );
    } catch (uploadError) {
      setMessage("");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload profile image.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-[22px] border border-[#deded8] bg-[#fafaf8] p-4 md:p-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/*"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[#deded8] bg-white">
          {avatarUrl ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${avatarUrl.replace(/"/g, "%22")}")` }}
              role="img"
              aria-label={displayName ? `${displayName} profile photo` : "Profile photo"}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[#aaa9a2]">
              <ImagePlus size={24} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-black">Profile photo</div>
          <p className="mt-1 text-xs leading-5 text-[#85857f]">
            JPG, PNG, WebP or AVIF · max 5 MB. LinkCraft crops it square and compresses it to WebP before upload.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-3.5 py-2.5 text-xs font-black text-white disabled:opacity-50"
            >
              {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />}
              {busy ? "Processing…" : avatarUrl ? "Replace photo" : "Choose photo"}
            </button>

            {avatarUrl && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onRemove();
                  setMessage("Photo removed from the page. Save changes to publish.");
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#deded8] bg-white px-3.5 py-2.5 text-xs font-black text-[#7b4b41] disabled:opacity-50"
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>

          {message && <div className="mt-2 text-[10px] font-bold text-[#5f7f58]">{message}</div>}
          {error && <div className="mt-2 text-[10px] font-bold text-[#a53419]">{error}</div>}
        </div>
      </div>
    </div>
  );
}
