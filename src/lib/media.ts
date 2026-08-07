/**
 * Home-page CMS image fallbacks — prefer `homePage.media` from `@/data/home`.
 * Kept for admin home editor fallbacks that still import this module.
 */
import { homePage } from "@/data/home";
import { sharedMedia } from "@/data/shared";

export const media = {
  shared: sharedMedia,
  home: {
    hero: homePage.media.heroFallback,
    handsOn: homePage.media.handsOnFallback,
  },
} as const;
