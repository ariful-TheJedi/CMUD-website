/**
 * Traffic collection + analytics server functions.
 * Retention target: ~60 days (cleanup via `npm run traffic:cleanup`).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/require-auth";
import { assertStaffRead } from "@/lib/admin-guards";
import { pool } from "@/lib/db";
import { asIso } from "@/lib/db-helpers";
import {
  TRAFFIC_SOURCES,
  classifyTrafficSource,
  detectBrowser,
  detectDevice,
  formatDuration,
  isBotUserAgent,
  rangeToDays,
  type TrafficDevice,
  type TrafficRangeKey,
  type TrafficSource,
} from "@/lib/traffic.shared";

export type TrackPageViewInput = {
  sessionId: string;
  visitorId: string;
  path: string;
  pageTitle?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  locale?: string;
  userAgent?: string;
  /** Hostname without www — for same-site referrer classification. */
  currentHost?: string;
};

export type TrackDurationInput = {
  eventId: string;
  durationMs: number;
};

export type TrafficSeriesPoint = { date: string; visitors: number; pageViews: number };
export type TrafficSourceRow = { source: TrafficSource; visitors: number; pageViews: number; percent: number };
export type TrafficPageRow = {
  path: string;
  title: string;
  pageViews: number;
  uniqueVisitors: number;
};
export type TrafficDeviceRow = { device: TrafficDevice; visitors: number; percent: number };
export type TrafficCountryRow = { country: string; countryCode: string; visitors: number; percent: number };
export type TrafficRecentVisit = {
  id: string;
  visitedAt: string;
  country: string;
  device: string;
  browser: string;
  path: string;
  pageTitle: string;
  source: string;
};

export type TrafficDashboardData = {
  range: TrafficRangeKey;
  from: string;
  to: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  avgSessionDurationMs: number;
  avgSessionDurationLabel: string;
  prevAvgSessionDurationMs: number;
  avgDurationChangePct: number | null;
  series: TrafficSeriesPoint[];
  sources: TrafficSourceRow[];
  topPages: TrafficPageRow[];
  devices: TrafficDeviceRow[];
  countries: TrafficCountryRow[];
  recentVisits: TrafficRecentVisit[];
  recentTotal: number;
  liveLast5Min: number;
};

export type TrafficSummary = {
  visitors30d: number;
  pageViews30d: number;
  avgSessionDurationLabel: string;
  topSource: string;
  liveLast5Min: number;
};

function clampPath(path: string): string {
  const raw = (path || "/").trim() || "/";
  const noHash = raw.split("#")[0] || "/";
  const noQuery = noHash.split("?")[0] || "/";
  return noQuery.slice(0, 500) || "/";
}

function rangeBounds(range: TrafficRangeKey): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const days = rangeToDays(range);
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const prevTo = new Date(from.getTime());
  const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to, prevFrom, prevTo };
}

let trafficSchemaReady = false;

