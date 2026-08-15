import { useRef, useState } from "react";
import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminMediaImage, useObjectUrl } from "@/components/admin/AdminMediaImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type AdminTestimonialRow,
  type TestimonialInput,
  deleteTestimonialAdmin,
  listAllTestimonialsAdmin,
  uploadTestimonialPhoto,
  upsertTestimonialAdmin,
} from "@/lib/testimonials.functions";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  head: () => ({
    meta: [{ title: "Testimonials — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: TestimonialsAdminPage,
});

function emptyForm(): TestimonialInput {
  return {
    name: "",
    role: "",
    quote: "",
    initials: "",
    photoUrl: "",
    isPublished: true,
    sortOrder: 0,
  };
}

function initialsFrom(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)$/i.test(p));
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function TestimonialsAdminPage() {
  const canWrite = useCanWrite("testimonials");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllTestimonialsAdmin);
  const upsertFn = useServerFn(upsertTestimonialAdmin);
  const deleteFn = useServerFn(deleteTestimonialAdmin);

  const query = useQuery({ queryKey: ["admin-testimonials"], queryFn: () => listFn() });

  const [editing, setEditing] = useState<AdminTestimonialRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminTestimonialRow | null>(null);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["public-testimonials"] });
  };

  const upsert = useMutation({
    mutationFn: (input: TestimonialInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Testimonial saved");
      invalidateAll();
      setEditing(null);
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Testimonial deleted");
      invalidateAll();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
          <p className="text-sm text-muted-foreground">
            Manage graduate testimonials shown on the homepage and /testimonials page.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New testimonial
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Loading…" : `${rows.length} testimonials`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-14rem)] overflow-x-auto overflow-y-auto">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[64px]">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead className="w-[110px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        {t.photoUrl ? <AvatarImage src={t.photoUrl} alt={t.name} /> : null}
                        <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                          {t.initials || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.role}</TableCell>
                    <TableCell className="max-w-md text-sm text-muted-foreground">
                      <span className="line-clamp-2">{t.quote}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          upsert.mutate({
                            id: t.id,
                            name: t.name,
                            role: t.role,
                            quote: t.quote,
                            initials: t.initials,
                            photoUrl: t.photoUrl,
                            sortOrder: t.sortOrder,
                            isPublished: !t.isPublished,
                          })
                        }
                        disabled={upsert.isPending}
                        aria-label={t.isPublished ? "Unpublish testimonial" : "Publish testimonial"}
                        aria-pressed={t.isPublished}
                        className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                        style={
                          t.isPublished
                            ? {
                                background: "hsl(var(--primary))",
                                color: "hsl(var(--primary-foreground))",
                              }
                            : {
                                background: "hsl(var(--destructive))",
                                color: "hsl(var(--destructive-foreground))",
                              }
                        }
                      >
                        {t.isPublished ? "Published" : "Unpublished"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right text-sm">{t.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(t)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(t)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!query.isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No testimonials yet. Click "New testimonial" to add one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TestimonialFormDialog
        open={creating || editing !== null}
        initial={editing ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
        onSubmit={(input) => upsert.mutate(input)}
        submitting={upsert.isPending}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" will be removed from the website. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && remove.mutate(toDelete.id)}
              disabled={remove.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TestimonialFormDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: AdminTestimonialRow;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: TestimonialInput) => void;
  submitting: boolean;
}) {
  const key = initial?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit testimonial" : "New testimonial"}</DialogTitle>
        </DialogHeader>
        <TestimonialForm
          key={key}
          initial={initial}
          onSubmit={onSubmit}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function TestimonialForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
}: {
  initial?: AdminTestimonialRow;
  onSubmit: (input: TestimonialInput) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TestimonialInput>(() =>
    initial ? { ...initial, photoUrl: initial.photoUrl ?? "" } : emptyForm(),
  );
  const [pickedPhoto, setPickedPhoto] = useState<File | null>(null);
  const photoPreview = useObjectUrl(pickedPhoto);

  const set = <K extends keyof TestimonialInput>(k: K, v: TestimonialInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.quote.trim()) {
      toast.error("Quote is required");
      return;
    }
    const payload = { ...form };
    if (!payload.initials.trim()) payload.initials = initialsFrom(payload.name);
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="Initials (fallback avatar)">
          <Input
            value={form.initials}
            onChange={(e) => set("initials", e.target.value.toUpperCase().slice(0, 3))}
            placeholder="Auto from name if empty"
          />
        </Field>
        <Field label="Role / title">
          <Input value={form.role} onChange={(e) => set("role", e.target.value)} />
        </Field>
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <Field label="Photo">
        <Input
          value={form.photoUrl}
          onChange={(e) => {
            setPickedPhoto(null);
            set("photoUrl", e.target.value);
          }}
          placeholder="Paste image URL or upload below"
        />
        <PhotoUploader
          onUploaded={(url) => set("photoUrl", url)}
          onPickedFile={setPickedPhoto}
          currentName={form.name}
          previousUrl={form.photoUrl}
        />
        {form.photoUrl || photoPreview ? (
          <AdminMediaImage
            src={form.photoUrl}
            localPreviewSrc={photoPreview}
            alt={form.name || "Person photo preview"}
            className="mt-2 h-24 w-24 rounded-full border border-border object-cover object-top"
          />
        ) : null}
      </Field>

      <Field label="Quote">
        <Textarea value={form.quote} onChange={(e) => set("quote", e.target.value)} rows={4} />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={form.isPublished} onCheckedChange={(v) => set("isPublished", v)} />
          Published (visible on site)
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save testimonial"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PhotoUploader({
  onUploaded,
  onPickedFile,
  currentName,
  previousUrl,
}: {
  onUploaded: (url: string) => void;
  onPickedFile?: (file: File | null) => void;
  currentName: string;
  previousUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(uploadTestimonialPhoto);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    onPickedFile?.(file);
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
      const base64 = btoa(binary);
      const { url } = await uploadFn({
        data: {
          fileName: file.name,
          contentType: file.type,
          base64,
          currentName,
          previousUrl,
        },
      });
      onUploaded(url);
      toast.success("Photo uploaded");
    } catch (e) {
      onPickedFile?.(null);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
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
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload from device"}
      </Button>
      <span className="text-xs text-muted-foreground">PNG/JPG, up to 5MB</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
