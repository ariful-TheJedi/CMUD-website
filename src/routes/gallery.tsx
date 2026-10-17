import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Expand } from "lucide-react";
import { listPublicAlbums, type PublicAlbum } from "@/lib/gallery.functions";
import { galleryPage } from "@/data/gallery";
import { assetUrl } from "@/lib/assets";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { PageIntro } from "@/components/PageIntro";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: galleryPage.meta.title },
      { name: "robots", content: "index, follow" },
      { name: "description", content: galleryPage.meta.description },
      { property: "og:title", content: galleryPage.meta.ogTitle },
      { property: "og:description", content: galleryPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["public-gallery"],
      queryFn: () => listPublicAlbums(),
    }),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-16 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="container mx-auto px-4 py-16">Not found</div>,
  component: GalleryPage,
});

type LightboxState = { images: PublicAlbum["images"]; index: number; albumTitle: string };

function GalleryPage() {
  const listAlbums = useServerFn(listPublicAlbums);
  const { data: albums } = useSuspenseQuery({
    queryKey: ["public-gallery"],
    queryFn: () => listAlbums(),
  });
  const { hero } = galleryPage;
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  return (
    <>
      <div className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_15%_0%,color-mix(in_oklab,var(--color-secondary)_20%,transparent),transparent_42%),radial-gradient(ellipse_at_90%_45%,color-mix(in_oklab,var(--color-primary-glow)_24%,transparent),transparent_38%)]">
        <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
        <PageIntro eyebrow={hero.eyebrow} title={hero.title} description={hero.description} />
      </div>

      <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_15%_0%,color-mix(in_oklab,var(--color-secondary)_20%,transparent),transparent_42%),radial-gradient(ellipse_at_90%_45%,color-mix(in_oklab,var(--color-primary-glow)_24%,transparent),transparent_38%)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-24 -z-10 h-96 w-96 rounded-full bg-primary-glow/10 blur-3xl" />
        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {albums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
            <p className="font-serif text-xl font-bold text-foreground">{galleryPage.imagesComingSoon}</p>
            <p className="mt-2 text-sm text-muted-foreground">New photos will appear here as albums are added.</p>
          </div>
        ) : (
          <div className="space-y-12 lg:space-y-16">
            {albums.map((album) => (
              <AlbumBlock
                key={album.id}
                album={album}
                onImageClick={(index) =>
                  setLightbox({ images: album.images, index, albumTitle: album.title })
                }
              />
            ))}
          </div>
        )}
        </div>
      </section>

      <GalleryLightbox
        images={lightbox?.images ?? []}
        index={lightbox?.index ?? 0}
        albumTitle={lightbox?.albumTitle ?? ""}
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      />
    </>
  );
}

function AlbumBlock({
  album,
  onImageClick,
}: {
  album: PublicAlbum;
  onImageClick: (index: number) => void;
}) {
  return (
    <article>
      <header className="mb-5 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-xl font-bold md:text-2xl">{album.title}</h2>
          {album.category ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {album.category}
            </span>
          ) : null}
        </div>
        {album.caption ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{album.caption}</p>
        ) : null}
      </header>

      {album.images.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {album.images.map((img, index) => (
            <figure
              key={img.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <button
                type="button"
                onClick={() => onImageClick(index)}
                  className="relative block w-full cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                aria-label={`View photo ${index + 1} of ${album.images.length} in ${album.title}`}
              >
                <img
                  src={assetUrl(img.url)}
                  alt={img.altText || album.title}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                  <Expand className="h-6 w-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </span>
              </button>
              {img.caption ? (
                <figcaption className="p-3 text-xs text-muted-foreground">{img.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : (
        <div className="flex aspect-[4/1] items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-sm text-muted-foreground">
          {galleryPage.imagesComingSoon}
        </div>
      )}
    </article>
  );
}
