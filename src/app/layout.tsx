import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nuha | Your All-in-One E-Medical Record Solution",
  description:
    "Sistem Informasi Pelayanan Kesehatan yang Terbaik dan Inovatif di Indonesia",
  keywords: [
    "nuha",
    "emr",
    "hris",
    "klinik",
    "software rumah sakit",
    "nuha care",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full overflow-x-hidden bg-[#F5F5F5] antialiased">
        {children}
      </body>
    </html>
  );
}
