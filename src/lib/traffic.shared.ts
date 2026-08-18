/**
 * Client-safe traffic types + helpers (no Node/pg).
 */

export const TRAFFIC_SOURCES = [
  "direct",
  "organic",
  "social",
  "referral",
  "paid",
  "email",
  "other",
] as const;

export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

export const TRAFFIC_DEVICES = ["mobile", "desktop", "tablet"] as const;
export type TrafficDevice = (typeof TRAFFIC_DEVICES)[number];

export const TRAFFIC_RANGES = ["7d", "30d", "60d"] as const;
export type TrafficRangeKey = (typeof TRAFFIC_RANGES)[number];

export const SOURCE_LABELS: Record<TrafficSource, string> = {
  direct: "Direct",
  organic: "Organic Search",
  social: "Social",
  referral: "Referral",
  paid: "Paid",
  email: "Email",
  other: "Other",
};

export const DEVICE_LABELS: Record<TrafficDevice, string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  tablet: "Tablet",
};

export function rangeToDays(range: TrafficRangeKey): number {
  if (range === "7d") return 7;
  if (range === "60d") return 60;
  return 30;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatPercent(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 1000) / 10}%`;
}

const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "t.co",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "pinterest.com",
  "reddit.com",
  "whatsapp.com",
  "telegram.org",
  "t.me",
];

const SEARCH_HOSTS = [
  "google.",
  "bing.com",
  "yahoo.",
  "duckduckgo.com",
  "baidu.com",
  "yandex.",
  "ecosia.org",
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Classify channel from referrer + optional UTM fields. */
export function classifyTrafficSource(input: {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  landingPath?: string;
  /** Current site host (no www) — used to treat same-site refs as direct. */
  currentHost?: string;
}): TrafficSource {
  const medium = (input.utmMedium ?? "").trim().toLowerCase();
  const source = (input.utmSource ?? "").trim().toLowerCase();
  if (medium === "cpc" || medium === "ppc" || medium === "paid" || medium === "ads") return "paid";
  if (medium === "email" || source === "newsletter" || source === "email") return "email";
  if (medium === "social" || SOCIAL_HOSTS.some((h) => source.includes(h.replace(".com", "")))) {
    return "social";
  }

  const ref = (input.referrer ?? "").trim();
  if (!ref) return "direct";
  const host = hostOf(ref);
  if (!host) return "direct";
  if (SEARCH_HOSTS.some((s) => host.includes(s.replace(/\.$/, "")) || host.startsWith(s) || host.includes(s))) {
    return "organic";
  }
  if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith(`.${s}`))) return "social";

  const selfHost =
    (input.currentHost ?? "").replace(/^www\./, "").toLowerCase() ||
    (typeof window !== "undefined"
      ? window.location.hostname.replace(/^www\./, "").toLowerCase()
      : "");
  if (selfHost && host === selfHost) return "direct";
  return "referral";
}

export function detectDevice(ua: string): TrafficDevice {
  const u = ua.toLowerCase();
  if (/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/i.test(u)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(u)) return "mobile";
  return "desktop";
}

export function detectBrowser(ua: string): string {
  const u = ua;
  if (/edg\//i.test(u)) return "Edge";
  if (/opr\/|opera/i.test(u)) return "Opera";
  if (/chrome\//i.test(u) && !/edg\//i.test(u)) return "Chrome";
  if (/safari\//i.test(u) && !/chrome\//i.test(u)) return "Safari";
  if (/firefox\//i.test(u)) return "Firefox";
  if (/msie|trident/i.test(u)) return "IE";
  return "Other";
}

export function countryFromLocale(locale: string | undefined | null): { code: string; name: string } {
  const raw = (locale ?? "").trim();
  const code = (raw.split(/[-_]/)[1] || "").toUpperCase();
  if (!code || code.length !== 2) return { code: "", name: "Unknown" };
  try {
    const name =
      typeof Intl !== "undefined" && "DisplayNames" in Intl
        ? new Intl.DisplayNames([raw.split(/[-_]/)[0] || "en"], { type: "region" }).of(code)
        : code;
    return { code, name: name || code };
  } catch {
    return { code, name: code };
  }
}
