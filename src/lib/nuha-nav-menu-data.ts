export const NUHA_NAV_DROPDOWN_LABELS = ["Layanan Kami", "Resources"] as const;

export type NuhaNavDropdownLabel = (typeof NUHA_NAV_DROPDOWN_LABELS)[number];

export type NuhaNavMenuItem = {
  title: string;
  href: string;
  logo: string;
  description: string;
};

export type NuhaNavMenuGroup = {
  sectionTitle: string;
  items: NuhaNavMenuItem[];
};

/** Data nav dari nuha.care layout (logo per item dropdown). */
export const NUHA_NAV_DROPDOWNS: Record<NuhaNavDropdownLabel, NuhaNavMenuGroup> = {
  "Layanan Kami": {
    sectionTitle: "Layanan",
    items: [
      {
        title: "Nuha EMR",
        href: "/client/layanan-kami/emr",
        logo: "/images/svg/layanan-kami/logo_EMR.svg",
        description:
          "Transformasi Digital Rekam Medis Rumah Sakit, Lebih Cepat, Aman, dan Terintegrasi.",
      },
      {
        title: "Nuha SIMRS",
        href: "/client/layanan-kami/simrs",
        logo: "/images/svg/layanan-kami/logo_SIMRS.svg",
        description:
          "Pusat Kendali Operasional Rumah Sakit yang Terintegrasi dan Efisien.",
      },
      {
        title: "Nuha HRIS",
        href: "/client/layanan-kami/hris",
        logo: "/images/svg/layanan-kami/logo_HRIS.svg",
        description:
          "Transformasi Digital SDM Rumah Sakit dan Perusahaan Anda.",
      },
      {
        title: "Nuha Klinik",
        href: "/client/layanan-kami/klinik",
        logo: "/images/svg/layanan-kami/logo_KLINIK.svg",
        description:
          "Optimalkan Pelayanan Klinik Anda dengan Sistem Informasi Terpadu, Terintegrasi dan Efisien.",
      },
      {
        title: "Nuha Konsolidasi",
        href: "/client/layanan-kami/konsolidasi",
        logo: "/images/svg/layanan-kami/logo_KONSOLIDASI.svg",
        description:
          "Satu Platform Akuntansi Terintegrasi untuk Grup Rumah Sakit dan Klinik.",
      },
    ],
  },
  Resources: {
    sectionTitle: "News & Insights",
    items: [
      {
        title: "Blog",
        href: "/client/blogs",
        logo: "/images/svg/resources/logo_Blog.svg",
        description:
          "Insight dan strategi seputar manajemen operasional, teknologi digital, dan pengembangan sistem di sektor layanan kesehatan.",
      },
      {
        title: "News",
        href: "/client/news",
        logo: "/images/svg/resources/logo_News.svg",
        description:
          "Informasi terbaru dari Nuha: rilis fitur, pengumuman resmi, kolaborasi, dan perkembangan perusahaan.",
      },
      {
        title: "Pusat Bantuan",
        href: "/client/articles",
        logo: "/images/svg/resources/logo_PusatBantuan.svg",
        description:
          "Panduan lengkap penggunaan aplikasi Nuha untuk mendukung efisiensi kerja dan implementasi sistem.",
      },
      {
        title: "FAQ",
        href: "/client/faq",
        logo: "/images/webp/faq/faqs-icon.webp",
        description:
          "Pertanyaan umum mengenai Nuha, layanan, dan solusi yang kami tawarkan.",
      },
    ],
  },
};

/** Path asset dropdown untuk npm run download-nuha-assets */
export const NUHA_NAV_ASSET_PATHS = [
  ...new Set(
    Object.values(NUHA_NAV_DROPDOWNS).flatMap((g) => g.items.map((i) => i.logo)),
  ),
];
