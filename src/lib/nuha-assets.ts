import { withBasePath } from "@/lib/app-path";

/** Media nuha.care yang di-cache di `public/nuha-care/` (jalankan `npm run download-nuha-assets`). */
const NUHA_CARE_PUBLIC = "/nuha-care";

export function nuhaAsset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return withBasePath(`${NUHA_CARE_PUBLIC}${normalized}`);
}

export const NUHA_ASSETS = {
  logo: "/images/svg/logo.svg",
  logoWhite: "/images/svg/logo_white.svg",
  heroBg: "/images/svg/bg-section-one.svg",
  heroBannerSvg: "/images/svg/banner-section-one.svg",
  heroBannerPng: "/images/png/banner-section-one.png",
  pyramidDesktop: "/images/svg/pyramid-section-two.svg",
  pyramidMobile: "/images/svg/pyramid-section-mobile.svg",
  featuresBg: "/images/svg/bg-section-three.svg",
  testimonialBg: "/images/svg/bg-section-seven.svg",
  quotePortrait: "/images/svg/portrait-section-six.svg",
  testimonyQuote: "/images/svg/testimony_quote.svg",
  userProfilePlaceholder: "/images/svg/user_profile1.svg",
  drAdrian: "/images/jpeg/dr_adrian.jpeg",
  drWayan: "/images/jpeg/dr_wayan.jpeg",
  problemIcons: [
    "/images/svg/section-four-list/item1.svg",
    "/images/svg/section-four-list/item2.svg",
    "/images/svg/section-four-list/item3.svg",
    "/images/svg/section-four-list/item4.svg",
    "/images/svg/section-four-list/item5.svg",
  ],
  solutionIcons: [
    "/images/svg/section-five-list/item1.svg",
    "/images/svg/section-five-list/item2.svg",
    "/images/svg/section-five-list/item3.svg",
    "/images/svg/section-five-list/item4.svg",
    "/images/svg/section-five-list/item5.svg",
  ],
} as const;