/** Idempotent — safe if `npm run db:schema` was not run on a host yet. */
async function ensureTrafficSchema(): Promise<void> {
  if (trafficSchemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_traffic_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL DEFAULT 'page_view',
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      path TEXT NOT NULL,
      page_title TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'direct',
      device TEXT NOT NULL DEFAULT 'desktop',
      browser TEXT NOT NULL DEFAULT 'Other',
      country TEXT NOT NULL DEFAULT 'Unknown',
      country_code TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const indexes = [
    `CREATE INDEX IF NOT EXISTS site_traffic_events_created_at_idx ON site_traffic_events (created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_session_id_idx ON site_traffic_events (session_id)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_visitor_id_idx ON site_traffic_events (visitor_id)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_path_idx ON site_traffic_events (path)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_country_idx ON site_traffic_events (country)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_source_idx ON site_traffic_events (source)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_created_source_idx ON site_traffic_events (created_at DESC, source)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_created_path_idx ON site_traffic_events (created_at DESC, path)`,
    `CREATE INDEX IF NOT EXISTS site_traffic_events_type_created_idx ON site_traffic_events (event_type, created_at DESC)`,
  ];
  for (const sql of indexes) {
    await pool.query(sql);
  }
  trafficSchemaReady = true;
}

async function avgSessionDurationMs(from: Date, to: Date): Promise<number> {
  const { rows } = await pool.query<{ avg_ms: string | null }>(
    `SELECT AVG(session_ms)::float AS avg_ms
     FROM (
       SELECT session_id, SUM(GREATEST(duration_ms, 0))::float AS session_ms
       FROM site_traffic_events
       WHERE event_type = 'page_view'
         AND created_at >= $1 AND created_at < $2
       GROUP BY session_id
     ) s`,
    [from.toISOString(), to.toISOString()],
  );
  return Number(rows[0]?.avg_ms ?? 0) || 0;
}

const trackPageViewSchema = z.object({
  sessionId: z.string().min(1).max(120),
  visitorId: z.string().min(1).max(120),
  path: z.string().min(1).max(500),
  pageTitle: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  locale: z.string().max(40).optional(),
  userAgent: z.string().max(500).optional(),
  currentHost: z.string().max(200).optional(),
});

const trackDurationSchema = z.object({
  eventId: z.string().min(1).max(80),
  durationMs: z.number().finite().nonnegative(),
});

type DashboardQuery = {
  range: TrafficRangeKey;
  recentLimit: number;
  recentOffset: number;
};

function normalizeDashboardQuery(
  input: { range?: TrafficRangeKey; recentLimit?: number; recentOffset?: number } | undefined,
): DashboardQuery {
  const range: TrafficRangeKey =
    input?.range === "7d" || input?.range === "60d" || input?.range === "30d" ? input.range : "30d";
  return {
    range,
    recentLimit: Math.min(Math.max(Number(input?.recentLimit) || 20, 5), 50),
    recentOffset: Math.max(Number(input?.recentOffset) || 0, 0),
  };
}

/** Public — record a page view (no PII / no raw IP stored). */
export const trackTrafficPageView = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof trackPageViewSchema>) => trackPageViewSchema.parse(input))
  .handler(async ({ data }): Promise<{ eventId: string }> => {
    await ensureTrafficSchema();
    const sessionId = data.sessionId.trim().slice(0, 80);
    const visitorId = data.visitorId.trim().slice(0, 80);
    const path = clampPath(data.path);
    if (!sessionId || !visitorId || !path) {
      throw new Error("Invalid tracking payload");
    }

    const ua = (data.userAgent || "").slice(0, 500);
    if (isBotUserAgent(ua)) {
      return { eventId: "" };
    }
    const referrer = (data.referrer || "").trim().slice(0, 500);
    const source = classifyTrafficSource({
      referrer,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      landingPath: path,
      currentHost: data.currentHost,
    });
    const device = detectDevice(ua);
    const browser = detectBrowser(ua);
    // Country from request IP on the server (never store/expose raw IP).
    const { resolveCountryFromRequest } = await import("@/lib/traffic-geo.server");
    const { code, name } = resolveCountryFromRequest();

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO site_traffic_events (
         event_type, session_id, visitor_id, path, page_title, referrer,
         source, device, browser, country, country_code, duration_ms
       ) VALUES (
         'page_view', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0
       )
       RETURNING id`,
      [
        sessionId,
        visitorId,
        path,
        (data.pageTitle || "").trim().slice(0, 300),
        referrer,
        source,
        device,
        browser,
        name,
        code,
      ],
    );
    return { eventId: rows[0].id };
  });

/** Public — update time-on-page for an event (heartbeat / unload). */
export const trackTrafficDuration = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof trackDurationSchema>) => trackDurationSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    await ensureTrafficSchema();
    const eventId = data.eventId.trim();
    const durationMs = Math.min(Math.max(0, Math.floor(data.durationMs)), 60 * 60 * 1000);
    if (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId) || durationMs <= 0) return { ok: false };
    await pool.query(
      `UPDATE site_traffic_events
       SET duration_ms = GREATEST(duration_ms, $2)
       WHERE id = $1::uuid AND event_type = 'page_view'`,
      [eventId, durationMs],
    );
    return { ok: true };
  });

/** Same pattern as admissions list — POST + simple inputValidator. */
export const getTrafficDashboard = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: { range?: TrafficRangeKey; recentLimit?: number; recentOffset?: number } | undefined) =>
      normalizeDashboardQuery(input),
  )
  .handler(async ({ data, context }): Promise<TrafficDashboardData> => {
    try {
      // Any signed-in staff can read analytics (sidebar still gated by section perms).
      await assertStaffRead(context);
      await ensureTrafficSchema();
      const { range, recentLimit, recentOffset } = data ?? normalizeDashboardQuery(undefined);
      const { from, to, prevFrom, prevTo } = rangeBounds(range);

      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      const [
        totals,
        avgMs,
        prevAvgMs,
        seriesRes,
        sourcesRes,
        pagesRes,
        devicesRes,
        countriesRes,
        recentRes,
        recentCount,
        liveRes,
      ] = await Promise.all([
        pool.query<{ visitors: string; sessions: string; page_views: string }>(
          `SELECT
             COUNT(DISTINCT visitor_id)::text AS visitors,
             COUNT(DISTINCT session_id)::text AS sessions,
             COUNT(*)::text AS page_views
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2`,
          [fromIso, toIso],
        ),
        avgSessionDurationMs(from, to),
        avgSessionDurationMs(prevFrom, prevTo),
        pool.query<{ day: string; visitors: string; page_views: string }>(
          `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
                  COUNT(DISTINCT visitor_id)::text AS visitors,
                  COUNT(*)::text AS page_views
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2
           GROUP BY 1
           ORDER BY 1 ASC`,
          [fromIso, toIso],
        ),
        pool.query<{ source: string; visitors: string; page_views: string }>(
          `SELECT source,
                  COUNT(DISTINCT visitor_id)::text AS visitors,
                  COUNT(*)::text AS page_views
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2
           GROUP BY source
           ORDER BY COUNT(DISTINCT visitor_id) DESC`,
          [fromIso, toIso],
        ),
        pool.query<{ path: string; title: string; page_views: string; unique_visitors: string }>(
          `SELECT path,
                  COALESCE(MAX(NULLIF(page_title, '')), path) AS title,
                  COUNT(*)::text AS page_views,
                  COUNT(DISTINCT visitor_id)::text AS unique_visitors
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2
           GROUP BY path
           ORDER BY COUNT(*) DESC
           LIMIT 10`,
          [fromIso, toIso],
        ),
        pool.query<{ device: string; visitors: string }>(
          `SELECT device, COUNT(DISTINCT visitor_id)::text AS visitors
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2
           GROUP BY device
           ORDER BY COUNT(DISTINCT visitor_id) DESC`,
          [fromIso, toIso],
        ),
        pool.query<{ country: string; country_code: string; visitors: string }>(
          `SELECT country, country_code, COUNT(DISTINCT visitor_id)::text AS visitors
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2
           GROUP BY country, country_code
           ORDER BY COUNT(DISTINCT visitor_id) DESC
           LIMIT 15`,
          [fromIso, toIso],
        ),
        pool.query<{
          id: string;
          created_at: Date;
          country: string;
          device: string;
          browser: string;
          path: string;
          page_title: string;
          source: string;
        }>(
          `SELECT id, created_at, country, device, browser, path, page_title, source
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4`,
          [fromIso, toIso, recentLimit, recentOffset],
        ),
        pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2`,
          [fromIso, toIso],
        ),
        pool.query<{ count: string }>(
          `SELECT COUNT(DISTINCT visitor_id)::text AS count
           FROM site_traffic_events
           WHERE event_type = 'page_view'
             AND created_at >= now() - interval '5 minutes'`,
        ),
      ]);

      const visitors = Number(totals.rows[0]?.visitors ?? 0);
      const sessions = Number(totals.rows[0]?.sessions ?? 0);
      const pageViews = Number(totals.rows[0]?.page_views ?? 0);

      const avgDurationChangePct =
        prevAvgMs > 0 ? Math.round(((avgMs - prevAvgMs) / prevAvgMs) * 1000) / 10 : null;

      const sourceVisitorTotal = sourcesRes.rows.reduce((n, r) => n + Number(r.visitors), 0) || 1;
      const sources: TrafficSourceRow[] = TRAFFIC_SOURCES.map((source) => {
        const row = sourcesRes.rows.find((r) => r.source === source);
        const v = Number(row?.visitors ?? 0);
        return {
          source,
          visitors: v,
          pageViews: Number(row?.page_views ?? 0),
          percent: Math.round((v / sourceVisitorTotal) * 1000) / 10,
        };
      })
        .filter((r) => r.visitors > 0 || r.pageViews > 0)
        .sort((a, b) => b.visitors - a.visitors);

      for (const row of sourcesRes.rows) {
        if (!TRAFFIC_SOURCES.includes(row.source as TrafficSource)) {
          const v = Number(row.visitors);
          sources.push({
            source: "other",
            visitors: v,
            pageViews: Number(row.page_views),
            percent: Math.round((v / sourceVisitorTotal) * 1000) / 10,
          });
        }
      }

      const deviceTotal = devicesRes.rows.reduce((n, r) => n + Number(r.visitors), 0) || 1;
      const devices: TrafficDeviceRow[] = (["desktop", "mobile", "tablet"] as TrafficDevice[]).map(
        (device) => {
          const row = devicesRes.rows.find((r) => r.device === device);
          const v = Number(row?.visitors ?? 0);
          return { device, visitors: v, percent: Math.round((v / deviceTotal) * 1000) / 10 };
        },
      );

      const countryTotal = countriesRes.rows.reduce((n, r) => n + Number(r.visitors), 0) || 1;

      return {
        range,
        from: fromIso,
        to: toIso,
        visitors,
        sessions,
        pageViews,
        avgSessionDurationMs: avgMs,
        avgSessionDurationLabel: formatDuration(avgMs),
        prevAvgSessionDurationMs: prevAvgMs,
        avgDurationChangePct,
        series: seriesRes.rows.map((r) => ({
          date: String(r.day).slice(0, 10),
          visitors: Number(r.visitors),
          pageViews: Number(r.page_views),
        })),
        sources,
        topPages: pagesRes.rows.map((r) => ({
          path: r.path,
          title: r.title || r.path,
          pageViews: Number(r.page_views),
          uniqueVisitors: Number(r.unique_visitors),
        })),
        devices,
        countries: countriesRes.rows.map((r) => ({
          country: r.country || "Unknown",
          countryCode: r.country_code || "",
          visitors: Number(r.visitors),
          percent: Math.round((Number(r.visitors) / countryTotal) * 1000) / 10,
        })),
        recentVisits: recentRes.rows.map((r) => ({
          id: r.id,
          visitedAt: asIso(r.created_at),
          country: r.country || "Unknown",
          device: r.device,
          browser: r.browser,
          path: r.path,
          pageTitle: r.page_title || r.path,
          source: r.source,
        })),
        recentTotal: Number(recentCount.rows[0]?.count ?? 0),
        liveLast5Min: Number(liveRes.rows[0]?.count ?? 0),
      };
    } catch (err) {
      console.error("[getTrafficDashboard]", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  });

