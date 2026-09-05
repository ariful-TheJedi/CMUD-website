/**
 * Server-only: resolve visitor country from the real client IP.
 * Never returns or logs the raw IP to callers — only country code/name.
 *
 * No geoip-lite dependency (unavailable on some npm mirrors).
 * Resolution order:
 *   1) Cloudflare CF-IPCountry (when CF-Connecting-IP is present)
 *   2) HTTPS lookup via ipwho.is (cached in-memory)
 *
 * Behind Nginx, set:
 *   proxy_set_header X-Real-IP $remote_addr;
 *   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 */
import { getRequest, getRequestIP } from "@tanstack/react-start/server";

export type GeoCountry = { code: string; name: string };

const UNKNOWN: GeoCountry = { code: "", name: "Unknown" };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ipCountryCache = new Map<string, { at: number; value: GeoCountry }>();

function countryNameFromCode(code: string): string {
  try {
    if (typeof Intl !== "undefined" && "DisplayNames" in Intl) {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
    }
  } catch {
    /* ignore */
  }
  return code;
}

function normalizeIp(raw: string | null | undefined): string {
  let ip = (raw ?? "").trim();
  if (!ip) return "";
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  if (ip.toLowerCase().startsWith("::ffff:")) ip = ip.slice(7);
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.split(":")[0]!;
  return ip;
}

function isPrivateOrLocal(ip: string): boolean {
  const v = normalizeIp(ip);
  if (!v) return true;
  if (v === "localhost" || v === "::1") return true;
  if (v.startsWith("127.")) return true;
  if (v.startsWith("10.")) return true;
  if (v.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  if (v.toLowerCase().startsWith("fc") || v.toLowerCase().startsWith("fd")) return true;
  if (v.toLowerCase().startsWith("fe80")) return true;
  return false;
}

function isPublicIp(ip: string): boolean {
  const v = normalizeIp(ip);
  return !!v && !isPrivateOrLocal(v);
}

function header(name: string): string {
  try {
    return getRequest()?.headers?.get(name)?.trim() || "";
  } catch {
    return "";
  }
}

/** Pick the real visitor IP (not the reverse-proxy / CDN edge). */
function resolveClientIp(): string {
  const cfConnecting = normalizeIp(header("cf-connecting-ip"));
  if (isPublicIp(cfConnecting)) return cfConnecting;

  const trueClient = normalizeIp(header("true-client-ip"));
  if (isPublicIp(trueClient)) return trueClient;

  const realIp = normalizeIp(header("x-real-ip"));
  if (isPublicIp(realIp)) return realIp;

  const xff = header("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => normalizeIp(p)).filter(Boolean);
    const publicHop = parts.find((p) => isPublicIp(p));
    if (publicHop) return publicHop;
  }

  try {
    const viaFw = normalizeIp(getRequestIP({ xForwardedFor: true }));
    if (isPublicIp(viaFw)) return viaFw;
    const direct = normalizeIp(getRequestIP());
    if (isPublicIp(direct)) return direct;
  } catch {
    /* no request context */
  }

  return "";
}

async function countryFromIpApi(ip: string): Promise<GeoCountry> {
  if (!isPublicIp(ip)) return UNKNOWN;

  const cached = ipCountryCache.get(ip);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return UNKNOWN;
    const json = (await res.json()) as {
      success?: boolean;
      country_code?: string;
      country?: string;
    };
    if (json.success === false) return UNKNOWN;
    const code = (json.country_code || "").toUpperCase();
    if (!code || code.length !== 2) return UNKNOWN;
    const value: GeoCountry = {
      code,
      name: (json.country || countryNameFromCode(code)).trim() || code,
    };
    ipCountryCache.set(ip, { at: Date.now(), value });
    return value;
  } catch {
    return UNKNOWN;
  }
}

/**
 * Resolve country for the current request.
 * Prefer CF country only when Cloudflare also sent the connecting IP.
 */
export async function resolveCountryFromRequest(): Promise<GeoCountry> {
  const cfConnecting = normalizeIp(header("cf-connecting-ip"));
  if (isPublicIp(cfConnecting)) {
    const cfCountry = (header("cf-ipcountry") || "").toUpperCase();
    if (cfCountry && /^[A-Z]{2}$/.test(cfCountry) && cfCountry !== "XX" && cfCountry !== "T1") {
      return { code: cfCountry, name: countryNameFromCode(cfCountry) };
    }
    return countryFromIpApi(cfConnecting);
  }

  return countryFromIpApi(resolveClientIp());
}
