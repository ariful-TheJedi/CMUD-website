import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublicAlbums, type PublicAlbum } from "@/lib/gallery.functions";
import { galleryPage } from "@/data/gallery";

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

function GalleryPage() {
  const listAlbums = useServerFn(listPublicAlbums);
  const { data: albums } = useSuspenseQuery({
    queryKey: ["public-gallery"],
    queryFn: () => listAlbums(),
  });
  const { hero } = galleryPage;

  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-foreground/80">{hero.description}</p>
        </div>
      </section>

      <section className="container mx-auto space-y-12 px-4 py-16">
        {albums.map((album) => (
          <AlbumBlock key={album.id} album={album} />
        ))}
      </section>
    </>
  );
}

function AlbumBlock({ album }: { album: PublicAlbum }) {
  return (
    <article>
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-2xl font-bold">{album.title}</h2>
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
          {album.images.map((img) => (
            <figure
              key={img.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            >
              <img
                src={img.url}
                alt={img.altText || album.title}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
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
