/**
 * Traffic collection + analytics server functions.
 * Retention target: ~60 days (cleanup via `npm run traffic:cleanup`).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView } from "@/lib/admin-guards";
import { pool } from "@/lib/db";
import { asIso } from "@/lib/db-helpers";
import {
  TRAFFIC_SOURCES,
  classifyTrafficSource,
  countryFromLocale,
  detectBrowser,
  detectDevice,
  formatDuration,
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

/** Public — record a page view (no PII / no raw IP stored). */
export const trackTrafficPageView = createServerFn({ method: "POST" })
  .inputValidator((input: TrackPageViewInput) => input)
  .handler(async ({ data }): Promise<{ eventId: string }> => {
    const sessionId = (data.sessionId || "").trim().slice(0, 80);
    const visitorId = (data.visitorId || "").trim().slice(0, 80);
    const path = clampPath(data.path);
    if (!sessionId || !visitorId || !path) {
      throw new Error("Invalid tracking payload");
    }

    const ua = (data.userAgent || "").slice(0, 500);
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
    const { code, name } = countryFromLocale(data.locale);

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
  .inputValidator((input: TrackDurationInput) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const eventId = (data.eventId || "").trim();
    const durationMs = Math.min(Math.max(0, Math.floor(Number(data.durationMs) || 0)), 60 * 60 * 1000);
    if (!eventId || durationMs <= 0) return { ok: false };
    await pool.query(
      `UPDATE site_traffic_events
       SET duration_ms = GREATEST(duration_ms, $2)
       WHERE id = $1::uuid AND event_type = 'page_view'`,
      [eventId, durationMs],
    );
    return { ok: true };
  });

export const getTrafficDashboard = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator(
    (input: { range?: TrafficRangeKey; recentLimit?: number; recentOffset?: number }) => input,
  )
  .handler(async ({ data, context }): Promise<TrafficDashboardData> => {
    await assertSectionView(context, "traffic");
    const range: TrafficRangeKey =
      data.range === "7d" || data.range === "60d" || data.range === "30d" ? data.range : "30d";
    const { from, to, prevFrom, prevTo } = rangeBounds(range);
    const recentLimit = Math.min(Math.max(Number(data.recentLimit) || 20, 5), 50);
    const recentOffset = Math.max(Number(data.recentOffset) || 0, 0);

    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    const [totals, avgMs, prevAvgMs, seriesRes, sourcesRes, pagesRes, devicesRes, countriesRes, recentRes, recentCount, liveRes] =
      await Promise.all([
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

    // Include unexpected source labels if any.
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
  });

export const getTrafficSummary = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<TrafficSummary> => {
    await assertSectionView(context, "traffic");
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
  });
