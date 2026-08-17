import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminMediaImage, useObjectUrl } from "@/components/admin/AdminMediaImage";
import { useCanWrite } from "@/hooks/use-can-write";
import { isLocalMediaUrl, toStoragePath } from "@/lib/assets";
import { defaultHomeContent, type HomePageContent } from "@/lib/home-content";
import { media } from "@/lib/media";
import {
  getPageContentAdmin,
  updateHomePageContent,
  uploadHomePageImage,
  deleteHomePageImage,
  type PageContentInput,
} from "@/lib/page-content.functions";

export const Route = createFileRoute("/_authenticated/admin/home-page")({
  head: () => ({
    meta: [{ title: "Home Page Content — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: HomePageContentAdmin,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  disabled,
  fallbackSrc,
  slot,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  fallbackSrc: string;
  slot: "hero" | "handsOn";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const localPreviewSrc = useObjectUrl(pickedFile);
  const uploadFn = useServerFn(uploadHomePageImage);
  const deleteFn = useServerFn(deleteHomePageImage);

  const isLocalMedia = (url: string) => isLocalMediaUrl(url, "home");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setPickedFile(file);
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const base64 = btoa(binary);
      const result = await uploadFn({
        data: {
          slot,
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          base64,
          previousUrl: isLocalMedia(value) ? toStoragePath(value) : undefined,
        },
      });
      onChange(toStoragePath(result.url));
      toast.success("Image saved to assets media/home");
    } catch (e) {
      setPickedFile(null);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleClear = async () => {
    if (!value) {
      onChange("");
      setPickedFile(null);
      return;
    }
    setDeleting(true);
    try {
      if (isLocalMedia(value)) {
        await deleteFn({ data: { url: toStoragePath(value) } });
        toast.success("Image removed from assets media/home");
      }
      onChange("");
      setPickedFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Field label={label}>
      <Input
        value={value}
        onChange={(e) => {
          setPickedFile(null);
          onChange(toStoragePath(e.target.value) || e.target.value.trim());
        }}
        placeholder="Paste image URL or upload below (blank = built-in image)"
        disabled={disabled}
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || deleting}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload from device"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading || deleting}
            onClick={() => void handleClear()}
          >
            {deleting ? "Deleting…" : "Clear"}
          </Button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Uploads go to <code className="text-[11px]">ASSETS_ROOT/media/home/</code> (DB stores{" "}
        <code className="text-[11px]">/media/home/...</code>). Clear deletes the file from that
        folder.
      </p>
      <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Currently shown on the site {value ? "(custom upload)" : "(built-in default image)"}
        </p>
        <AdminMediaImage
          src={value || fallbackSrc}
          localPreviewSrc={localPreviewSrc}
          alt={`Current ${label.toLowerCase()} used on the home page`}
          className="h-40 w-auto rounded-md border border-border object-cover"
        />
      </div>
    </Field>
  );
}

function HomePageContentAdmin() {
  const canWrite = useCanWrite("home_page");
  const qc = useQueryClient();
  const loadFn = useServerFn(getPageContentAdmin);
  const saveFn = useServerFn(updateHomePageContent);

  const query = useQuery({ queryKey: ["admin-page-home"], queryFn: () => loadFn() });

  const [form, setForm] = useState<PageContentInput>({
    title: "Home Page",
    metaTitle: "",
    metaDescription: "",
    pageData: defaultHomeContent,
  });

  useEffect(() => {
    const rec = query.data;
    if (!rec) return;
    setForm({
      title: rec.title,
      metaTitle: rec.metaTitle,
      metaDescription: rec.metaDescription,
      pageData: rec.pageData,
    });
  }, [query.data]);

  const setHero = <K extends keyof HomePageContent["hero"]>(
    key: K,
    value: HomePageContent["hero"][K],
  ) =>
    setForm((f) => ({
      ...f,
      pageData: { ...f.pageData, hero: { ...f.pageData.hero, [key]: value } },
    }));

  const setHands = <K extends keyof HomePageContent["handsOn"]>(
    key: K,
    value: HomePageContent["handsOn"][K],
  ) =>
    setForm((f) => ({
      ...f,
      pageData: { ...f.pageData, handsOn: { ...f.pageData.handsOn, [key]: value } },
    }));

  const save = useMutation({
    mutationFn: (input: PageContentInput) => saveFn({ data: input }),
    onSuccess: () => {
      toast.success("Home page content saved");
      qc.invalidateQueries({ queryKey: ["admin-page-home"] });
      qc.invalidateQueries({ queryKey: ["home-page-content"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hero = form.pageData.hero;
  const hands = form.pageData.handsOn;
  const ro = !canWrite;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Home Page Content</h1>
          <p className="text-sm text-muted-foreground">
            Edit the hero section and the Hands-on Ultrasound Training section. Content is saved to
            the local Postgres <code className="text-xs">page_content</code> table; images go to{" "}
            <code className="text-xs">ASSETS_ROOT/media/home/</code>.
          </p>
        </div>
        <Button disabled={ro || save.isPending} onClick={() => save.mutate(form)}>
          <Save className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page & SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Internal page title">
            <Input
              value={form.title}
              disabled={ro}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Meta title">
            <Input
              value={form.metaTitle}
              disabled={ro}
              onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Meta description">
              <Textarea
                rows={2}
                value={form.metaDescription}
                disabled={ro}
                onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero section</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Badge text">
            <Input
              value={hero.badge}
              disabled={ro}
              onChange={(e) => setHero("badge", e.target.value)}
            />
          </Field>
          <ImageField
            label="Hero image"
            value={hero.imageUrl}
            disabled={ro}
            onChange={(url) => setHero("imageUrl", url)}
            fallbackSrc={media.home.hero}
            slot="hero"
          />
          <div className="md:col-span-2">
            <Field label="Heading">
              <Textarea
                rows={2}
                value={hero.heading}
                disabled={ro}
                onChange={(e) => setHero("heading", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                rows={4}
                value={hero.description}
                disabled={ro}
                onChange={(e) => setHero("description", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Hero image alt text">
            <Input
              value={hero.imageAlt}
              disabled={ro}
              onChange={(e) => setHero("imageAlt", e.target.value)}
            />
          </Field>
          <div />
          <Field label="Primary button label">
            <Input
              value={hero.primaryCtaLabel}
              disabled={ro}
              onChange={(e) => setHero("primaryCtaLabel", e.target.value)}
            />
          </Field>
          <Field label="Primary button link">
            <Input
              value={hero.primaryCtaHref}
              disabled={ro}
              onChange={(e) => setHero("primaryCtaHref", e.target.value)}
            />
          </Field>
          <Field label="Secondary button label">
            <Input
              value={hero.secondaryCtaLabel}
              disabled={ro}
              onChange={(e) => setHero("secondaryCtaLabel", e.target.value)}
            />
          </Field>
          <Field label="Secondary button link">
            <Input
              value={hero.secondaryCtaHref}
              disabled={ro}
              onChange={(e) => setHero("secondaryCtaHref", e.target.value)}
            />
          </Field>

          <div className="md:col-span-2">
            <Label className="text-sm">Stats</Label>
            <div className="mt-2 space-y-2">
              {hero.stats.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input
                    className="w-32"
                    placeholder="Value"
                    value={s.value}
                    disabled={ro}
                    onChange={(e) => {
                      const next = hero.stats.map((x, j) =>
                        j === i ? { ...x, value: e.target.value } : x,
                      );
                      setHero("stats", next);
                    }}
                  />
                  <Input
                    className="w-48"
                    placeholder="Label"
                    value={s.label}
                    disabled={ro}
                    onChange={(e) => {
                      const next = hero.stats.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      );
                      setHero("stats", next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={ro}
                    onClick={() =>
                      setHero(
                        "stats",
                        hero.stats.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={ro}
                onClick={() => setHero("stats", [...hero.stats, { value: "", label: "" }])}
              >
                <Plus className="h-4 w-4" /> Add stat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hands-on Ultrasound Training section</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow">
            <Input
              value={hands.eyebrow}
              disabled={ro}
              onChange={(e) => setHands("eyebrow", e.target.value)}
            />
          </Field>
          <ImageField
            label="Section image"
            value={hands.imageUrl}
            disabled={ro}
            onChange={(url) => setHands("imageUrl", url)}
            fallbackSrc={media.home.handsOn}
            slot="handsOn"
          />
          <div className="md:col-span-2">
            <Field label="Title">
              <Input
                value={hands.title}
                disabled={ro}
                onChange={(e) => setHands("title", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                rows={4}
                value={hands.description}
                disabled={ro}
                onChange={(e) => setHands("description", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Image alt text">
            <Input
              value={hands.imageAlt}
              disabled={ro}
              onChange={(e) => setHands("imageAlt", e.target.value)}
            />
          </Field>
          <div />
          <Field label="Floating badge value">
            <Input
              value={hands.badgeValue}
              disabled={ro}
              onChange={(e) => setHands("badgeValue", e.target.value)}
            />
          </Field>
          <Field label="Floating badge label">
            <Input
              value={hands.badgeLabel}
              disabled={ro}
              onChange={(e) => setHands("badgeLabel", e.target.value)}
            />
          </Field>
          <Field label="Button label">
            <Input
              value={hands.ctaLabel}
              disabled={ro}
              onChange={(e) => setHands("ctaLabel", e.target.value)}
            />
          </Field>
          <Field label="Button link">
            <Input
              value={hands.ctaHref}
              disabled={ro}
              onChange={(e) => setHands("ctaHref", e.target.value)}
            />
          </Field>

          <div className="md:col-span-2">
            <Label className="text-sm">Bullet points</Label>
            <div className="mt-2 space-y-2">
              {hands.bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={b}
                    disabled={ro}
                    onChange={(e) =>
                      setHands(
                        "bullets",
                        hands.bullets.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={ro}
                    onClick={() =>
                      setHands(
                        "bullets",
                        hands.bullets.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={ro}
                onClick={() => setHands("bullets", [...hands.bullets, ""])}
              >
                <Plus className="h-4 w-4" /> Add bullet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={ro || save.isPending} onClick={() => save.mutate(form)}>
          <Save className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
