import {
  ArrowRight,
  BarChart3,
  Check,
  Crown,
  Globe2,
  Link2,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const freeFeatures = [
  "1 public Link Page",
  "Unlimited profile links",
  "Basic themes",
  "Social and business links",
  "Shareable LinkCraft URL",
  "LinkCraft branding",
];

const proFeatures = [
  "Everything in Free",
  "Premium themes",
  "Remove LinkCraft branding",
  "Advanced analytics",
  "Scheduled links",
  "Custom domain support",
];

export default function LinkPageLanding() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#11110f]">
      <header className="sticky top-0 z-50 border-b border-[#deded8] bg-[#f7f7f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
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
            <Link href="/login" className="rounded-full border border-[#deded8] bg-white px-4 py-2 text-xs font-black">
              Sign in
            </Link>
            <Link href="/link-page/dashboard" className="rounded-full bg-[#11110f] px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#ff5c35]">
              Create my page
            </Link>
          </div>
        </div>
      </header>

      <section className="link-grid relative overflow-hidden border-b border-[#deded8]">
        <div className="hero-orb hero-orb-one" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd0c3] bg-[#fff0eb] px-3 py-1.5 text-xs font-black text-[#b93617]">
              <Sparkles size={14} /> New in LinkCraft
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-6xl md:text-7xl">
              Everything you are,
              <br />
              <span className="text-[#ff5c35]">in one link.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#666660] md:text-lg">
              Build a clean personal page for your portfolio, socials, business, WhatsApp and anything else you want people to open.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/link-page/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#ff5c35]">
                Create your Link Page <ArrowRight size={17} />
              </Link>
              <a href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-[#d8d8d2] bg-white px-5 py-3.5 text-sm font-black">
                View plans
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-[#64645f]">
              <span className="proof-pill"><Zap size={14} /> Fast setup</span>
              <span className="proof-pill"><ShieldCheck size={14} /> Secure account</span>
              <span className="proof-pill"><Globe2 size={14} /> Public page</span>
            </div>
          </div>

          <div className="rounded-[34px] border border-[#d7d7d1] bg-white p-3 shadow-[0_30px_90px_rgba(17,17,15,.12)]">
            <div className="rounded-[28px] bg-[#171715] p-7 text-center text-white">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#ff5c35] text-2xl font-black">MN</div>
              <h2 className="mt-5 text-2xl font-black">Meraj Niaz</h2>
              <p className="mt-2 text-sm text-white/55">Designer · Developer · TechCraft</p>
              <div className="mt-7 grid gap-3">
                {["TechCraft", "Portfolio", "LinkedIn", "WhatsApp"].map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-left text-sm font-black text-[#11110f]">
                    <span>{label}</span><ArrowRight size={16} />
                  </div>
                ))}
              </div>
              <div className="mt-7 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                Made with LinkCraft
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            [UserRound, "Your identity", "Add your name, photo, bio and the links that matter."],
            [Palette, "Make it yours", "Choose a theme and give your page a distinct visual style."],
            [BarChart3, "Understand clicks", "Pro analytics will show what your audience actually opens."],
            [Link2, "Built into LinkCraft", "Your bio page sits beside your existing QR and link tools."],
          ].map(([Icon, title, copy]) => {
            const FeatureIcon = Icon as typeof UserRound;
            return (
              <div key={title as string} className="feature-card rounded-[24px] border border-[#deded8] bg-white p-6">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0eb] text-[#ff5c35]"><FeatureIcon size={20} /></div>
                <h3 className="mt-5 text-base font-black">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-[#72726c]">{copy as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="border-y border-[#deded8] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="text-center">
            <div className="section-kicker">Simple pricing</div>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.055em]">Start free. Upgrade when your page grows.</h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="rounded-[30px] border border-[#deded8] bg-[#fafaf8] p-7">
              <div className="text-sm font-black">Free</div>
              <div className="mt-4 text-4xl font-black tracking-[-0.05em]">Rs. 0</div>
              <p className="mt-2 text-sm text-[#72726c]">Everything needed for a polished personal Link Page.</p>
              <div className="mt-7 grid gap-3">
                {freeFeatures.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm font-semibold"><Check size={16} className="text-[#5f9d52]" />{feature}</div>)}
              </div>
              <Link href="/link-page/dashboard" className="mt-8 flex items-center justify-center rounded-xl border border-[#d8d8d2] bg-white px-4 py-3 text-sm font-black">Create free page</Link>
            </div>

            <div className="relative overflow-hidden rounded-[30px] bg-[#11110f] p-7 text-white shadow-[0_25px_70px_rgba(17,17,15,.18)]">
              <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#ff5c35] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em]">Pro</div>
              <div className="flex items-center gap-2 text-sm font-black"><Crown size={17} className="text-[#ff7a59]" /> LinkCraft Pro</div>
              <div className="mt-4 text-4xl font-black tracking-[-0.05em]">Rs. 499<span className="text-base text-white/45"> / month</span></div>
              <p className="mt-2 text-sm text-white/50">For creators, professionals and businesses that want more control.</p>
              <div className="mt-7 grid gap-3">
                {proFeatures.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm font-semibold"><Check size={16} className="text-[#ff7a59]" />{feature}</div>)}
              </div>
              <Link href="/link-page/dashboard" className="mt-8 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-black text-[#11110f]">Start with Free</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
