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
import { getPublicCourses } from "@/lib/public-content";
import { submitAdmissionApplication } from "@/lib/admissions.functions";
import { Turnstile } from "@/components/Turnstile";
import { TURNSTILE_BYPASS_TOKEN, isTurnstileEnabledClient } from "@/lib/turnstile";

const coursesQueryOptions = queryOptions({
  queryKey: ["public-courses"],
  queryFn: () => getPublicCourses(),
});

const admissionSearchSchema = z.object({
  course: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/admission")({
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
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  qualification: z.string().min(2, "Required"),
  medicalCollege: z.string().min(2, "Required"),
  bmdcNumber: z.string().min(2, "Enter BMDC number"),
  preferredBranch: z.string().min(1, "Select a preferred branch"),
  course: z.string().min(1, "Select a course"),
  batch: z.string().min(1, "Select a preferred batch"),
  address: z.string().min(2, "Required"),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function AdmissionPage() {
  const { course } = Route.useSearch();
  const { data: coursesRes } = useSuspenseQuery(coursesQueryOptions);
  const courses = coursesRes.data;
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
          applicantMessage: values.message ?? "",
          website: "",
          captchaToken,
        },
      });
      setSubmitted(true);
      toast.success(admissionPage.success.toastTitle, {
        description: admissionPage.success.toastDescription,
      });
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

  const { hero, branches, batches, placeholders, success } = admissionPage;

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
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
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
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>Phone</FormLabel>
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
                    <FormLabel>Qualification</FormLabel>
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
                    <FormLabel>Medical College</FormLabel>
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
                    <FormLabel>BMDC number</FormLabel>
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
                    <FormLabel>Preferred Branch</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred branch" />
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
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a course" />
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
                    <FormLabel>Preferred batch</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose batch" />
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
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
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
                    <FormLabel>Message (optional)</FormLabel>
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
                  {submitting ? "Submitting…" : "Submit application"}
                </Button>

              </div>
            </form>
          </Form>
        </div>
      </section>
    </>
  );
}
