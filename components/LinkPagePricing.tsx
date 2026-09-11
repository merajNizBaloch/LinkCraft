"use client";

import { Check, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const freeFeatures = [
  "1 public Link Page",
  "Unlimited links",
  "Link icons",
  "2 free themes",
  "Shareable LinkCraft URL",
];

const proFeatures = [
  "Everything in Free",
  "6 premium themes",
  "Custom accent color",
  "Remove LinkCraft branding",
  "Feature up to 3 priority links",
  "Custom SEO title & description",
];

const comingSoon = [
  "Advanced click analytics",
  "Scheduled links",
  "Custom domains",
];

export function LinkPagePricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="border-y border-[#deded8] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="section-kicker">Simple pricing</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.055em]">
            Free to start. Pro when your page matters.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#72726c]">
            One Pro plan, two billing choices. No confusing feature tiers.
          </p>
        </div>

        <div className="mx-auto mt-9 flex w-fit items-center rounded-full border border-[#deded8] bg-[#f7f7f4] p-1">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              !yearly ? "bg-white text-[#11110f] shadow-sm" : "text-[#777772]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition ${
              yearly ? "bg-[#11110f] text-white shadow-sm" : "text-[#777772]"
            }`}
          >
            Yearly
            <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] ${
              yearly ? "bg-[#ff5c35] text-white" : "bg-[#fff0eb] text-[#b93617]"
            }`}>
              Save Rs. 589
            </span>
          </button>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
          <div className="rounded-[30px] border border-[#deded8] bg-[#fafaf8] p-7 md:p-8">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8a8a84]">Free</div>
            <div className="mt-4 text-5xl font-black tracking-[-0.06em]">Rs. 0</div>
            <p className="mt-3 text-sm leading-6 text-[#72726c]">
              Build a polished public page and share it anywhere.
            </p>

            <div className="mt-7 grid gap-3">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm font-semibold">
                  <Check size={16} className="text-[#5f9d52]" /> {feature}
                </div>
              ))}
            </div>

            <Link
              href="/link-page/dashboard"
              className="mt-8 flex items-center justify-center rounded-xl border border-[#d8d8d2] bg-white px-4 py-3 text-sm font-black"
            >
              Create free page
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[30px] bg-[#11110f] p-7 text-white shadow-[0_25px_70px_rgba(17,17,15,.18)] md:p-8">
            <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#ff5c35] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em]">
              {yearly ? "Best value" : "Flexible"}
            </div>

            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff9b82]">
              <Crown size={15} /> LinkCraft Pro
            </div>

            <div className="mt-4 flex items-end gap-2">
              <div className="text-5xl font-black tracking-[-0.06em]">
                Rs. {yearly ? "2,999" : "299"}
              </div>
              <div className="pb-1.5 text-sm font-bold text-white/40">
                / {yearly ? "year" : "month"}
              </div>
            </div>

            {yearly && (
              <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/65">
                About 2 months free
              </div>
            )}

            <p className="mt-4 text-sm leading-6 text-white/55">
              Stronger brand control, premium presentation and growth tools for serious pages.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {proFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm font-semibold">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#ff7a59]" /> {feature}
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                <Sparkles size={13} /> Coming next
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {comingSoon.map((feature) => (
                  <span key={feature} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/55">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/link-page/dashboard"
              className="mt-8 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-black text-[#11110f]"
            >
              Start with Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
