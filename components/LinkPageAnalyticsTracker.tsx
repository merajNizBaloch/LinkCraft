"use client";

import { useEffect } from "react";

export function LinkPageAnalyticsTracker({ username }: { username: string }) {
  useEffect(() => {
    if (!username) return;

    const payload = JSON.stringify({
      username,
      referrer: document.referrer || "",
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/link-page/view", blob);
      return;
    }

    void fetch("/api/link-page/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }, [username]);

  return null;
}
