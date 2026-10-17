import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  description,
  viewport = false,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  viewport?: boolean;
}) {
  return (
    <section
      className={`border-b border-border/60 bg-background text-foreground ${
        viewport ? "flex min-h-[calc(100svh-65px)] items-center lg:min-h-[calc(100svh-110px)]" : ""
      }`}
    >
      <div
        className={`container mx-auto px-4 ${
          viewport ? "py-10 sm:py-12 lg:py-14" : "py-12 sm:py-14 lg:py-16"
        } ${viewport ? "text-center" : ""}`}
      >
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {eyebrow}
        </p>
        <h1
          className={`mt-3 max-w-4xl font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl ${
            viewport ? "mx-auto" : ""
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={`mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg ${
              viewport ? "mx-auto" : ""
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
