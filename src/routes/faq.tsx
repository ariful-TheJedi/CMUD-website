import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { listPublicFaqs } from "@/lib/faqs.functions";
import { faqPage } from "@/data/faqs";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: faqPage.meta.title },
      { name: "description", content: faqPage.meta.description },
      { property: "og:title", content: faqPage.meta.ogTitle },
      { property: "og:description", content: faqPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["public-faqs"],
      queryFn: () => listPublicFaqs(),
    }),
  component: FaqPage,
});

function FaqPage() {
  const listFaqs = useServerFn(listPublicFaqs);
  const { data: faqs } = useSuspenseQuery({
    queryKey: ["public-faqs"],
    queryFn: () => listFaqs(),
  });
  const { hero, emptyState } = faqPage;
  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">
            {hero.title}
          </h1>
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 py-16">
        {faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyState}</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.id}
                value={`item-${i}`}
                className="overflow-hidden rounded-xl border border-border bg-card px-5"
              >
                <AccordionTrigger className="font-serif text-base font-bold text-left">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground whitespace-pre-line">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </>
  );
}
