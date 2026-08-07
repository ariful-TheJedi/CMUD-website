import { useRef, useState } from "react";
import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
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
import {
  type AdminAlbum,
  type AlbumInput,
  type GalleryImage,
  addAlbumImageAdmin,
  deleteAlbumAdmin,
  deleteAlbumImageAdmin,
  listAllAlbumsAdmin,
  updateAlbumImageAdmin,
  uploadGalleryImage,
  upsertAlbumAdmin,
} from "@/lib/gallery.functions";

export const Route = createFileRoute("/_authenticated/admin/gallery")({
  head: () => ({
    meta: [{ title: "Gallery — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: GalleryAdminPage,
});

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function GalleryAdminPage() {
  const canWrite = useCanWrite("gallery");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllAlbumsAdmin);
  const upsertFn = useServerFn(upsertAlbumAdmin);
  const deleteFn = useServerFn(deleteAlbumAdmin);
  const addImgFn = useServerFn(addAlbumImageAdmin);
  const updImgFn = useServerFn(updateAlbumImageAdmin);
  const delImgFn = useServerFn(deleteAlbumImageAdmin);

  const query = useQuery({ queryKey: ["admin-gallery"], queryFn: () => listFn() });

  const [editing, setEditing] = useState<AdminAlbum | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminAlbum | null>(null);
  const [editingImage, setEditingImage] = useState<{
    image: GalleryImage;
    albumTitle: string;
  } | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    qc.invalidateQueries({ queryKey: ["public-gallery"] });
  };

  const upsert = useMutation({
    mutationFn: (input: AlbumInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Placeholder saved");
      invalidate();
      setEditing(null);
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Placeholder deleted");
      invalidate();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addImage = useMutation({
    mutationFn: (v: { albumId: string; url: string; sortOrder: number }) => addImgFn({ data: v }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateImage = useMutation({
    mutationFn: (v: { id: string; caption: string; altText: string }) => updImgFn({ data: v }),
    onSuccess: () => {
      toast.success("Image updated");
      invalidate();
      setEditingImage(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeImage = useMutation({
    mutationFn: (id: string) => delImgFn({ data: { id } }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const albums = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Manage image placeholders and per-image details shown on the public gallery page.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New placeholder
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Loading…" : `${albums.length} placeholders`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {albums.length === 0 && !query.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No placeholders yet. Click "New placeholder" to add one.
            </div>
          ) : null}

          <div className="grid gap-4">
            {albums.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-lg font-bold">{a.title || "(untitled)"}</h2>
                      {a.category ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {a.category}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">Order: {a.sortOrder}</span>
                      <span className="text-xs text-muted-foreground">
                        Uploaded: {formatDate(a.createdAt)}
                      </span>
                    </div>
                    {a.caption ? (
                      <p className="mt-1 text-sm text-muted-foreground">{a.caption}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        upsert.mutate({
                          id: a.id,
                          title: a.title,
                          caption: a.caption,
                          category: a.category,
                          sortOrder: a.sortOrder,
                          isPublished: !a.isPublished,
                        })
                      }
                      disabled={upsert.isPending}
                      aria-pressed={a.isPublished}
                      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                      style={
                        a.isPublished
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
                      {a.isPublished ? "Published" : "Unpublished"}
                    </button>
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(a)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToDelete(a)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {a.images.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-3">Thumbnail</th>
                          <th className="py-2 pr-3">Caption</th>
                          <th className="py-2 pr-3">Alt text</th>
                          <th className="py-2 pr-3">Uploaded</th>
                          <th className="py-2 pr-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.images.map((img) => (
                          <tr key={img.id} className="border-b last:border-0">
                            <td className="py-2 pr-3">
                              <img
                                src={img.url}
                                alt={img.altText}
                                className="h-14 w-20 rounded object-cover"
                                loading="lazy"
                              />
                            </td>
                            <td className="py-2 pr-3 align-top">
                              {img.caption || <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-2 pr-3 align-top">
                              {img.altText || <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-2 pr-3 align-top text-xs text-muted-foreground">
                              {formatDate(img.createdAt)}
                            </td>
                            <td className="py-2 pr-3 text-right align-top">
                              <div className="flex justify-end gap-1">
                                {canWrite && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setEditingImage({ image: img, albumTitle: a.title })
                                    }
                                    aria-label="Edit image"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeImage.mutate(img.id)}
                                  disabled={removeImage.isPending}
                                  aria-label="Remove image"
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
                    <ImageOff className="h-3.5 w-3.5" /> No images yet.
                  </p>
                )}

                <div className="mt-3">
                  <ImageAdder
                    onUploaded={(url) =>
                      addImage.mutate({
                        albumId: a.id,
                        url,
                        sortOrder: (a.images[a.images.length - 1]?.sortOrder ?? -1) + 1,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlbumFormDialog
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

      <ImageEditDialog
        open={editingImage !== null}
        image={editingImage?.image}
        albumTitle={editingImage?.albumTitle ?? ""}
        onOpenChange={(open) => !open && setEditingImage(null)}
        onSubmit={(v) => updateImage.mutate(v)}
        submitting={updateImage.isPending}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this placeholder?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" and all its images will be removed. This cannot be undone.
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

function AlbumFormDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: AdminAlbum;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AlbumInput) => void;
  submitting: boolean;
}) {
  const key = initial?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit placeholder" : "New placeholder"}</DialogTitle>
        </DialogHeader>
        <AlbumForm
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

function AlbumForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
}: {
  initial?: AdminAlbum;
  onSubmit: (input: AlbumInput) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AlbumInput>(() =>
    initial
      ? {
          id: initial.id,
          title: initial.title,
          caption: initial.caption,
          category: initial.category,
          isPublished: initial.isPublished,
          sortOrder: initial.sortOrder,
        }
      : { title: "", caption: "", category: "", isPublished: true, sortOrder: 0 },
  );

  const set = <K extends keyof AlbumInput>(k: K, v: AlbumInput[K]) =>
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
        <Label>Description / caption</Label>
        <Textarea value={form.caption} onChange={(e) => set("caption", e.target.value)} rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Input
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="e.g. Workshop, Convocation, Lab"
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
          {submitting ? "Saving…" : "Save placeholder"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ImageEditDialog({
  open,
  image,
  albumTitle,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  image?: GalleryImage;
  albumTitle: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (v: { id: string; caption: string; altText: string }) => void;
  submitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit image — {albumTitle}</DialogTitle>
        </DialogHeader>
        {image ? (
          <ImageEditForm
            key={image.id}
            image={image}
            onSubmit={onSubmit}
            submitting={submitting}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ImageEditForm({
  image,
  onSubmit,
  submitting,
  onCancel,
}: {
  image: GalleryImage;
  onSubmit: (v: { id: string; caption: string; altText: string }) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [caption, setCaption] = useState(image.caption);
  const [altText, setAltText] = useState(image.altText);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ id: image.id, caption, altText });
      }}
      className="space-y-4"
    >
      <img
        src={image.url}
        alt={altText}
        className="max-h-56 w-full rounded-md border border-border object-contain"
      />
      <div className="space-y-1.5">
        <Label>Caption</Label>
        <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Alt text (screen readers)</Label>
        <Input value={altText} onChange={(e) => setAltText(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save image"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ImageAdder({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(uploadGalleryImage);

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
