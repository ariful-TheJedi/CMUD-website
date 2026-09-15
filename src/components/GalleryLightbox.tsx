import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import type { GalleryImage } from "@/lib/gallery.functions";

type GalleryLightboxProps = {
  images: GalleryImage[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumTitle: string;
};

export function GalleryLightbox({
  images,
  index,
  open,
  onOpenChange,
  albumTitle,
}: GalleryLightboxProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="fixed inset-0 z-[200] flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">
            {albumTitle ? `${albumTitle} — photo viewer` : "Photo viewer"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Swipe or use the arrow keys to browse photos. Press Escape to close.
          </DialogPrimitive.Description>
          <LightboxBody images={images} startIndex={index} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function LightboxBody({ images, startIndex }: { images: GalleryImage[]; startIndex: number }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex,
    loop: images.length > 1,
    align: "center",
  });
  const [selected, setSelected] = React.useState(startIndex);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") emblaApi?.scrollPrev();
      if (event.key === "ArrowRight") emblaApi?.scrollNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emblaApi]);

  const current = images[selected];

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="font-sans text-xs font-medium tabular-nums tracking-wide text-white/70">
          {images.length > 0 ? `${selected + 1} / ${images.length}` : null}
        </span>
        <DialogPrimitive.Close
          className="-mr-2 rounded-full p-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </DialogPrimitive.Close>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative flex h-full min-w-0 flex-[0_0_100%] items-center justify-center px-3 sm:px-8"
            >
              <img
                src={assetUrl(img.url)}
                alt={img.altText || albumAltFallback(img)}
                className="max-h-full max-w-full select-none rounded-sm object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous image"
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 sm:left-4 sm:p-3"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next image"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 sm:right-4 sm:p-3"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </>
      ) : null}

      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center sm:px-6">
        {current?.caption ? <p className="text-sm text-white/80">{current.caption}</p> : null}
      </div>
    </div>
  );
}

function albumAltFallback(img: GalleryImage) {
  return img.caption || "Gallery photo";
}
