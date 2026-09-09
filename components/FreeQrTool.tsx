"use client";

import { Link2, QrCode } from "lucide-react";
import { useMemo, useState } from "react";
import QrDesigner from "@/components/QrDesigner";

function normalizeUrl(value: string) {
  const input = value.trim();
  if (!input) return "";
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

export default function FreeQrTool() {
  const [value, setValue] = useState("https://techcraftsolution.com");
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
    <div className="mt-8">
      <div className="mb-5 rounded-[24px] border border-[#deded8] bg-white p-4 shadow-sm md:p-5">
        <label className="grid gap-2">
          <span className="field-label">Website or link</span>
          <div className="flex items-center gap-3 rounded-xl border border-[#d8d8d2] bg-[#fafaf8] px-4">
            <Link2 size={17} className="shrink-0 text-[#9a9a94]" />
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https://example.com"
              className="min-w-0 flex-1 bg-transparent py-3.5 text-sm font-semibold outline-none"
              aria-label="Link to convert into a QR code"
            />
            <QrCode size={18} className="text-[#FF5C35]" />
          </div>
        </label>
        {!normalized && value.trim() && <p className="mt-2 text-xs font-semibold text-[#a53419]">Enter a valid website URL.</p>}
      </div>
      <QrDesigner value={normalized} />
    </div>
  );
}
