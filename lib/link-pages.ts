export const LINK_PAGE_THEMES = [
  { id: "minimal", name: "Minimal", premium: false },
  { id: "coral", name: "Coral", premium: false },
  { id: "midnight", name: "Midnight", premium: true },
  { id: "glass", name: "Glass", premium: true },
] as const;

export type LinkPageTheme = (typeof LINK_PAGE_THEMES)[number]["id"];

export const LINK_PAGE_ICONS = [
  { id: "link", name: "Link" },
  { id: "globe", name: "Website" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "youtube", name: "YouTube" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "twitter", name: "Twitter / X" },
  { id: "github", name: "GitHub" },
  { id: "mail", name: "Email" },
  { id: "phone", name: "Phone" },
  { id: "message", name: "Message" },
  { id: "map-pin", name: "Location" },
  { id: "shopping-bag", name: "Shop" },
  { id: "calendar", name: "Booking" },
  { id: "file-text", name: "Document" },
  { id: "briefcase", name: "Work" },
  { id: "music", name: "Music" },
  { id: "camera", name: "Media" },
] as const;

export type LinkPageIcon = (typeof LINK_PAGE_ICONS)[number]["id"];

export type LinkPageItem = {
  id?: string;
  title: string;
  url: string;
  icon: LinkPageIcon;
  isActive: boolean;
};

export type LinkPageProfile = {
  id?: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  theme: LinkPageTheme;
  plan: "free" | "pro";
  brandingEnabled: boolean;
  isPublished: boolean;
  links: LinkPageItem[];
};

export const RESERVED_LINK_PAGE_USERNAMES = new Set([
  "admin",
  "api",
  "dashboard",
  "free-link-tools",
  "free-qr-code-generator",
  "link-page",
  "login",
  "qr-scanner",
  "shorten",
  "signup",
  "techcraft",
  "u",
]);

export function normalizeLinkPageUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function isValidLinkPageUsername(value: string) {
  return /^[a-z0-9][a-z0-9_-]{2,29}$/.test(value) && !RESERVED_LINK_PAGE_USERNAMES.has(value);
}

export function normalizePublicLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(normalized);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS links are supported.");
  }

  return parsed.toString();
}

export function isPremiumTheme(theme: LinkPageTheme) {
  return LINK_PAGE_THEMES.some((item) => item.id === theme && item.premium);
}

export function isValidLinkPageIcon(value: string): value is LinkPageIcon {
  return LINK_PAGE_ICONS.some((item) => item.id === value);
}
