import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Expand } from "lucide-react";
import { listPublicAlbums, type PublicAlbum } from "@/lib/gallery.functions";
import { galleryPage } from "@/data/gallery";
import { assetUrl } from "@/lib/assets";
import { GalleryLightbox } from "@/components/GalleryLightbox";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: galleryPage.meta.title },
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
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-10">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {hero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            {hero.description}
          </p>
        </div>
      </section>

      <section className="container mx-auto space-y-8 px-4 py-10">
        {albums.map((album) => (
          <AlbumBlock
            key={album.id}
            album={album}
            onImageClick={(index) =>
              setLightbox({ images: album.images, index, albumTitle: album.title })
            }
          />
        ))}
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
      <header className="mb-5">
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
              className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <button
                type="button"
                onClick={() => onImageClick(index)}
                className="relative block w-full cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
