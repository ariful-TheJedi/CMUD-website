import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { admissionPage } from "@/data/admission";
import { listPublicCourses } from "@/lib/courses.functions";
import { submitAdmissionApplication } from "@/lib/admissions.functions";
import { Turnstile } from "@/components/Turnstile";
import { TURNSTILE_BYPASS_TOKEN, isTurnstileEnabledClient } from "@/lib/turnstile";

const coursesQueryOptions = queryOptions({
  queryKey: ["public-courses"],
  queryFn: () => listPublicCourses(),
});

const admissionSearchSchema = z.object({
  course: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/admission1")({
  validateSearch: (search) => admissionSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: admissionPage.meta.title },
      { name: "description", content: admissionPage.meta.description },
      { property: "og:title", content: admissionPage.meta.ogTitle },
      { property: "og:description", content: admissionPage.meta.ogDescription },
    ],
  }),
  component: AdmissionPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQueryOptions),
});

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.union([
    z.literal(""),
    z.string().trim().email("Enter a valid email"),
  ]),
  phone: z.string().min(7, "Enter a valid phone number"),
  qualification: z.string().min(2, "Required"),
  medicalCollege: z.string().optional().or(z.literal("")),
  bmdcNumber: z.string().min(2, "Enter BMDC number"),
  preferredBranch: z.string().min(1, "Select a preferred branch"),
  course: z.string().min(1, "Select a course"),
  batch: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  howDidYouFindUs: z.string().optional().or(z.literal("")),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function AdmissionPage() {
  const { course } = Route.useSearch();
  const { data: courses } = useSuspenseQuery(coursesQueryOptions);
  const submit = useServerFn(submitAdmissionApplication);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(() =>
    isTurnstileEnabledClient() ? "" : TURNSTILE_BYPASS_TOKEN,
  );


  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      qualification: "",
      medicalCollege: "",
      bmdcNumber: "",
      preferredBranch: "",
      course: course ?? "",
      batch: "",
      address: "",
      howDidYouFindUs: "",
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (submitting) return;
    if (!captchaToken) {
      toast.error(admissionPage.errors.captcha);
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          qualification: values.qualification,
          medicalCollege: values.medicalCollege,
          bmdcNumber: values.bmdcNumber,
          preferredBranch: values.preferredBranch as "Panthapath" | "Uttara",
          courseSlug: values.course,
          preferredBatch: values.batch,
          address: values.address,
          howDidYouFindUs: values.howDidYouFindUs,
          applicantMessage: values.message ?? "",
          website: "",
          captchaToken,
        },
      });
      setSubmitted(true);
      toast.success(admissionPage.success.toastTitle);
      form.reset();
      setCaptchaToken(isTurnstileEnabledClient() ? "" : TURNSTILE_BYPASS_TOKEN);
      if (isTurnstileEnabledClient()) window.turnstile?.reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(admissionPage.errors.submitTitle, {
        description: msg || admissionPage.errors.submitDescription,
      });
      setCaptchaToken(isTurnstileEnabledClient() ? "" : TURNSTILE_BYPASS_TOKEN);
      if (isTurnstileEnabledClient()) window.turnstile?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  const {
    hero,
    labels,
    branches,
    batches,
    findUsOptions,
    placeholders,
    submit: submitCopy,
    success,
  } = admissionPage;

  const RequiredMark = () => <span className="text-destructive">*</span>;

  return (
    <>
      <section className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-10 text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {hero.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            {hero.description}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {labels.fullName} <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={placeholders.fullName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.email}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={placeholders.email} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {labels.phone} <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={placeholders.phone} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {labels.qualification} <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={placeholders.qualification} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medicalCollege"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.medicalCollege}</FormLabel>
                    <FormControl>
                      <Input placeholder={placeholders.medicalCollege} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bmdcNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {labels.bmdcNumber} <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={placeholders.bmdcNumber} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredBranch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {labels.preferredBranch} <RequiredMark />
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={placeholders.preferredBranch} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {labels.course} <RequiredMark />
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={placeholders.course} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.preferredBatch}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={placeholders.preferredBatch} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batches.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="howDidYouFindUs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.howDidYouFindUs}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={placeholders.howDidYouFindUs} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {findUsOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{labels.address}</FormLabel>
                    <FormControl>
                      <Input placeholder={placeholders.address} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{labels.message}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={placeholders.message} rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 space-y-3">
                {/* Honeypot — hidden from users */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  onChange={() => {}}
                />
                <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
                {submitted ? (
                  <div className="rounded-md border border-secondary/40 bg-secondary/10 p-4 text-sm text-foreground">
                    {success.banner}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto"
                  disabled={submitting || !captchaToken}
                >
                  {submitting ? submitCopy.submitting : submitCopy.idle}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </section>
    </>
  );
}
