import {
  ArrowRight,
  BarChart3,
  Crown,
  Link2,
  Palette,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LinkPagePricing } from "@/components/LinkPagePricing";

const steps = [
  {
    icon: UserRound,
    number: "01",
    title: "Create your identity",
    copy: "Choose your username, name, photo and a short bio.",
  },
  {
    icon: Link2,
    number: "02",
    title: "Add your links",
    copy: "Add destinations, choose icons, reorder them and hide anything you do not need.",
  },
  {
    icon: Palette,
    number: "03",
    title: "Make it yours",
    copy: "Pick a theme and preview the page live while you edit.",
  },
  {
    icon: Share2,
    number: "04",
    title: "Publish & share",
    copy: "Copy one public URL and use it on every social profile, QR code or bio.",
  },
];

const proHighlights = [
  ["Premium themes", "Six additional visual styles you can preview before upgrading."],
  ["Custom accent", "Use your own brand color across important page details."],
  ["Featured links", "Highlight up to three priority destinations."],
  ["Branding control", "Remove the LinkCraft footer from your public page."],
  ["SEO controls", "Set a custom search title and description for your page."],
  ["Advanced analytics", "Track views, clicks, CTR, top links, traffic sources and devices."],
];

export default function LinkPageLanding() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#11110f]">
      <header className="sticky top-0 z-50 border-b border-[#deded8] bg-[#f7f7f4]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/linkcraft-mark.svg" alt="" width={40} height={40} priority />
            <div>
              <div className="text-lg font-black tracking-[-0.045em]">
                Link<span className="text-[#ff5c35]">Craft</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7a74]">Link Pages</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-[#deded8] bg-white px-4 py-2 text-xs font-black"
            >
              Sign in
            </Link>
            <Link
              href="/link-page/dashboard"
              className="rounded-full bg-[#11110f] px-4 py-2 text-xs font-black text-white transition hover:bg-[#ff5c35]"
            >
              Create page
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#deded8]">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#ff5c35]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd0c3] bg-[#fff0eb] px-3 py-1.5 text-xs font-black text-[#b93617]">
              <Sparkles size={14} /> One page for everything you share
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-6xl md:text-7xl">
              Your links should feel
              <br />
              <span className="text-[#ff5c35]">like your brand.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-[#666660] md:text-lg">
              Create one clean page for your portfolio, socials, WhatsApp, shop, booking links and anything else people need from you.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/link-page/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#ff5c35]"
              >
                Create your page <ArrowRight size={17} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8d8d2] bg-white px-5 py-3.5 text-sm font-black"
              >
                See how it works
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-[#64645f]">
              <span className="proof-pill"><Zap size={14} /> Free to start</span>
              <span className="proof-pill"><ShieldCheck size={14} /> Secure account</span>
              <span className="proof-pill"><Share2 size={14} /> One shareable URL</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[34px] border border-[#d7d7d1] bg-white p-3 shadow-[0_30px_90px_rgba(17,17,15,.12)]">
              <div className="rounded-[28px] bg-[#171715] p-7 text-center text-white">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#ff5c35] text-2xl font-black">MN</div>
                <h2 className="mt-5 text-2xl font-black">Meraj Niaz</h2>
                <p className="mt-2 text-sm text-white/55">Designer · Developer · TechCraft</p>

                <div className="mt-7 grid gap-3">
                  {[
                    ["Portfolio", false],
                    ["TechCraft", true],
                    ["LinkedIn", false],
                    ["WhatsApp", false],
                  ].map(([label, featured]) => (
                    <div
                      key={label as string}
                      className={`flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-left text-sm font-black text-[#11110f] ${
                        featured ? "ring-2 ring-[#ff5c35]" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {featured && <Star size={14} className="text-[#ff5c35]" fill="currentColor" />}
                        {label as string}
                      </span>
                      <ArrowRight size={16} />
                    </div>
                  ))}
                </div>

                <div className="mt-7 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  Made with LinkCraft
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-[#deded8] bg-white px-4 py-3 shadow-lg md:block">
              <div className="flex items-center gap-2 text-xs font-black"><Share2 size={14} className="text-[#ff5c35]" /> Share anywhere</div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="max-w-2xl">
          <div className="section-kicker">How it works</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.055em]">Four steps. No setup maze.</h2>
          <p className="mt-3 text-sm leading-6 text-[#72726c]">
            The builder now follows the same order you naturally create a page in.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ icon: Icon, number, title, copy }) => (
            <div key={number} className="rounded-[24px] border border-[#deded8] bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0eb] text-[#ff5c35]">
                  <Icon size={20} />
                </div>
                <span className="text-xs font-black text-[#c2c2bc]">{number}</span>
              </div>
              <h3 className="mt-5 text-base font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#72726c]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#deded8] bg-[#11110f] text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#ff9b82]">
                <Crown size={13} /> LinkCraft Pro
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.055em]">Pro should feel like a real upgrade.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
                Pro now combines brand control with measurable performance data you can use immediately.
              </p>
              <a href="#pricing" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#11110f]">
                Compare plans <ArrowRight size={16} />
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {proHighlights.map(([title, copy], index) => (
                <div key={title} className="rounded-[22px] border border-white/10 bg-white/[0.05] p-5">
                  <div className="flex items-center gap-2 text-sm font-black">
                    {index === 5 ? <BarChart3 size={16} className="text-[#ff8060]" /> : <Sparkles size={16} className="text-[#ff8060]" />}
                    {title}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/45">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LinkPagePricing />
    </main>
  );
}
