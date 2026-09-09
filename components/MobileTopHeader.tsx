"use client";

import Image from "next/image";
import Link from "next/link";
import { Grid2X2 } from "lucide-react";

export default function MobileTopHeader() {
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          body > main > header {
            display: none !important;
          }
        }
      `}</style>
      <header className="mobile-global-header sticky top-0 z-[75] border-b border-[#deded8] bg-[#f7f7f4]/95 backdrop-blur-xl md:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="LinkCraft home">
            <Image src="/linkcraft-mark.svg" alt="" width={38} height={38} priority className="h-[38px] w-[38px] shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-[17px] font-black tracking-[-0.045em] text-[#11110f]">
                Link<span className="text-[#ff5c35]">Craft</span>
              </div>
              <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[#8a8a84]">Free link tools</div>
            </div>
          </Link>

          <Link
            href="/free-link-tools"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#deded8] bg-white px-3 py-2.5 text-[11px] font-black text-[#11110f] transition active:scale-[0.98] active:border-[#ff5c35] active:bg-[#fff0eb] active:text-[#ff5c35]"
          >
            <Grid2X2 size={15} />
            All tools
          </Link>
        </div>
      </header>
    </>
  );
}
