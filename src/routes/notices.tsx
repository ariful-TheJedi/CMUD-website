import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicNotices } from "@/lib/notices.functions";
import { noticesPage } from "@/data/notices";

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: noticesPage.meta.title },
      { name: "description", content: noticesPage.meta.description },
      { property: "og:title", content: noticesPage.meta.ogTitle },
      { property: "og:description", content: noticesPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["public-notices"],
      queryFn: () => listPublicNotices(),
    }),
  component: NoticesPage,
});

function NoticesPage() {
  const listNotices = useServerFn(listPublicNotices);
  const { data: notices } = useSuspenseQuery({
    queryKey: ["public-notices"],
    queryFn: () => listNotices(),
  });
  const { hero, emptyState } = noticesPage;

  return (
    <>
      <section className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-foreground/80">{hero.description}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyState}</p>
        ) : (
          <div className="grid gap-4">
            {notices.map((n) => {
              const d = new Date(n.noticeDate);
              return (
                <Card key={n.id} className="border-border/70">
                  <CardContent className="flex gap-4 p-5">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <span className="text-[10px] uppercase">
                        {d.toLocaleString("en", { month: "short" })}
                      </span>
                      <span className="font-serif text-xl font-bold leading-none">
                        {d.getDate()}
                      </span>
                    </div>
                    <div>
                      {n.category ? (
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">
                          {n.category.name}
                        </Badge>
                      ) : null}
                      <h2 className="mt-1 font-serif text-lg font-bold">{n.title}</h2>
                      {n.body ? (
                        <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                      ) : null}
                      {n.attachments.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {n.attachments.map((a) => (
                            <a
                              key={a.id ?? a.fileUrl}
                              href={a.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={a.fileName}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm font-medium text-primary hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              {a.displayName?.trim() || a.fileName}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
