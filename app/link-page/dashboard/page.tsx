"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Link2,
  LogOut,
  Palette,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LinkPageIconGlyph } from "@/components/LinkPageIconGlyph";
import {
  LINK_PAGE_ICONS,
  LINK_PAGE_THEMES,
  LinkPageItem,
  LinkPageProfile,
  LinkPageTheme,
  isPremiumTheme,
} from "@/lib/link-pages";

const emptyProfile: LinkPageProfile = {
  username: "",
  displayName: "",
  bio: "",
  avatarUrl: "",
  theme: "minimal",
  plan: "free",
  brandingEnabled: true,
  isPublished: true,
  links: [],
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LC"
  );
}

function themeClasses(theme: LinkPageTheme) {
  switch (theme) {
    case "coral":
      return {
        surface: "bg-[#ffefe9] text-[#251713]",
        button: "bg-[#ff5c35] text-white",
        muted: "text-[#805d52]",
      };
    case "midnight":
      return {
        surface: "bg-[#101014] text-white",
        button: "bg-white text-[#101014]",
        muted: "text-white/50",
      };
    case "glass":
      return {
        surface: "bg-gradient-to-br from-[#1c2535] via-[#31233d] to-[#703f45] text-white",
        button: "border border-white/20 bg-white/10 text-white backdrop-blur",
        muted: "text-white/55",
      };
    default:
      return {
        surface: "bg-[#f7f7f4] text-[#11110f]",
        button: "border border-[#d8d8d2] bg-white text-[#11110f]",
        muted: "text-[#777772]",
      };
  }
}

