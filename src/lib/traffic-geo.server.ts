/**
 * Server-only: resolve visitor country from the real client IP.
 * Never returns or logs the raw IP to callers — only country code/name.
 *
 * Behind Nginx, set:
 *   proxy_set_header X-Real-IP $remote_addr;
 *   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 * Behind Cloudflare, CF-Connecting-IP / CF-IPCountry are preferred.
 */
import { getRequest, getRequestIP } from "@tanstack/react-start/server";
import geoip from "geoip-lite";

export type GeoCountry = { code: string; name: string };

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
  // "1.2.3.4:12345" (rare proxy form)
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

/**
 * Pick the real visitor IP (not the reverse-proxy / CDN edge).
 */
function resolveClientIp(): string {
  // 1) Cloudflare connecting IP (authoritative when CF is in front)
  const cfConnecting = normalizeIp(header("cf-connecting-ip"));
  if (isPublicIp(cfConnecting)) return cfConnecting;

  // 2) Common proxy headers
  const trueClient = normalizeIp(header("true-client-ip"));
  if (isPublicIp(trueClient)) return trueClient;

  const realIp = normalizeIp(header("x-real-ip"));
  if (isPublicIp(realIp)) return realIp;

  // 3) X-Forwarded-For: client is usually the first *public* hop
  const xff = header("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => normalizeIp(p)).filter(Boolean);
    const publicHop = parts.find((p) => isPublicIp(p));
    if (publicHop) return publicHop;
  }

  // 4) Framework helper (may be proxy-local on misconfigured Nginx)
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

function countryFromIp(ip: string): GeoCountry {
  if (!isPublicIp(ip)) return { code: "", name: "Unknown" };
  try {
    const hit = geoip.lookup(ip);
    const code = (hit?.country || "").toUpperCase();
    if (!code || code.length !== 2) return { code: "", name: "Unknown" };
    return { code, name: countryNameFromCode(code) };
  } catch {
    return { code: "", name: "Unknown" };
  }
}

/**
 * Resolve country for the current request.
 * Prefer CF country only when Cloudflare also sent the connecting IP
 * (avoids trusting a stray/spoofed CF-IPCountry that always says US).
 */
export function resolveCountryFromRequest(): GeoCountry {
  const cfConnecting = normalizeIp(header("cf-connecting-ip"));
  if (isPublicIp(cfConnecting)) {
    const cfCountry = (header("cf-ipcountry") || "").toUpperCase();
    if (cfCountry && /^[A-Z]{2}$/.test(cfCountry) && cfCountry !== "XX" && cfCountry !== "T1") {
      return { code: cfCountry, name: countryNameFromCode(cfCountry) };
    }
    return countryFromIp(cfConnecting);
  }

  return countryFromIp(resolveClientIp());
}
