"use client";

import { Link2, QrCode } from "lucide-react";
import { useMemo, useState } from "react";
import MobileQrDesigner from "@/components/MobileQrDesigner";
import QrDesigner from "@/components/QrDesigner";

function normalizeUrl(value: string) {
  const input = value.trim();
  if (!input) return "";
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

export default function FreeQrTool() {
  const [value, setValue] = useState("");
  const normalized = useMemo(() => {
    const candidate = normalizeUrl(value);
    if (!candidate) return "";
    try {
      return new URL(candidate).toString();
    } catch {
      return "";
    }
  }, [value]);

  return (
    <div className="mt-6 md:mt-8">
      <div className="mb-3 rounded-[20px] border border-[#deded8] bg-white p-3 shadow-sm md:mb-5 md:rounded-[24px] md:p-5">
        <label className="grid gap-2">
          <span className="field-label">Website or link</span>
          <div className="flex items-center gap-3 rounded-xl border border-[#d8d8d2] bg-[#fafaf8] px-3 md:px-4">
            <Link2 size={17} className="shrink-0 text-[#9a9a94]" />
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Paste a website or link"
              className="min-w-0 flex-1 bg-transparent py-3.5 text-sm font-semibold outline-none"
              aria-label="Link to convert into a QR code"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <QrCode size={18} className="text-[#FF5C35]" />
          </div>
        </label>
        <div className="mt-2 flex items-center justify-between gap-3">
          {!normalized && value.trim() ? (
            <p className="text-xs font-semibold text-[#a53419]">Enter a valid website URL.</p>
          ) : (
            <p className="text-[11px] font-semibold text-[#777772] md:hidden">QR preview updates automatically.</p>
          )}
          {normalized && <span className="shrink-0 rounded-full bg-[#e8f5e4] px-2.5 py-1 text-[10px] font-black text-[#417238] md:hidden">Ready</span>}
        </div>
      </div>

      <div className="md:hidden">
        <MobileQrDesigner value={normalized} />
      </div>
      <div className="hidden md:block">
        <QrDesigner value={normalized} />
      </div>
    </div>
  );
}
