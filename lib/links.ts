import { randomBytes } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const RESERVED_CODES = new Set([
  "api",
  "admin",
  "login",
  "signup",
  "shorten",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
]);

export function normalizeDestination(value: string) {
  const input = value.trim();
  if (!input) throw new Error("A destination URL is required.");

  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const parsed = new URL(candidate);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS links are supported.");
  }

  parsed.username = "";
  parsed.password = "";
  return parsed.toString();
}

export function normalizeAlias(value: string) {
  const alias = value.trim().toLowerCase();
  if (!alias) return "";

  if (!/^[a-z0-9_-]{3,32}$/.test(alias)) {
    throw new Error("Custom aliases must be 3–32 characters using letters, numbers, - or _.");
  }

  if (RESERVED_CODES.has(alias)) {
    throw new Error("That alias is reserved by LinkCraft.");
  }

  return alias;
}

export function createRandomCode(length = 7) {
  const bytes = randomBytes(length);
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += ALPHABET[bytes[index] % ALPHABET.length];
  }

  return result;
}

export function getExpiryDate(days: unknown) {
  if (days === undefined || days === null || days === "") return null;

  const parsed = Number(days);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) {
    throw new Error("Expiration must be between 1 and 365 days.");
  }

  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + parsed);
  return expiresAt.toISOString();
}
