import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "@/components/SectionHeading";
// PAUSED — Cloudflare Turnstile (re-enable when asked for production)
// import { Turnstile } from "@/components/Turnstile";
import { TURNSTILE_BYPASS_TOKEN } from "@/lib/turnstile";
import { verifyCertificate, type VerifyCertificateResult } from "@/lib/certificates.functions";
import { certificateCheckPage } from "@/data/certificate-check";

export const Route = createFileRoute("/certificate-check")({
  head: () => ({
    meta: [
      { title: certificateCheckPage.meta.title },
      { name: "description", content: certificateCheckPage.meta.description },
      { property: "og:title", content: certificateCheckPage.meta.ogTitle },
      { property: "og:description", content: certificateCheckPage.meta.ogDescription },
    ],
  }),
  component: CertificateCheckPage,
});

type LookupType = "certificate" | "bmdc";

function CertificateCheckPage() {
  const [lookupType, setLookupType] = useState<LookupType>("certificate");
  const [value, setValue] = useState("");
  // PAUSED — Turnstile; keep bypass token so submit still works
  const [captchaToken] = useState(TURNSTILE_BYPASS_TOKEN);
  const verifyFn = useServerFn(verifyCertificate);
  const { hero, lookup: lookupCopy, messages } = certificateCheckPage;

  const lookup = useMutation({
    mutationFn: (input: { type: LookupType; value: string; captchaToken: string }) =>
      verifyFn({ data: input }) as Promise<VerifyCertificateResult>,
    // PAUSED — Turnstile reset skipped
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !captchaToken) return;
    lookup.mutate({ type: lookupType, value: value.trim(), captchaToken });
  };

  const activeLookup = lookupCopy[lookupType];
  const result = lookup.data;
  const matches = result && result.valid ? result.matches : [];
  const showNoMatch = !!result && !result.valid;

  return (
    <>
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <SectionHeading
            eyebrow={hero.eyebrow}
            title={hero.title}
            description={hero.description}
            align="center"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-2xl border-border/70">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <RadioGroup
                value={lookupType}
                onValueChange={(v) => {
                  setLookupType(v as LookupType);
                  lookup.reset();
                }}
                className="flex flex-wrap items-center gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="certificate" id="opt-cert" />
                  <Label htmlFor="opt-cert" className="cursor-pointer text-sm font-medium">
                    {lookupCopy.certificate.label}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="bmdc" id="opt-bmdc" />
                  <Label htmlFor="opt-bmdc" className="cursor-pointer text-sm font-medium">
                    {lookupCopy.bmdc.label}
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="lookupValue"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={activeLookup.placeholder}
                    aria-label={activeLookup.label}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={lookup.isPending || !captchaToken}>
                    <Search className="h-4 w-4" />{" "}
                    {lookup.isPending ? messages.verifying : messages.verifyIdle}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{activeLookup.helper}</p>
              </div>

              {/* PAUSED — Cloudflare Turnstile (re-enable for production when asked)
              <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
              */}
            </form>

            {lookup.isError ? (
              <div className="mt-8 rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
                {messages.error}
              </div>
            ) : null}

            {showNoMatch ? (
              <div className="mt-8 rounded-lg border border-border bg-muted/40 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-serif text-base font-bold text-foreground">
                      {messages.noMatchTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{messages.noMatchBody}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {matches.length > 0 ? (
              <div className="mt-8 overflow-hidden rounded-lg border border-secondary/30 bg-background">
                <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/10 px-5 py-4">
                  <ShieldCheck className="h-6 w-6 text-secondary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                      {messages.verifiedLabel}
                    </p>
                    <p className="font-serif text-lg font-bold text-foreground">
                      {matches[0].studentName}
                    </p>
                    <p className="text-xs text-muted-foreground">{matches[0].issuer}</p>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {matches.length} enrolled course{matches.length > 1 ? "s" : ""} on record.
                  </p>
                  <div className="mt-4 space-y-3">
                    {matches.map((r) => (
                      <div
                        key={r.certificateNumber}
                        className="rounded-md border border-border/60 bg-muted/30 p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{r.courseName}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.batch ? `Batch ${r.batch}` : null}
                            {r.batch && r.yearOfAdmission ? " · " : null}
                            {r.yearOfAdmission ? `Admitted ${r.yearOfAdmission}` : null}
                          </p>
                        </div>
                        <dl className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                          <div>
                            <dt className="text-muted-foreground">Certificate No</dt>
                            <dd className="mt-0.5 font-mono text-sm text-foreground">
                              {r.certificateNumber}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">BMDC No</dt>
                            <dd className="mt-0.5 font-mono text-sm text-foreground">
                              {r.bmdcMasked || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Status</dt>
                            <dd className="mt-0.5 text-sm font-semibold uppercase text-secondary">
                              {r.status}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
