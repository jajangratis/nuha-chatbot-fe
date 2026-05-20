/** Angka resmi dari nuha.care & halaman Sahabat NUHA */
export const NUHA_STATS = {
  satisfaction: {
    value: 98.55,
    prefix: "+",
    suffix: "%",
    title: "User Satisfaction",
    subtitle: "Pengguna Puas",
  },
  clientGrowth: {
    value: 70,
    prefix: "+",
    suffix: "",
    growthPercent: 400,
    title: "Client Growth",
  },
  hospitals: { value: 80, suffix: "++", label: "Rumah Sakit" },
  clinics: { value: 16, suffix: "++", label: "Klinik" },
  totalClients: { value: 70, suffix: "+", label: "Klien" },
  engineers: { value: 100, suffix: "++", label: "Engineer" },
  support: { value: 20, suffix: "+", label: "IT Application Support" },
  rating: { value: 4.8, suffix: "/5", label: "Kepuasan Sahabat NUHA" },
} as const;

export const NUHA_HERO_PILLARS = [
  "Mendukung Klinis",
  "Memudahkan Pasien",
  "Mengoptimalkan Operasional Rumah Sakit",
] as const;

export const NUHA_SERVICES = [
  {
    title: "Nuha EMR",
    desc: "Transformasi Digital Rekam Medis Rumah Sakit, Lebih Cepat, Aman, dan Terintegrasi.",
    href: "https://nuha.care/client/layanan-kami/emr",
  },
  {
    title: "Nuha SIMRS",
    desc: "Pusat Kendali Operasional Rumah Sakit yang Terintegrasi dan Efisien.",
    href: "https://nuha.care/client/layanan-kami/simrs",
  },
  {
    title: "Nuha HRIS",
    desc: "Transformasi Digital SDM Rumah Sakit dan Perusahaan Anda.",
    href: "https://nuha.care/client/layanan-kami/hris",
  },
  {
    title: "Nuha Klinik",
    desc: "Optimalkan Pelayanan Klinik Anda dengan Sistem Informasi Terpadu.",
    href: "https://nuha.care/client/layanan-kami/klinik",
  },
  {
    title: "Nuha Konsolidasi",
    desc: "Satu Platform Akuntansi Terintegrasi untuk Grup Rumah Sakit dan Klinik.",
    href: "https://nuha.care/client/layanan-kami/konsolidasi",
  },
] as const;

export const NUHA_FEATURES = [
  "Otomatisasi klaim JKN, termasuk validasi dan pelacakan klaim.",
  "Auto grouping INA-CBG & Spesial CMG berdasarkan diagnosa dan tindakan medis.",
  "Finalisasi klaim yang langsung terhubung dengan sistem pelaporan.",
  "Pengiriman data ke Casemix Center Kemenkes secara langsung dan aman.",
  "Purifikasi & rekonsiliasi berkas klaim, memudahkan audit dan mengurangi klaim tertolak.",
] as const;

export const NUHA_PROBLEMS = [
  {
    title: "Proses klaim yang masih manual",
    desc: "Menyebabkan keterlambatan pencairan dana, beban administratif tinggi, dan risiko kesalahan input.",
  },
  {
    title: "Perubahan regulasi yang cepat dan dinamis",
    desc: "Rumah sakit kesulitan beradaptasi cepat terhadap kebijakan baru, mulai dari tarif INA-CBG hingga aturan pemanfaatan layanan.",
  },
  {
    title: "Pengeluaran Obat Melebihi Batas Maksimal Klaim Asuransi",
    desc: "Kurangnya sistem kontrol menyebabkan pengeluaran obat yang tidak bisa diklaim.",
  },
  {
    title: "Pendaftaran Pasien Masih Manual",
    desc: "Antrean panjang, kesalahan data, dan duplikasi rekam medis masih menjadi masalah harian.",
  },
  {
    title: "Billing Masih Manual",
    desc: "Proses penagihan tidak terintegrasi antar unit menyebabkan keterlambatan dan kesalahan tagihan.",
  },
] as const;

export const NUHA_SOLUTIONS = [
  {
    title: "Otomatisasi Casemix",
    desc: "NUHA menghadirkan fitur otomatisasi penuh proses Casemix untuk mempercepat klaim JKN.",
  },
  {
    title: "Sistem Selalu Update Sesuai Regulasi",
    desc: "Arsitektur fleksibel dan tim pengembang siaga menyesuaikan perubahan regulasi Kemenkes & BPJS.",
  },
  {
    title: "Notifikasi Harga Obat Melebihi Batas Klaim",
    desc: "Pengendalian pengeluaran obat melalui notifikasi otomatis saat resep melebihi batas klaim.",
  },
  {
    title: "Digitalisasi Pendaftaran Pasien — APM & Mobile JKN",
    desc: "Pendaftaran digital terintegrasi untuk mengurangi antrean dan kesalahan data.",
  },
  {
    title: "Otomatisasi Billing Rumah Sakit",
    desc: "Billing terintegrasi dan otomatis dari pendaftaran hingga pembayaran.",
  },
] as const;

export const NUHA_TESTIMONIALS = [
  {
    quote:
      "Tampilan Klinik-nya sangat baik, mudah digunakan, dan benar-benar membantu dalam operasional. Kami juga menggunakan NUHA Klinik, dan tampilannya yang simpel membuat navigasi jadi lebih mudah.",
    name: "dr. Pusposari Purwoko, MARS",
    role: "Manajer IGD dan Rajal RS AN-Nisa Tangerang",
  },
  {
    quote:
      "Sistem NUHA sangat membantu kami dalam pengelolaan manajemen operasional di RS Elim Rantepao, berkat tampilan yang user-friendly dan mudah digunakan.",
    name: "dr. Adrian B. Wijaya, MARS",
    role: "Direktur Rumah Sakit Elim Rantepao",
  },
  {
    quote:
      "NUHA fiturnya udah lengkap banget dari asessmen sampai resume medis yang sering jadi masalah, tapi di NUHA semuanya lancar, sangat membantu rumah sakit kami",
    name: "dr. Ni Wayan Ari Aninditha, MARS",
    role: "Rumah Sakit Ari Canti Bali",
  },
] as const;

export const NUHA_PARTNER_HOSPITALS = [
  "RS AN-Nisa Tangerang",
  "RS Elim Rantepao",
  "RS Ari Canti Bali",
  "RS Hermina",
  "RS Mitra Keluarga",
  "RS Awal Bros",
  "RS EMC",
  "RS Kasih Ibu",
  "RS Pelita Insani",
  "RS Bhayangkara",
  "RSUD Regional",
  "Klinik Pratama Sehat",
] as const;
