import { pool } from "@/lib/db";

/** Ensure Postgres text[] / JSON array columns become string[]. */
export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v ?? "")).filter((s) => s.length >= 0);
  if (value == null) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v ?? ""));
    } catch {
      /* not JSON */
    }
    // Postgres array literal: {a,b,"c d"}
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const inner = trimmed.slice(1, -1);
      if (!inner) return [];
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," && !inQuotes) {
          out.push(cur);
          cur = "";
          continue;
        }
        cur += ch;
      }
      out.push(cur);
      return out.map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return [];
}

/** Ensure JSONB / JSON columns become objects. */
export function parseJsonObject<T extends Record<string, unknown>>(
  value: unknown,
  fallback: T,
): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

/** Parse json_agg / jsonb results into arrays. */
export function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      /* ignore */
    }
  }
  return [];
}

export function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

/** Run a pool query; log failures with the calling function name. */
export async function dbQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  functionName: string,
  text: string,
  params?: unknown[],
) {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error(`DB Error in ${functionName}:`, error);
    throw error;
  }
}
