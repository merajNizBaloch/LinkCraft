import "server-only";

import { createHash } from "node:crypto";

const LINKCRAFT_AUTH_DOMAIN = "auth.linkcraft.techcraftsolution.com";

export function normalizeLinkCraftEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getLinkCraftAuthEmail(email: string) {
  const normalized = normalizeLinkCraftEmail(email);
  const digest = createHash("sha256").update(`linkcraft:${normalized}`).digest("hex");
  return `lc_${digest.slice(0, 48)}@${LINKCRAFT_AUTH_DOMAIN}`;
}
