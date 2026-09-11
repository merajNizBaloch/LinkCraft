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
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LinkPageAnalyticsPanel } from "@/components/LinkPageAnalyticsPanel";
import { LinkPageAvatarUpload } from "@/components/LinkPageAvatarUpload";
import { LinkPageIconGlyph } from "@/components/LinkPageIconGlyph";
import {
  LINK_PAGE_ICONS,
  LINK_PAGE_THEMES,
  LinkPageItem,
  LinkPageProfile,
  LinkPageTheme,
  isPremiumTheme,
} from "@/lib/link-pages";

type Panel = "profile" | "links" | "design" | "analytics" | "pro";

const emptyProfile: LinkPageProfile = {
  username: "",
  displayName: "",
  bio: "",
  avatarUrl: "",
  theme: "minimal",
  accentColor: "#ff5c35",
  seoTitle: "",
  seoDescription: "",
  plan: "free",
  brandingEnabled: true,
  isPublished: true,
  links: [],
};

const panels: { id: Panel; label: string; helper: string }[] = [
  { id: "profile", label: "Profile", helper: "Identity" },
  { id: "links", label: "Links", helper: "Content" },
  { id: "design", label: "Design", helper: "Appearance" },
  { id: "analytics", label: "Analytics", helper: "Performance" },
  { id: "pro", label: "Pro", helper: "Growth" },
];

const proNow = [
  "6 premium themes",
  "Custom accent color",
  "Remove LinkCraft branding",
  "Feature up to 3 important links",
  "Custom SEO title and description",
  "Advanced click analytics",
];

