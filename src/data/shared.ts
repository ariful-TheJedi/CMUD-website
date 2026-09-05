/** Shared site media used by layout (header / footer) and site icon. */
import { assetUrl } from "@/lib/assets";
/** Bundled like Next.js `app/favicon.ico` — lives in src/, not public/. */
import faviconUrl from "@/assets/favicon.png?url";
import { footerData } from "@/data/footer";

const HEADER_LOGO = "/media/shared/cmud-logo.webp";

export const sharedMedia = {
  get headerLogo() {
    return assetUrl(HEADER_LOGO);
  },
  get footerLogo() {
    return assetUrl(footerData.logo);
  },
  /** Vite-hashed URL from src/assets (included in build output). */
  favicon: faviconUrl,
};