export default function LinkPageDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<LinkPageProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<LinkPageTheme | null>(null);

  const publicUrl = profile.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${profile.username}`
    : "";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
        if (sessionResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/link-page", { cache: "no-store" });
        const payload = (await response.json()) as { profile?: LinkPageProfile; error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load your Link Page.");
        }

        if (!cancelled && payload.profile) {
          setProfile(payload.profile);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load your Link Page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const activeTheme = previewTheme ?? profile.theme;
  const theme = useMemo(() => themeClasses(activeTheme), [activeTheme]);
  const previewingLockedTheme =
    profile.plan !== "pro" && previewTheme !== null && isPremiumTheme(previewTheme);

  function updateLink(index: number, patch: Partial<LinkPageItem>) {
    setProfile((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) => (linkIndex === index ? { ...link, ...patch } : link)),
    }));
  }

  function addLink() {
    setProfile((current) => ({
      ...current,
      links: [...current.links, { title: "New link", url: "", icon: "link", isActive: true }],
    }));
  }

  function removeLink(index: number) {
    setProfile((current) => ({
      ...current,
      links: current.links.filter((_, linkIndex) => linkIndex !== index),
    }));
  }

  function moveLink(index: number, direction: -1 | 1) {
    setProfile((current) => {
      const next = [...current.links];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, links: next };
    });
  }

  async function save() {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      let response = await fetch("/api/link-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.status === 401) {
        await fetch("/api/auth/session", { cache: "no-store" });
        response = await fetch("/api/link-page", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
      }

      const payload = (await response.json()) as { profile?: LinkPageProfile; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save your Link Page.");
      }

      if (payload.profile) setProfile(payload.profile);
      setNotice("Saved. Your public page is up to date.");
      window.setTimeout(() => setNotice(""), 2600);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your Link Page.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/link-page";
  }

  async function copyPublicUrl() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function sharePublicUrl() {
    if (!publicUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.displayName || "My LinkCraft Page",
          url: publicUrl,
        });
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      }
    }

    await copyPublicUrl();
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f4] text-[#11110f]">
        <div className="text-center">
          <Image src="/linkcraft-mark.svg" alt="" width={54} height={54} className="mx-auto animate-pulse" />
          <div className="mt-4 text-sm font-black">Opening your Link Page…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f2ee] text-[#11110f]">
      <header className="sticky top-0 z-50 border-b border-[#d9d9d3] bg-[#f7f7f4]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/link-page" className="flex min-w-0 items-center gap-3">
            <Image src="/linkcraft-mark.svg" alt="" width={38} height={38} priority />
            <div className="min-w-0">
              <div className="truncate text-lg font-black tracking-[-0.045em]">Link<span className="text-[#ff5c35]">Craft</span></div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#85857f]">Page Builder</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className={`hidden rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] sm:inline-flex ${profile.plan === "pro" ? "bg-[#11110f] text-white" : "border border-[#d7d7d1] bg-white text-[#686862]"}`}>
              {profile.plan === "pro" ? "Pro" : "Free"}
            </span>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#ff5c35] disabled:opacity-50">
              {saving ? <Sparkles size={15} className="animate-pulse" /> : <Save size={15} />}
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={signOut} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d8d8d2] bg-white text-[#6e6e68]" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {(notice || error) && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 px-4">
          <div className={`rounded-full px-4 py-2 text-xs font-black shadow-lg ${error ? "bg-[#a53419] text-white" : "bg-[#11110f] text-white"}`}>
            {error || notice}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="grid min-w-0 gap-5">
          <div className="rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="section-kicker">Profile</div>
                <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] md:text-3xl">Your public identity</h1>
              </div>
              <UserRound size={22} className="text-[#aaa9a2]" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="field-label">Username</span>
                <div className="flex items-center overflow-hidden rounded-xl border border-[#d8d8d2] bg-white">
                  <span className="border-r border-[#e2e2dd] bg-[#f6f6f2] px-3 py-3 text-xs font-bold text-[#8a8a84]">/u/</span>
                  <input value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase().replace(/\s+/g, "-") })} className="min-w-0 flex-1 px-3 py-3 text-sm font-bold outline-none" placeholder="yourname" />
                </div>
              </label>
              <label className="grid gap-2">
                <span className="field-label">Display name</span>
                <input value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} className="input-shell" placeholder="Your name or brand" />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="field-label">Bio</span>
                <textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} maxLength={240} rows={3} className="input-shell resize-none py-3" placeholder="Tell people what you do." />
                <span className="text-right text-[10px] font-bold text-[#aaa9a2]">{profile.bio.length}/240</span>
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="field-label">Profile image URL</span>
                <input value={profile.avatarUrl} onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })} className="input-shell" placeholder="https://example.com/photo.jpg" />
              </label>
            </div>

            {profile.username && (
              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-[#fafaf8] p-3">
                <div className="min-w-0 flex-1 truncate px-2 text-xs font-bold text-[#64645f]">{publicUrl}</div>
                <button onClick={copyPublicUrl} className="mini-action"><Copy size={14} /> {copied ? "Copied" : "Copy"}</button>
                <button onClick={sharePublicUrl} className="mini-action"><Share2 size={14} /> Share</button>
                <Link href={`/u/${profile.username}`} target="_blank" className="mini-action"><ExternalLink size={14} /> Open</Link>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="section-kicker">Links</div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">What should people open?</h2>
              </div>
              <button onClick={addLink} className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#ff5c35]"><Plus size={15} /> Add link</button>
            </div>

            <div className="mt-6 grid gap-3">
              {profile.links.length === 0 && (
                <button onClick={addLink} className="rounded-[22px] border border-dashed border-[#cfcfc8] bg-[#fafaf8] px-5 py-10 text-center">
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0eb] text-[#ff5c35]"><Link2 size={20} /></div>
                  <div className="mt-4 text-sm font-black">Add your first link</div>
                  <div className="mt-1 text-xs text-[#888882]">Portfolio, Instagram, WhatsApp, store, booking page — anything.</div>
                </button>
              )}

              {profile.links.map((link, index) => (
                <div key={link.id || index} className={`rounded-[22px] border p-4 transition ${link.isActive ? "border-[#deded8] bg-[#fafaf8]" : "border-[#e6e6e1] bg-[#f5f5f2] opacity-65"}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-3 text-[#b1b1aa]"><GripVertical size={17} /></div>
                    <div className="min-w-0 flex-1 grid gap-3">
                      <input value={link.title} onChange={(event) => updateLink(index, { title: event.target.value })} className="w-full bg-transparent text-sm font-black outline-none" placeholder="Link title" />
                      <input value={link.url} onChange={(event) => updateLink(index, { url: event.target.value })} className="w-full rounded-xl border border-[#deded8] bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#11110f]" placeholder="https://…" />
                      <label className="flex items-center gap-2 rounded-xl border border-[#deded8] bg-white px-3 py-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f4f4f0] text-[#55554f]">
                          <LinkPageIconGlyph icon={link.icon || "link"} size={16} />
                        </span>
                        <span className="sr-only">Link icon</span>
                        <select
                          value={link.icon || "link"}
                          onChange={(event) => updateLink(index, { icon: event.target.value as LinkPageItem["icon"] })}
                          className="min-w-0 flex-1 bg-transparent text-xs font-bold outline-none"
                          aria-label={`Icon for ${link.title || "link"}`}
                        >
                          {LINK_PAGE_ICONS.map((icon) => (
                            <option key={icon.id} value={icon.id}>{icon.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button onClick={() => updateLink(index, { isActive: !link.isActive })} className={`grid h-9 w-9 place-items-center rounded-xl border ${link.isActive ? "border-[#cfe3ca] bg-[#f1f8ef] text-[#4f7b47]" : "border-[#deded8] bg-white text-[#999992]"}`} aria-label={link.isActive ? "Hide link" : "Show link"}>
                      {link.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <button onClick={() => moveLink(index, -1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg text-[#777772] hover:bg-white disabled:opacity-25" aria-label="Move up"><ArrowUp size={14} /></button>
                    <button onClick={() => moveLink(index, 1)} disabled={index === profile.links.length - 1} className="grid h-8 w-8 place-items-center rounded-lg text-[#777772] hover:bg-white disabled:opacity-25" aria-label="Move down"><ArrowDown size={14} /></button>
                    <button onClick={() => removeLink(index)} className="grid h-8 w-8 place-items-center rounded-lg text-[#a64b37] hover:bg-[#fff0eb]" aria-label="Delete link"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="section-kicker">Appearance</div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">Choose your look</h2>
              </div>
              <Palette size={22} className="text-[#aaa9a2]" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {LINK_PAGE_THEMES.map((option) => {
                const locked = option.premium && profile.plan !== "pro";
                const active = activeTheme === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (locked) {
                        setPreviewTheme(option.id);
                        return;
                      }
                      setPreviewTheme(null);
                      setProfile({ ...profile, theme: option.id });
                    }}
                    className={`relative overflow-hidden rounded-[20px] border p-3 text-left transition hover:-translate-y-0.5 ${active ? "border-[#11110f] ring-2 ring-[#11110f]/5" : "border-[#deded8]"}`}
                  >
                    <div className={`h-20 rounded-[14px] ${themeClasses(option.id).surface}`}>
                      <div className="flex h-full items-center justify-center">
                        <div className={`h-3 w-14 rounded-full ${option.id === "midnight" || option.id === "glass" ? "bg-white/60" : option.id === "coral" ? "bg-[#ff5c35]" : "bg-[#11110f]"}`} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-black">{option.name}</span>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#ff5c35]">
                          Preview <Crown size={13} />
                        </span>
                      ) : active ? <Check size={14} /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {previewingLockedTheme && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-[#ffd5c9] bg-[#fff2ed] px-4 py-3 text-xs">
                <div>
                  <span className="font-black">Preview only.</span>
                  <span className="ml-1 text-[#7b625a]">This Pro theme is visible in the preview but will not be saved to your Free page.</span>
                </div>
                <button type="button" onClick={() => setPreviewTheme(null)} className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-black">Exit preview</button>
              </div>
            )}

            {profile.plan !== "pro" && (
              <div className="mt-5 flex flex-col gap-4 rounded-[22px] bg-[#11110f] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black"><Crown size={16} className="text-[#ff7654]" /> Unlock LinkCraft Pro</div>
                  <p className="mt-1 text-xs leading-5 text-white/50">Premium themes, advanced analytics, custom domains and branding removal.</p>
                </div>
                <Link href="/link-page#pricing" className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#11110f]">View Pro</Link>
              </div>
            )}

            <label className="mt-5 flex items-center justify-between gap-4 rounded-[20px] border border-[#deded8] bg-[#fafaf8] p-4">
              <div>
                <div className="text-sm font-black">Publish page</div>
                <div className="mt-1 text-xs text-[#85857f]">Turn this off to temporarily hide your public profile.</div>
              </div>
              <input type="checkbox" checked={profile.isPublished} onChange={(event) => setProfile({ ...profile, isPublished: event.target.checked })} className="h-5 w-5 accent-[#ff5c35]" />
            </label>
          </div>
        </section>

        <aside className="lg:sticky lg:top-[82px] lg:self-start">
          <div className="rounded-[30px] border border-[#d8d8d2] bg-white p-3 shadow-[0_24px_70px_rgba(17,17,15,.08)]">
            <div className={`min-h-[650px] overflow-hidden rounded-[24px] p-6 ${theme.surface}`}>
              <div className="mx-auto max-w-[320px] text-center">
                {profile.avatarUrl ? (
                  <div className="mx-auto h-24 w-24 rounded-full bg-cover bg-center ring-4 ring-white/20" style={{ backgroundImage: `url("${profile.avatarUrl.replace(/"/g, "%22")}")` }} />
                ) : (
                  <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#ff5c35] text-2xl font-black text-white">{initials(profile.displayName)}</div>
                )}
                <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">{profile.displayName || "Your name"}</h2>
                <p className={`mx-auto mt-2 max-w-[260px] text-sm leading-5 ${theme.muted}`}>{profile.bio || "Your short bio will appear here."}</p>
                <div className="mt-7 grid gap-3">
                  {profile.links.filter((link) => link.isActive).map((link, index) => (
                    <div key={link.id || index} className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left text-sm font-black shadow-sm ${theme.button}`}>
                      <span className="flex min-w-0 items-center gap-3">
                        <LinkPageIconGlyph icon={link.icon || "link"} size={17} className="shrink-0 opacity-75" />
                        <span className="truncate">{link.title || "Untitled link"}</span>
                      </span>
                      <ExternalLink size={15} className="ml-3 shrink-0 opacity-55" />
                    </div>
                  ))}
                  {!profile.links.some((link) => link.isActive) && (
                    <div className={`rounded-2xl border border-dashed px-4 py-8 text-xs font-bold ${theme.muted}`}>Your active links will appear here.</div>
                  )}
                </div>
                {profile.brandingEnabled && (
                  <div className={`mt-9 text-[9px] font-black uppercase tracking-[0.18em] ${theme.muted}`}>Made with LinkCraft</div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
