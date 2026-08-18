import { useRef, useState } from "react";
import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminMediaImage } from "@/components/admin/AdminMediaImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toStoragePath } from "@/lib/assets";
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
import {
  type AdminAidSection,
  type AidSlide,
  type SectionInput,
  addAidSlideAdmin,
  deleteAidSectionAdmin,
  deleteAidSlideAdmin,
  listAllAidSectionsAdmin,
  updateAidSlideAdmin,
  uploadAidSlideImage,
  upsertAidSectionAdmin,
} from "@/lib/education-aides.functions";

export const Route = createFileRoute("/_authenticated/admin/education-aides")({
  head: () => ({
    meta: [{ title: "Education Aides — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: EducationAidesAdminPage,
});

function EducationAidesAdminPage() {
  const canWrite = useCanWrite("education_aides");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllAidSectionsAdmin);
  const upsertFn = useServerFn(upsertAidSectionAdmin);
  const deleteFn = useServerFn(deleteAidSectionAdmin);
  const addSlideFn = useServerFn(addAidSlideAdmin);
  const updSlideFn = useServerFn(updateAidSlideAdmin);
  const delSlideFn = useServerFn(deleteAidSlideAdmin);

  const query = useQuery({
    queryKey: ["admin-education-aides"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<AdminAidSection | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminAidSection | null>(null);
  const [editingSlide, setEditingSlide] = useState<{
    slide: AidSlide;
    sectionTitle: string;
  } | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-education-aides"] });
    qc.invalidateQueries({ queryKey: ["public-education-aides"] });
  };

  const upsert = useMutation({
    mutationFn: (input: SectionInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Section saved");
      invalidate();
      setEditing(null);
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Section deleted");
      invalidate();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSlide = useMutation({
    mutationFn: (v: { sectionId: string; imageUrl: string; sortOrder: number }) =>
      addSlideFn({ data: v }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSlide = useMutation({
    mutationFn: (v: { id: string; caption: string }) => updSlideFn({ data: v }),
    onSuccess: () => {
      toast.success("Slide updated");
      invalidate();
      setEditingSlide(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSlide = useMutation({
    mutationFn: (id: string) => delSlideFn({ data: { id } }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const sections = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Education Aides</h1>
          <p className="text-sm text-muted-foreground">
            Manage the sections and sliding images shown on the public Education Aides page.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New section
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Loading…" : `${sections.length} sections`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length === 0 && !query.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No sections yet. Click "New section" to add one.
            </div>
          ) : null}

          <div className="grid gap-4">
            {sections.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-lg font-bold">{s.title || "(untitled)"}</h2>
                      <span className="text-xs text-muted-foreground">Order: {s.sortOrder}</span>
                    </div>
                    {s.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        upsert.mutate({
                          id: s.id,
                          title: s.title,
                          description: s.description,
                          sortOrder: s.sortOrder,
                          isPublished: !s.isPublished,
                        })
                      }
                      disabled={upsert.isPending}
                      aria-pressed={s.isPublished}
                      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                      style={
                        s.isPublished
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
                      {s.isPublished ? "Published" : "Unpublished"}
                    </button>
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(s)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToDelete(s)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {s.slides.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-3">Thumbnail</th>
                          <th className="py-2 pr-3">Caption</th>
                          <th className="py-2 pr-3">Order</th>
                          <th className="py-2 pr-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.slides.map((sl) => (
                          <tr key={sl.id} className="border-b last:border-0">
                            <td className="py-2 pr-3">
                              <AdminMediaImage
                                src={sl.imageUrl}
                                alt={sl.caption}
                                className="h-14 w-20 rounded object-cover"
                              />
                            </td>
                            <td className="py-2 pr-3 align-top">
                              {sl.caption || <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-2 pr-3 align-top text-xs text-muted-foreground">
                              {sl.sortOrder}
                            </td>
                            <td className="py-2 pr-3 text-right align-top">
                              <div className="flex justify-end gap-1">
                                {canWrite && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setEditingSlide({ slide: sl, sectionTitle: s.title })
                                    }
                                    aria-label="Edit slide"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSlide.mutate(sl.id)}
                                  disabled={removeSlide.isPending}
                                  aria-label="Remove slide"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <ImageOff className="h-3.5 w-3.5" /> No slides yet.
                  </p>
                )}

                <div className="mt-3">
                  <SlideAdder
                    onUploaded={(url) =>
                      addSlide.mutate({
                        sectionId: s.id,
                        imageUrl: toStoragePath(url),
                        sortOrder: (s.slides[s.slides.length - 1]?.sortOrder ?? -1) + 1,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SectionFormDialog
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

      <SlideEditDialog
        open={editingSlide !== null}
        slide={editingSlide?.slide}
        sectionTitle={editingSlide?.sectionTitle ?? ""}
        onOpenChange={(open) => !open && setEditingSlide(null)}
        onSubmit={(v) => updateSlide.mutate(v)}
        submitting={updateSlide.isPending}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" and all its slides will be removed. This cannot be undone.
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

function SectionFormDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: AdminAidSection;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: SectionInput) => void;
  submitting: boolean;
}) {
  const key = initial?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit section" : "New section"}</DialogTitle>
        </DialogHeader>
        <SectionForm
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

function SectionForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
}: {
  initial?: AdminAidSection;
  onSubmit: (input: SectionInput) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SectionInput>(() =>
    initial
      ? {
          id: initial.id,
          title: initial.title,
          description: initial.description,
          isPublished: initial.isPublished,
          sortOrder: initial.sortOrder,
        }
      : { title: "", description: "", isPublished: true, sortOrder: 0 },
  );

  const set = <K extends keyof SectionInput>(k: K, v: SectionInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Sort order (lower shows first)</Label>
        <Input
          type="number"
          value={form.sortOrder}
          onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={form.isPublished} onCheckedChange={(v) => set("isPublished", v)} />
        Published (visible on site)
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save section"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function SlideEditDialog({
  open,
  slide,
  sectionTitle,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  slide?: AidSlide;
  sectionTitle: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (v: { id: string; caption: string }) => void;
  submitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit slide — {sectionTitle}</DialogTitle>
        </DialogHeader>
        {slide ? (
          <SlideEditForm
            key={slide.id}
            slide={slide}
            onSubmit={onSubmit}
            submitting={submitting}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SlideEditForm({
  slide,
  onSubmit,
  submitting,
  onCancel,
}: {
  slide: AidSlide;
  onSubmit: (v: { id: string; caption: string }) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [caption, setCaption] = useState(slide.caption);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ id: slide.id, caption });
      }}
      className="space-y-4"
    >
      <AdminMediaImage
        src={slide.imageUrl}
        alt={caption}
        className="max-h-56 w-full rounded-md border border-border object-contain"
      />
      <div className="space-y-1.5">
        <Label>Caption</Label>
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save slide"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function SlideAdder({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(uploadAidSlideImage);

  const fileToBase64 = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    let ok = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: not an image`);
          continue;
        }
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name}: over 8MB`);
          continue;
        }
        const { url } = await uploadFn({
          data: {
            fileName: file.name,
            contentType: file.type,
            base64: await fileToBase64(file),
          },
        });
        onUploaded(url);
        ok += 1;
      }
      if (ok > 0) toast.success(ok === 1 ? "Image uploaded" : `${ok} images uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void handleFiles(e.target.files);
        }}
      />
      <Upload className="h-4 w-4" />
      <span>{uploading ? "Uploading…" : "Add images"}</span>
    </button>
  );
}
