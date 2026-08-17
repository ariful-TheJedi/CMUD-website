/** Shared site media used by layout (header / footer) and site icon. */
import { assetUrl } from "@/lib/assets";

const HEADER_LOGO = "/media/shared/cmud-logo.webp";
const FOOTER_LOGO = "/media/shared/cmud-light-sea-green-transparent.png";

export const sharedMedia = {
  get headerLogo() {
    return assetUrl(HEADER_LOGO);
  },
  get footerLogo() {
    return assetUrl(FOOTER_LOGO);
  },
  /** Always on app origin — never uses VITE_ASSETS_PREFIX. */
  favicon: "/favicon.png",
};
