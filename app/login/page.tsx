"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string; needsConfirmation?: boolean; message?: string };

      if (!response.ok) {
        setError(payload.error || "Unable to continue.");
        return;
      }

      if (payload.needsConfirmation) {
        setMessage(payload.message || "Check your email to confirm your account.");
        return;
      }

      window.location.href = "/link-page/dashboard";
    } catch {
      setError("LinkCraft could not reach the account service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#11110f] md:grid md:place-items-center">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/link-page" className="mb-6 inline-flex items-center gap-2 text-xs font-black text-[#686862]">
          <ArrowLeft size={15} /> Back to Link Pages
        </Link>

        <div className="grid overflow-hidden rounded-[34px] border border-[#d9d9d3] bg-white shadow-[0_30px_90px_rgba(17,17,15,.1)] lg:grid-cols-[.92fr_1.08fr]">
          <section className="bg-[#11110f] p-8 text-white md:p-10">
            <div className="flex items-center gap-3">
              <Image src="/linkcraft-mark.svg" alt="" width={44} height={44} priority />
              <div>
                <div className="text-xl font-black tracking-[-0.045em]">Link<span className="text-[#ff5c35]">Craft</span></div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Link Pages</div>
              </div>
            </div>
            <div className="mt-14 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white/75"><Sparkles size={14} /> One account for your page</div>
            <h1 className="mt-5 max-w-md text-4xl font-black leading-[.98] tracking-[-0.06em]">Build once. Share one link everywhere.</h1>
            <div className="mt-8 grid gap-4 text-sm text-white/60">
              {["Manage your links from one dashboard", "Preview changes before you publish", "Upgrade to Pro when you need more control"].map((item) => (
                <div key={item} className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#ff7552]" />{item}</div>
              ))}
            </div>
          </section>

          <section className="p-7 md:p-10">
            <div className="flex rounded-2xl bg-[#f3f3ef] p-1">
              {(["login", "signup"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setMode(item); setError(""); setMessage(""); }}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-black capitalize transition ${mode === item ? "bg-white shadow-sm" : "text-[#777772]"}`}
                >
                  {item === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <div className="section-kicker">{mode === "login" ? "Welcome back" : "Start free"}</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{mode === "login" ? "Sign in to LinkCraft." : "Create your LinkCraft account."}</h2>
              <p className="mt-2 text-sm leading-6 text-[#777772]">
                {mode === "login" ? "Open your Link Page dashboard and continue editing." : "The Free plan includes a public page and core customization."}
              </p>
            </div>

            <form onSubmit={submit} className="mt-7 grid gap-4">
              <label className="grid gap-2">
                <span className="field-label">Email</span>
                <div className="flex items-center gap-2 rounded-xl border border-[#d8d8d2] bg-white px-4 focus-within:border-[#11110f]">
                  <Mail size={17} className="text-[#999992]" />
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 min-w-0 flex-1 outline-none" placeholder="you@example.com" />
                </div>
              </label>
              <label className="grid gap-2">
                <span className="field-label">Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-[#d8d8d2] bg-white px-4 focus-within:border-[#11110f]">
                  <LockKeyhole size={17} className="text-[#999992]" />
                  <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 min-w-0 flex-1 outline-none" placeholder="At least 8 characters" />
                </div>
              </label>

              {error && <div className="rounded-xl border border-[#ffd0c3] bg-[#fff0eb] px-4 py-3 text-sm font-semibold text-[#a53419]">{error}</div>}
              {message && <div className="rounded-xl border border-[#cfe3ca] bg-[#f1f8ef] px-4 py-3 text-sm font-semibold text-[#42683b]">{message}</div>}

              <button disabled={busy} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#11110f] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff5c35] disabled:opacity-50">
                {busy ? "Working…" : mode === "login" ? "Sign in" : "Create free account"} <ArrowRight size={17} />
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