export const getTrafficSummary = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<TrafficSummary> => {
    try {
      await assertStaffRead(context);
      await ensureTrafficSchema();
      const { from, to } = rangeBounds("30d");
      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      const [totals, avgMs, sourceRes, liveRes] = await Promise.all([
        pool.query<{ visitors: string; page_views: string }>(
          `SELECT COUNT(DISTINCT visitor_id)::text AS visitors,
                  COUNT(*)::text AS page_views
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2`,
          [fromIso, toIso],
        ),
        avgSessionDurationMs(from, to),
        pool.query<{ source: string }>(
          `SELECT source
           FROM site_traffic_events
           WHERE event_type = 'page_view' AND created_at >= $1 AND created_at < $2
           GROUP BY source
           ORDER BY COUNT(DISTINCT visitor_id) DESC
           LIMIT 1`,
          [fromIso, toIso],
        ),
        pool.query<{ count: string }>(
          `SELECT COUNT(DISTINCT visitor_id)::text AS count
           FROM site_traffic_events
           WHERE event_type = 'page_view'
             AND created_at >= now() - interval '5 minutes'`,
        ),
      ]);

      const topSource = (sourceRes.rows[0]?.source as TrafficSource) || "direct";
      return {
        visitors30d: Number(totals.rows[0]?.visitors ?? 0),
        pageViews30d: Number(totals.rows[0]?.page_views ?? 0),
        avgSessionDurationLabel: formatDuration(avgMs),
        topSource,
        liveLast5Min: Number(liveRes.rows[0]?.count ?? 0),
      };
    } catch (err) {
      console.error("[getTrafficSummary]", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  });
