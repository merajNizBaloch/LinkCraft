"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function SharePageButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-black backdrop-blur transition hover:-translate-y-0.5"
      aria-label="Share this Link Page"
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
