import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Local object URL shown immediately while / after upload (avoids Vite 404 race). */
  localPreviewSrc?: string | null;
};

/**
 * Admin media preview that:
 * 1. Prefers an in-memory blob URL when provided (instant after file pick)
 * 2. Applies VITE_ASSETS_PREFIX via assetUrl() so `/media/...` → `/cmud-assets/media/...`
 * 3. Retries the remote URL a few times if the first paint 404s
 */
export function AdminMediaImage({ src, alt, className, localPreviewSrc }: Props) {
  const remote = assetUrl(src?.trim() || "");
  const local = localPreviewSrc?.trim() || "";
  const [attempt, setAttempt] = useState(0);
  const [failedRemote, setFailedRemote] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailedRemote(false);
  }, [remote, local]);

  const displaySrc =
    local && (failedRemote || !remote)
      ? local
      : remote
        ? attempt > 0
          ? `${remote}${remote.includes("?") ? "&" : "?"}preview=${attempt}`
          : remote
        : local;

  if (!displaySrc) return null;

  return (
    <img
      key={`${displaySrc}-${attempt}`}
      src={displaySrc}
      alt={alt}
      className={cn(className)}
      onError={() => {
        if (local && remote && !failedRemote && displaySrc.startsWith(remote.split("?")[0]!)) {
          // Remote not ready yet — show blob and retry remote shortly.
          setFailedRemote(true);
          window.setTimeout(() => {
            setFailedRemote(false);
            setAttempt((n) => n + 1);
          }, 400);
          return;
        }
        if (remote && attempt < 5 && !local) {
          window.setTimeout(() => setAttempt((n) => n + 1), 300 * (attempt + 1));
        }
      }}
    />
  );
}

/** Create + revoke object URLs for file picks. */
export function useObjectUrl(file: File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}
