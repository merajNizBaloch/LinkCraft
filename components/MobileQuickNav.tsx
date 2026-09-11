"use client";

import Link from "next/link";
import { Home, Link2, QrCode, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/free-qr-code-generator", label: "QR", icon: QrCode },
  { href: "/link-page", label: "Page", icon: UserRound },
  { href: "/shorten", label: "Shorten", icon: Link2 },
] as const;

export default function MobileQuickNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav
        className="fixed inset-x-3 bottom-3 z-[80] grid grid-cols-4 rounded-[22px] border border-black/10 bg-white/95 p-1.5 shadow-[0_14px_45px_rgba(17,17,15,.18)] backdrop-blur-xl md:hidden"
        aria-label="Mobile quick navigation"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[16px] px-1 text-[10px] font-black transition ${
                active
                  ? "bg-[#11110f] text-white"
                  : "text-[#6f6f69] active:bg-[#fff0eb] active:text-[#ff5c35]"
              }`}
            >
              <Icon size={19} className={active ? "text-[#ff6b47]" : ""} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
