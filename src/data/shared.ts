/** Shared site media used by layout (header / footer) and site icon. */
import { assetUrl } from "@/lib/assets";
import { footerData } from "@/data/footer";

const HEADER_LOGO = "/media/shared/cmud-logo.webp";

export const sharedMedia = {
  get headerLogo() {
    return assetUrl(HEADER_LOGO);
  },
  get footerLogo() {
    return assetUrl(footerData.logo);
  },
};
