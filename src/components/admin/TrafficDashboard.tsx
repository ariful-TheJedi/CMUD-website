/**
 * Full traffic monitoring dashboard for /admin/traffic.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Eye,
  RefreshCw,
  Users,
  Activity,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { getTrafficDashboard, type TrafficDashboardData } from "@/lib/traffic.functions";
import {
  DEVICE_LABELS,
  SOURCE_LABELS,
  type TrafficRangeKey,
} from "@/lib/traffic.shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: { key: TrafficRangeKey; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "60d", label: "Last 60 days" },
];

const chartConfig = {
  visitors: { label: "Visitors", color: "hsl(var(--primary))" },
  pageViews: { label: "Page views", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

const RECENT_PAGE = 20;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  changePct,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: typeof Users;
  changePct?: number | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {changePct != null ? (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              changePct >= 0 ? "text-emerald-700" : "text-red-700",
            )}
          >
            {changePct >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(changePct)}% vs previous period
          </p>
        ) : hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>;
}

export function TrafficDashboard() {
  const [range, setRange] = useState<TrafficRangeKey>("30d");
  const [recentOffset, setRecentOffset] = useState(0);
  const dashFn = useServerFn(getTrafficDashboard);

  const q = useQuery({
    queryKey: ["traffic-dashboard", range, recentOffset],
    queryFn: () =>
      dashFn({
        data: { range, recentLimit: RECENT_PAGE, recentOffset },
      }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const data = q.data as TrafficDashboardData | undefined;

  const seriesFilled = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.series.map((p) => [p.date, p]));
    const days = range === "7d" ? 7 : range === "60d" ? 60 : 30;
    const out: { date: string; label: string; visitors: number; pageViews: number }[] = [];
    const end = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const row = map.get(key);
      out.push({
        date: key,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        visitors: row?.visitors ?? 0,
        pageViews: row?.pageViews ?? 0,
      });
    }
    return out;
  }, [data, range]);

  const onRange = (next: TrafficRangeKey) => {
    setRange(next);
    setRecentOffset(0);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Traffic</h1>
            {data && data.liveLast5Min > 0 ? (
              <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live · {data.liveLast5Min}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Visitor activity for the last ~2 months. No IP addresses are shown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border bg-background p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                size="sm"
                variant={range === opt.key ? "secondary" : "ghost"}
                className="h-8 text-xs"
                onClick={() => onRange(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {q.isLoading ? <DashboardSkeleton /> : null}

      {q.isError ? (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">
              {(q.error instanceof Error && q.error.message) || "Could not load traffic data."}
            </span>
          </div>
          <Button size="sm" variant="ghost" className="shrink-0 self-start" onClick={() => q.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Visitors"
              value={data.visitors.toLocaleString()}
              hint={`${data.sessions.toLocaleString()} sessions`}
              icon={Users}
            />
            <StatCard
              title="Page views"
              value={data.pageViews.toLocaleString()}
              hint="All tracked page views"
              icon={Eye}
            />
            <StatCard
              title="Avg. session duration"
              value={data.avgSessionDurationLabel}
              changePct={data.avgDurationChangePct}
              icon={Clock}
            />
            <StatCard
              title="Active (5 min)"
              value={String(data.liveLast5Min)}
              hint="Distinct visitors recently"
              icon={Activity}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Traffic over time</CardTitle>
              <CardDescription>Daily visitors and page views</CardDescription>
            </CardHeader>
            <CardContent>
              {seriesFilled.every((p) => p.visitors === 0 && p.pageViews === 0) ? (
                <EmptyBlock message="No traffic in this range yet. Visit the public site to start collecting data." />
              ) : (
                <ChartContainer config={chartConfig} className="aspect-[16/7] w-full min-h-[220px]">
                  <AreaChart data={seriesFilled} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={28}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="pageViews"
                      stroke="var(--color-pageViews)"
                      fill="var(--color-pageViews)"
                      fillOpacity={0.12}
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="var(--color-visitors)"
                      fill="var(--color-visitors)"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic sources</CardTitle>
                <CardDescription>Where visitors came from</CardDescription>
              </CardHeader>
              <CardContent>
                {data.sources.length === 0 ? (
                  <EmptyBlock message="No sources recorded yet." />
                ) : (
                  <ul className="space-y-3">
                    {data.sources.map((s) => (
                      <li key={s.source}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium">{SOURCE_LABELS[s.source] ?? s.source}</span>
                          <span className="text-muted-foreground">
                            {s.visitors.toLocaleString()} · {s.percent}%
                          </span>
                        </div>
                        <Progress value={Math.min(100, s.percent)} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Devices</CardTitle>
                <CardDescription>Visitor device mix</CardDescription>
              </CardHeader>
              <CardContent>
                {data.devices.every((d) => d.visitors === 0) ? (
                  <EmptyBlock message="No device data yet." />
                ) : (
                  <ul className="space-y-3">
                    {data.devices.map((d) => (
                      <li key={d.device}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium">{DEVICE_LABELS[d.device]}</span>
                          <span className="text-muted-foreground">
                            {d.visitors.toLocaleString()} · {d.percent}%
                          </span>
                        </div>
                        <Progress value={Math.min(100, d.percent)} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top pages</CardTitle>
                <CardDescription>Most viewed paths (top 10)</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {data.topPages.length === 0 ? (
                  <EmptyBlock message="No page views yet." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Visitors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topPages.map((p) => (
                        <TableRow key={p.path}>
                          <TableCell className="max-w-[220px]">
                            <div className="truncate font-medium">{p.title}</div>
                            <div className="truncate text-xs text-muted-foreground">{p.path}</div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.pageViews.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.uniqueVisitors.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Countries</CardTitle>
                <CardDescription>Approx. from browser locale (no IP)</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {data.countries.length === 0 ? (
                  <EmptyBlock message="No country data yet." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Visitors</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.countries.map((c) => (
                        <TableRow key={`${c.countryCode}-${c.country}`}>
                          <TableCell className="font-medium">
                            {c.country}
                            {c.countryCode ? (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({c.countryCode})
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {c.visitors.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.percent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">Recent visits</CardTitle>
                <CardDescription>Latest page views in this range</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={recentOffset <= 0 || q.isFetching}
                  onClick={() => setRecentOffset((o) => Math.max(0, o - RECENT_PAGE))}
                >
                  Newer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    recentOffset + RECENT_PAGE >= data.recentTotal || q.isFetching
                  }
                  onClick={() => setRecentOffset((o) => o + RECENT_PAGE)}
                >
                  View more
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.recentVisits.length === 0 ? (
                <EmptyBlock message="No recent visits in this range." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentVisits.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatTime(v.visitedAt)}
                        </TableCell>
                        <TableCell className="text-sm">{v.country}</TableCell>
                        <TableCell className="capitalize text-sm">{v.device}</TableCell>
                        <TableCell className="text-sm">{v.browser}</TableCell>
                        <TableCell className="max-w-[180px]">
                          <div className="truncate text-sm font-medium">{v.pageTitle}</div>
                          <div className="truncate text-xs text-muted-foreground">{v.path}</div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {SOURCE_LABELS[v.source as keyof typeof SOURCE_LABELS] ?? v.source}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Showing {recentOffset + 1}–
                {Math.min(recentOffset + data.recentVisits.length, data.recentTotal)} of{" "}
                {data.recentTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