const proNext = [
  "Scheduled links",
  "Custom domains",
];

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
    case "aurora":
      return {
        surface: "bg-gradient-to-br from-[#071b2c] via-[#133f45] to-[#203a24] text-white",
        button: "border border-white/15 bg-white/10 text-white backdrop-blur",
        muted: "text-white/60",
      };
    case "studio":
      return {
        surface: "bg-[#ece9e2] text-[#191816]",
        button: "border border-[#191816] bg-[#f8f6f0] text-[#191816]",
        muted: "text-[#77716a]",
      };
    case "forest":
      return {
        surface: "bg-[#10271e] text-[#f4f4e9]",
        button: "bg-[#e9efdc] text-[#173023]",
        muted: "text-[#bdcbbd]",
      };
    case "sunset":
      return {
        surface: "bg-gradient-to-br from-[#3e1d34] via-[#8e403f] to-[#ef8a56] text-white",
        button: "border border-white/20 bg-white/15 text-white backdrop-blur",
        muted: "text-white/65",
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
  const [activePanel, setActivePanel] = useState<Panel>("links");
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
          setProfile({
            ...emptyProfile,
            ...payload.profile,
            links: (payload.profile.links || []).map((link) => ({
              ...link,
              icon: link.icon || "link",
              isFeatured: link.isFeatured === true,
            })),
          });
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
  const accentColor = /^#[0-9A-Fa-f]{6}$/.test(profile.accentColor)
    ? profile.accentColor
    : "#ff5c35";
  const featuredCount = profile.links.filter((link) => link.isFeatured).length;
  const previewingLockedTheme =
    profile.plan !== "pro" && previewTheme !== null && isPremiumTheme(previewTheme);

  function updateLink(index: number, patch: Partial<LinkPageItem>) {
    setProfile((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link,
      ),
    }));
  }

  function addLink() {
    setProfile((current) => ({
      ...current,
      links: [
        ...current.links,
        {
          title: "New link",
          url: "",
          icon: "link",
          isActive: true,
          isFeatured: false,
        },
      ],
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

  function toggleFeatured(index: number) {
    if (profile.plan !== "pro") {
      setActivePanel("pro");
      setNotice("Featured links are included with LinkCraft Pro.");
      window.setTimeout(() => setNotice(""), 2200);
      return;
    }

    const link = profile.links[index];
    if (!link.isFeatured && featuredCount >= 3) {
      setError("You can feature up to 3 links.");
      window.setTimeout(() => setError(""), 2200);
      return;
    }

    updateLink(index, { isFeatured: !link.isFeatured });
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

      const payload = (await response.json()) as {
        profile?: LinkPageProfile;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save your Link Page.");
      }

      if (payload.profile) {
        setProfile({
          ...emptyProfile,
          ...payload.profile,
          links: (payload.profile.links || []).map((link) => ({
            ...link,
            icon: link.icon || "link",
            isFeatured: link.isFeatured === true,
          })),
        });
      }
      setPreviewTheme(null);
      setNotice("Saved. Your public page is up to date.");
      window.setTimeout(() => setNotice(""), 2400);
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
      <header className="sticky top-0 z-50 border-b border-[#d9d9d3] bg-[#f7f7f4]/94 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/link-page" className="flex min-w-0 items-center gap-3">
            <Image src="/linkcraft-mark.svg" alt="" width={38} height={38} priority />
            <div className="min-w-0">
              <div className="truncate text-lg font-black tracking-[-0.045em]">
                Link<span className="text-[#ff5c35]">Craft</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#85857f]">Link Page</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] sm:inline-flex ${
                profile.plan === "pro"
                  ? "bg-[#11110f] text-white"
                  : "border border-[#d7d7d1] bg-white text-[#686862]"
              }`}
            >
              {profile.plan === "pro" ? "Pro" : "Free"}
            </span>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#ff5c35] disabled:opacity-50"
            >
              {saving ? <Sparkles size={15} className="animate-pulse" /> : <Save size={15} />}
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={signOut}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#d8d8d2] bg-white text-[#6e6e68]"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {(notice || error) && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 px-4">
          <div
            className={`rounded-full px-4 py-2 text-xs font-black shadow-lg ${
              error ? "bg-[#a53419] text-white" : "bg-[#11110f] text-white"
            }`}
          >
            {error || notice}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-6">
        <div className="mb-5 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-2xl border border-[#dcdcd6] bg-white p-2">
            {panels.map((panel, index) => {
              const active = activePanel === panel.id;
              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setActivePanel(panel.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition ${
                    active ? "bg-[#11110f] text-white" : "text-[#6e6e68] hover:bg-[#f5f5f1]"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${
                      active ? "bg-white text-[#11110f]" : "bg-[#f0f0eb] text-[#777772]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-black">{panel.label}</span>
                    <span className={`block text-[9px] font-bold uppercase tracking-[0.12em] ${active ? "text-white/45" : "text-[#aaa9a2]"}`}>
                      {panel.helper}
                    </span>
                  </span>
                  {panel.id === "pro" && <Crown size={14} className={active ? "text-[#ff8b6f]" : "text-[#ff5c35]"} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="min-w-0">
            {activePanel === "profile" && (
              <div className="rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="section-kicker">Step 1</div>
                    <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] md:text-3xl">Set up your identity</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777772]">Choose the name and URL people will recognize when they open your page.</p>
                  </div>
                  <UserRound size={22} className="text-[#aaa9a2]" />
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="field-label">Username</span>
                    <div className="flex items-center overflow-hidden rounded-xl border border-[#d8d8d2] bg-white">
                      <span className="border-r border-[#e2e2dd] bg-[#f6f6f2] px-3 py-3 text-xs font-bold text-[#8a8a84]">/u/</span>
                      <input
                        value={profile.username}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            username: event.target.value.toLowerCase().replace(/\s+/g, "-"),
                          })
                        }
                        className="min-w-0 flex-1 px-3 py-3 text-sm font-bold outline-none"
                        placeholder="yourname"
                      />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="field-label">Display name</span>
                    <input
                      value={profile.displayName}
                      onChange={(event) => setProfile({ ...profile, displayName: event.target.value })}
                      className="input-shell"
                      placeholder="Your name or brand"
                    />
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="field-label">Bio</span>
                    <textarea
                      value={profile.bio}
                      onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                      maxLength={240}
                      rows={4}
                      className="input-shell resize-none py-3"
                      placeholder="What do you do? Keep it short and useful."
                    />
                    <span className="text-right text-[10px] font-bold text-[#aaa9a2]">{profile.bio.length}/240</span>
                  </label>

                  <div className="md:col-span-2">
                    <LinkPageAvatarUpload
                      avatarUrl={profile.avatarUrl}
                      displayName={profile.displayName}
                      onUploaded={(avatarUrl) =>
                        setProfile((current) => ({ ...current, avatarUrl }))
                      }
                      onRemove={() =>
                        setProfile((current) => ({ ...current, avatarUrl: "" }))
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePanel("links")}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3 text-sm font-black text-white"
                >
                  Next: add links <Link2 size={16} />
                </button>
              </div>
            )}

            {activePanel === "links" && (
              <div className="rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="section-kicker">Step 2</div>
                    <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] md:text-3xl">Add what matters</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777772]">Each card is one destination. Pick an icon, paste the URL, then drag with the arrow controls to reorder.</p>
                  </div>
                  <button
                    onClick={addLink}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#ff5c35]"
                  >
                    <Plus size={15} /> Add link
                  </button>
                </div>

                <div className="mt-7 grid gap-3">
                  {profile.links.length === 0 && (
                    <button
                      onClick={addLink}
                      className="rounded-[22px] border border-dashed border-[#cfcfc8] bg-[#fafaf8] px-5 py-12 text-center"
                    >
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0eb] text-[#ff5c35]">
                        <Link2 size={21} />
                      </div>
                      <div className="mt-4 text-sm font-black">Add your first link</div>
                      <div className="mt-1 text-xs text-[#888882]">Portfolio, Instagram, WhatsApp, store, booking page — anything.</div>
                    </button>
                  )}

                  {profile.links.map((link, index) => (
                    <div
                      key={link.id || index}
                      className={`rounded-[22px] border p-4 transition ${
                        link.isActive
                          ? "border-[#deded8] bg-[#fafaf8]"
                          : "border-[#e6e6e1] bg-[#f5f5f2] opacity-65"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-3 text-[#b1b1aa]"><GripVertical size={17} /></div>

                        <div className="min-w-0 flex-1">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                            <div className="grid gap-3">
                              <input
                                value={link.title}
                                onChange={(event) => updateLink(index, { title: event.target.value })}
                                className="w-full bg-transparent text-sm font-black outline-none"
                                placeholder="Link title"
                              />
                              <input
                                value={link.url}
                                onChange={(event) => updateLink(index, { url: event.target.value })}
                                className="w-full rounded-xl border border-[#deded8] bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#11110f]"
                                placeholder="https://…"
                              />
                            </div>

                            <label className="flex items-center gap-2 rounded-xl border border-[#deded8] bg-white px-3 py-2">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f4f4f0] text-[#55554f]">
                                <LinkPageIconGlyph icon={link.icon || "link"} size={16} />
                              </span>
                              <span className="sr-only">Link icon</span>
                              <select
                                value={link.icon || "link"}
                                onChange={(event) =>
                                  updateLink(index, { icon: event.target.value as LinkPageItem["icon"] })
                                }
                                className="min-w-0 flex-1 bg-transparent text-xs font-bold outline-none"
                              >
                                {LINK_PAGE_ICONS.map((icon) => (
                                  <option key={icon.id} value={icon.id}>{icon.name}</option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleFeatured(index)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-black ${
                                  link.isFeatured
                                    ? "bg-[#fff0eb] text-[#b93617]"
                                    : "border border-[#deded8] bg-white text-[#777772]"
                                }`}
                                title={profile.plan === "pro" ? "Feature this link" : "Pro feature"}
                              >
                                <Star size={13} fill={link.isFeatured ? "currentColor" : "none"} />
                                {link.isFeatured ? "Featured" : profile.plan === "pro" ? "Feature" : "Feature · Pro"}
                              </button>

                              <button
                                onClick={() => updateLink(index, { isActive: !link.isActive })}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-black ${
                                  link.isActive
                                    ? "bg-[#f1f8ef] text-[#4f7b47]"
                                    : "border border-[#deded8] bg-white text-[#999992]"
                                }`}
                              >
                                {link.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                                {link.isActive ? "Visible" : "Hidden"}
                              </button>
                            </div>

                            <div className="flex gap-1">
                              <button onClick={() => moveLink(index, -1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg text-[#777772] hover:bg-white disabled:opacity-25" aria-label="Move up"><ArrowUp size={14} /></button>
                              <button onClick={() => moveLink(index, 1)} disabled={index === profile.links.length - 1} className="grid h-8 w-8 place-items-center rounded-lg text-[#777772] hover:bg-white disabled:opacity-25" aria-label="Move down"><ArrowDown size={14} /></button>
                              <button onClick={() => removeLink(index)} className="grid h-8 w-8 place-items-center rounded-lg text-[#a64b37] hover:bg-[#fff0eb]" aria-label="Delete link"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setActivePanel("design")}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3 text-sm font-black text-white"
                >
                  Next: choose design <Palette size={16} />
                </button>
              </div>
            )}

            {activePanel === "design" && (
              <div className="rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="section-kicker">Step 3</div>
                    <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] md:text-3xl">Choose your look</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777772]">Free themes can be applied immediately. Pro themes stay fully previewable before you upgrade.</p>
                  </div>
                  <Palette size={22} className="text-[#aaa9a2]" />
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {LINK_PAGE_THEMES.map((option) => {
                    const locked = option.premium && profile.plan !== "pro";
                    const active = activeTheme === option.id;
                    const sample = themeClasses(option.id);

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
                        className={`relative overflow-hidden rounded-[20px] border p-3 text-left transition hover:-translate-y-0.5 ${
                          active ? "border-[#11110f] ring-2 ring-[#11110f]/5" : "border-[#deded8]"
                        }`}
                      >
                        <div className={`h-24 rounded-[14px] p-3 ${sample.surface}`}>
                          <div className={`mx-auto h-5 w-5 rounded-full ${option.id === "minimal" ? "bg-[#ff5c35]" : "bg-white/70"}`} />
                          <div className={`mx-auto mt-3 h-2 w-14 rounded-full opacity-60 ${option.id === "minimal" || option.id === "studio" ? "bg-[#11110f]" : "bg-white"}`} />
                          <div className={`mx-auto mt-3 h-5 w-full rounded-md ${sample.button}`} />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-xs font-black">{option.name}</span>
                          {locked ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#ff5c35]">
                              Preview <Crown size={12} />
                            </span>
                          ) : active ? <Check size={14} /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {previewingLockedTheme && (
                  <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-[#ffd5c9] bg-[#fff2ed] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-black">Previewing a Pro theme.</span>
                      <span className="ml-1 text-[#7b625a]">You can explore it here, but it will not save on the Free plan.</span>
                    </div>
                    <button type="button" onClick={() => setPreviewTheme(null)} className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-black">Exit preview</button>
                  </div>
                )}

                <div className="mt-6 rounded-[22px] border border-[#deded8] bg-[#fafaf8] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black">
                        Accent color
                        {profile.plan !== "pro" && <span className="rounded-full bg-[#11110f] px-2 py-1 text-[9px] uppercase text-white">Pro</span>}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#85857f]">Used for your avatar, featured links and LinkCraft accent details.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        disabled={profile.plan !== "pro"}
                        onChange={(event) => setProfile({ ...profile, accentColor: event.target.value })}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-[#d8d8d2] bg-white p-1 disabled:cursor-not-allowed disabled:opacity-45"
                      />
                      <input
                        value={profile.accentColor}
                        disabled={profile.plan !== "pro"}
                        onChange={(event) => setProfile({ ...profile, accentColor: event.target.value })}
                        className="w-28 rounded-xl border border-[#d8d8d2] bg-white px-3 py-2.5 text-xs font-black uppercase outline-none disabled:opacity-45"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePanel === "analytics" && (
              <LinkPageAnalyticsPanel plan={profile.plan} />
            )}

            {activePanel === "pro" && (
              <div className="grid gap-5">
                <div className="overflow-hidden rounded-[28px] bg-[#11110f] p-6 text-white md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#ff9b82]">
                        <Crown size={13} /> LinkCraft Pro
                      </div>
                      <h1 className="mt-5 text-3xl font-black tracking-[-0.05em]">
                        {profile.plan === "pro" ? "Your Pro controls" : "Make your page work harder."}
                      </h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
                        Pro adds brand control and stronger presentation now, while analytics and automation arrive next.
                      </p>
                    </div>
                    {profile.plan !== "pro" && (
                      <Link href="/link-page#pricing" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-[#11110f]">
                        See Pro pricing
                      </Link>
                    )}
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {proNow.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-3 text-xs font-bold">
                        <Check size={14} className="text-[#ff8060]" /> {feature}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Coming next</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {proNext.map((feature) => (
                        <span key={feature} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/50">{feature}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7 ${profile.plan !== "pro" ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2">
                    <Search size={18} className="text-[#ff5c35]" />
                    <h2 className="text-lg font-black">SEO & branding</h2>
                  </div>

                  <div className="mt-5 grid gap-5">
                    <label className="grid gap-2">
                      <span className="field-label">Search title</span>
                      <input
                        value={profile.seoTitle}
                        disabled={profile.plan !== "pro"}
                        onChange={(event) => setProfile({ ...profile, seoTitle: event.target.value })}
                        maxLength={70}
                        className="input-shell disabled:cursor-not-allowed"
                        placeholder={profile.displayName || "Your page title"}
                      />
                      <span className="text-right text-[10px] font-bold text-[#aaa9a2]">{profile.seoTitle.length}/70</span>
                    </label>

                    <label className="grid gap-2">
                      <span className="field-label">Search description</span>
                      <textarea
                        value={profile.seoDescription}
                        disabled={profile.plan !== "pro"}
                        onChange={(event) => setProfile({ ...profile, seoDescription: event.target.value })}
                        maxLength={160}
                        rows={3}
                        className="input-shell resize-none py-3 disabled:cursor-not-allowed"
                        placeholder="Describe this page for search results and shared previews."
                      />
                      <span className="text-right text-[10px] font-bold text-[#aaa9a2]">{profile.seoDescription.length}/160</span>
                    </label>

                    <label className="flex items-center justify-between gap-4 rounded-[18px] border border-[#deded8] bg-[#fafaf8] p-4">
                      <div>
                        <div className="text-sm font-black">LinkCraft branding</div>
                        <div className="mt-1 text-xs text-[#85857f]">Pro can hide the “Made with LinkCraft” footer.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.brandingEnabled}
                        disabled={profile.plan !== "pro"}
                        onChange={(event) => setProfile({ ...profile, brandingEnabled: event.target.checked })}
                        className="h-5 w-5 accent-[#ff5c35]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-[82px] lg:self-start">
            <div className="mb-3 rounded-[22px] border border-[#d8d8d2] bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <span className={`h-2 w-2 rounded-full ${profile.isPublished ? "bg-[#5f9d52]" : "bg-[#aaa9a2]"}`} />
                    {profile.isPublished ? "Published" : "Hidden"}
                  </div>
                  <div className="mt-1 truncate text-[10px] font-bold text-[#999992]">
                    {publicUrl || "Choose a username to create your URL"}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[10px] font-black">
                  Live
                  <input
                    type="checkbox"
                    checked={profile.isPublished}
                    onChange={(event) => setProfile({ ...profile, isPublished: event.target.checked })}
                    className="h-4 w-4 accent-[#ff5c35]"
                  />
                </label>
              </div>

              {profile.username && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={copyPublicUrl} className="mini-action justify-center"><Copy size={13} /> {copied ? "Copied" : "Copy"}</button>
                  <button onClick={sharePublicUrl} className="mini-action justify-center"><Share2 size={13} /> Share</button>
                  <Link href={`/u/${profile.username}`} target="_blank" className="mini-action justify-center"><ExternalLink size={13} /> Open</Link>
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-[#d8d8d2] bg-white p-3 shadow-[0_24px_70px_rgba(17,17,15,.08)]">
              <div className={`min-h-[620px] overflow-hidden rounded-[24px] p-6 ${theme.surface}`}>
                <div className="mx-auto max-w-[320px] text-center">
                  {profile.avatarUrl ? (
                    <div
                      className="mx-auto h-24 w-24 rounded-full bg-cover bg-center ring-4 ring-white/20"
                      style={{ backgroundImage: `url("${profile.avatarUrl.replace(/"/g, "%22")}")` }}
                    />
                  ) : (
                    <div
                      className="mx-auto grid h-24 w-24 place-items-center rounded-full text-2xl font-black text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {initials(profile.displayName)}
                    </div>
                  )}

                  <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">{profile.displayName || "Your name"}</h2>
                  {profile.username && <div className={`mt-1 text-[10px] font-black ${theme.muted}`}>@{profile.username}</div>}
                  <p className={`mx-auto mt-2 max-w-[260px] text-sm leading-5 ${theme.muted}`}>
                    {profile.bio || "Your short bio will appear here."}
                  </p>

                  <div className="mt-7 grid gap-3">
                    {profile.links.filter((link) => link.isActive).map((link, index) => (
                      <div
                        key={link.id || index}
                        className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left text-sm font-black shadow-sm ${theme.button}`}
                        style={
                          link.isFeatured
                            ? { boxShadow: `0 0 0 2px ${accentColor}66, 0 10px 28px rgba(0,0,0,.10)` }
                            : undefined
                        }
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <LinkPageIconGlyph
                            icon={link.icon || "link"}
                            size={17}
                            className="shrink-0 opacity-75"
                          />
                          <span className="min-w-0">
                            <span className="block truncate">{link.title || "Untitled link"}</span>
                            {link.isFeatured && (
                              <span className="mt-0.5 block text-[8px] font-black uppercase tracking-[0.12em] opacity-45">Featured</span>
                            )}
                          </span>
                        </span>
                        <ExternalLink size={15} className="ml-3 shrink-0 opacity-55" />
                      </div>
                    ))}

                    {!profile.links.some((link) => link.isActive) && (
                      <div className={`rounded-2xl border border-dashed px-4 py-8 text-xs font-bold ${theme.muted}`}>
                        Your active links will appear here.
                      </div>
                    )}
                  </div>

                  {profile.brandingEnabled && (
                    <div className={`mt-9 text-[9px] font-black uppercase tracking-[0.18em] ${theme.muted}`}>
                      Made with <span style={{ color: accentColor }}>LinkCraft</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
