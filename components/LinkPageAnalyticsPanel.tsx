"use client";

import {
  BarChart3,
  Crown,
  Eye,
  Link2,
  MousePointerClick,
  Smartphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DailyPoint = {
  day: string;
  views: number;
  clicks: number;
};

type RankedItem = {
  title?: string;
  source?: string;
  device?: string;
  clicks?: number;
  views?: number;
};

type AnalyticsPayload = {
  isPro: boolean;
  rangeDays: number;
  views: number;
  clicks: number;
  ctr: number;
  lifetimeViews: number;
  lifetimeClicks: number;
  lifetimeCtr: number;
  daily: DailyPoint[];
  topLinks: RankedItem[];
  referrers: RankedItem[];
  devices: RankedItem[];
  error?: string;
};

const empty: AnalyticsPayload = {
  isPro: false,
  rangeDays: 7,
  views: 0,
  clicks: 0,
  ctr: 0,
  lifetimeViews: 0,
  lifetimeClicks: 0,
  lifetimeCtr: 0,
  daily: [],
  topLinks: [],
  referrers: [],
  devices: [],
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function percent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function MiniBars({ daily }: { daily: DailyPoint[] }) {
  const max = useMemo(
    () => Math.max(1, ...daily.flatMap((item) => [item.views, item.clicks])),
    [daily],
  );

  if (!daily.length) {
    return (
      <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-[#d8d8d2] text-xs font-bold text-[#999992]">
        Analytics will appear after your page starts getting visits.
      </div>
    );
  }

  return (
    <div className="flex h-44 items-end gap-2 rounded-2xl border border-[#deded8] bg-[#fafaf8] p-4">
      {daily.map((item) => (
        <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end justify-center gap-1">
            <div
              className="w-[38%] rounded-t-md bg-[#11110f]"
              style={{ height: `${Math.max(3, (item.views / max) * 100)}%` }}
              title={`${item.views} views`}
            />
            <div
              className="w-[38%] rounded-t-md bg-[#ff5c35]"
              style={{ height: `${Math.max(3, (item.clicks / max) * 100)}%` }}
              title={`${item.clicks} clicks`}
            />
          </div>
          <div className="truncate text-[9px] font-bold text-[#999992]">
            {new Date(`${item.day}T00:00:00`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedList({
  title,
  items,
  labelKey,
  valueKey,
}: {
  title: string;
  items: RankedItem[];
  labelKey: "title" | "source" | "device";
  valueKey: "clicks" | "views";
}) {
  const max = Math.max(1, ...items.map((item) => Number(item[valueKey] || 0)));

  return (
    <div className="rounded-[22px] border border-[#deded8] bg-white p-5">
      <div className="text-sm font-black">{title}</div>
      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-xl bg-[#fafaf8] px-3 py-4 text-xs font-bold text-[#999992]">
            No data yet.
          </div>
        ) : (
          items.map((item, index) => {
            const value = Number(item[valueKey] || 0);
            const label = String(item[labelKey] || "Unknown");

            return (
              <div key={`${label}-${index}`}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-bold">{label}</span>
                  <span className="shrink-0 font-black">{number(value)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#efefe9]">
                  <div
                    className="h-full rounded-full bg-[#ff5c35]"
                    style={{ width: `${Math.max(5, (value / max) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function LinkPageAnalyticsPanel({ plan }: { plan: "free" | "pro" }) {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<AnalyticsPayload>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/link-page/analytics?days=${range}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AnalyticsPayload;

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load analytics.");
        }

        if (!cancelled) setData({ ...empty, ...payload });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load analytics.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const isPro = plan === "pro" && data.isPro;

  return (
    <div className="grid gap-5">
      <div className="rounded-[28px] border border-[#dcdcd6] bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Analytics</div>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] md:text-3xl">
              See what people actually open.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777772]">
              Page views are privacy-conscious and deduplicated. Link clicks are counted through LinkCraft before visitors continue to the destination.
            </p>
          </div>

          <div className="flex rounded-xl border border-[#deded8] bg-[#f7f7f4] p-1">
            {[7, 30, 90].map((days) => {
              const locked = plan !== "pro" && days !== 7;
              return (
                <button
                  key={days}
                  type="button"
                  disabled={locked}
                  onClick={() => setRange(days as 7 | 30 | 90)}
                  className={`rounded-lg px-3 py-2 text-[10px] font-black transition ${
                    range === days
                      ? "bg-white text-[#11110f] shadow-sm"
                      : "text-[#85857f]"
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  {days}D{locked ? " · Pro" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-[#fff0eb] px-4 py-3 text-xs font-bold text-[#a53419]">
            {error}
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Eye, label: "Page views", value: number(data.views) },
            { icon: MousePointerClick, label: "Link clicks", value: number(data.clicks) },
            { icon: TrendingUp, label: "Click-through rate", value: percent(data.ctr) },
          ].map(({ icon: MetricIcon, label, value }) => (
            <div key={label} className="rounded-[20px] border border-[#deded8] bg-[#fafaf8] p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#8d8d86]">
                <MetricIcon size={14} /> {label}
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.05em]">
                {loading ? "—" : value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-black">Views & clicks</div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-[#888882]">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#11110f]" /> Views</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ff5c35]" /> Clicks</span>
            </div>
          </div>
          <MiniBars daily={data.daily} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#11110f] p-4 text-white">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Lifetime views</div>
            <div className="mt-2 text-2xl font-black">{number(data.lifetimeViews)}</div>
          </div>
          <div className="rounded-2xl bg-[#11110f] p-4 text-white">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Lifetime clicks</div>
            <div className="mt-2 text-2xl font-black">{number(data.lifetimeClicks)}</div>
          </div>
          <div className="rounded-2xl bg-[#11110f] p-4 text-white">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Lifetime CTR</div>
            <div className="mt-2 text-2xl font-black">{percent(data.lifetimeCtr)}</div>
          </div>
        </div>
      </div>

      {isPro ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <RankedList title="Top links" items={data.topLinks} labelKey="title" valueKey="clicks" />
          <RankedList title="Traffic sources" items={data.referrers} labelKey="source" valueKey="views" />
          <RankedList title="Devices" items={data.devices} labelKey="device" valueKey="views" />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-[28px] bg-[#11110f] p-6 text-white md:p-7">
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#ff5c35]/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#ff9b82]">
              <Crown size={13} /> Pro analytics
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">
              Know which links and channels perform best.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Upgrade to unlock 30/90-day reporting, top-link performance, traffic sources and device breakdowns.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Link2, label: "Top links" },
                { icon: BarChart3, label: "Traffic sources" },
                { icon: Smartphone, label: "Device mix" },
              ].map(({ icon: FeatureIcon, label }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <FeatureIcon size={17} className="text-[#ff8060]" />
                  <div className="mt-3 text-sm font-black">{label}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
                    Pro
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/link-page#pricing"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#11110f]"
            >
              <Sparkles size={14} /> View Pro
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
