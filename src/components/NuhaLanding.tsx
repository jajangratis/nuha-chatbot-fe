"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatedCounter } from "@/components/nuha/AnimatedCounter";
import { Reveal } from "@/components/nuha/Reveal";
import {
  NUHA_FEATURES,
  NUHA_HERO_PILLARS,
  NUHA_PARTNER_HOSPITALS,
  NUHA_PROBLEMS,
  NUHA_SERVICES,
  NUHA_SOLUTIONS,
  NUHA_STATS,
  NUHA_TESTIMONIALS,
} from "@/lib/nuha-stats";

const NAV_LINKS = [
  { label: "Layanan Kami", href: "https://nuha.care/client/layanan-kami/emr" },
  { label: "Sahabat NUHA", href: "https://nuha.care/client/sahabat-nuha" },
  { label: "Pusat Bantuan", href: "https://nuha.care/client/articles" },
  { label: "Request Demo", href: "https://nuha.care/client/request-demo" },
];

export function NuhaLanding() {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % NUHA_TESTIMONIALS.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="nuha-landing bg-[#F5F5F5] text-[#0B1D15]">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          headerScrolled
            ? "bg-[#032626]/95 shadow-lg backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="https://nuha.care/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <NuhaLogo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/90 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-[#AAE053]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="https://nuha.care/client/request-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105 md:text-sm"
          >
            Request Demo
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#032626] via-[#0B6463] to-[#014547] pb-20 pt-28 text-white md:pb-28 md:pt-36">
        <div className="nuha-hero-orb nuha-hero-orb--1" aria-hidden />
        <div className="nuha-hero-orb nuha-hero-orb--2" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#AAE053] md:text-sm">
              Nuha Care
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h1 className="max-w-3xl text-2xl font-bold leading-tight md:text-4xl lg:text-[2.75rem]">
              Sistem Informasi Pelayanan Kesehatan yang Terbaik dan Inovatif di
              Indonesia
            </h1>
          </Reveal>
          <div className="mt-8 flex flex-wrap gap-3">
            {NUHA_HERO_PILLARS.map((pillar, i) => (
              <Reveal key={pillar} delayMs={120 + i * 80}>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs backdrop-blur-sm md:text-sm">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#AAE053] nuha-pulse-dot" />
                  {pillar}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-10 mx-auto max-w-6xl px-4 md:-mt-14 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={NUHA_STATS.satisfaction.title}
            sub={NUHA_STATS.satisfaction.subtitle}
            value={NUHA_STATS.satisfaction.value}
            prefix={NUHA_STATS.satisfaction.prefix}
            suffix={NUHA_STATS.satisfaction.suffix}
            decimals={2}
            accent="mint"
            delay={0}
          />
          <StatCard
            label={NUHA_STATS.clientGrowth.title}
            sub="Mitra rumah sakit & klinik"
            value={NUHA_STATS.clientGrowth.value}
            prefix="+"
            accent="green"
            delay={80}
            extra={
              <p className="mt-2 text-lg font-bold text-[#639B15]">
                <AnimatedCounter
                  value={NUHA_STATS.clientGrowth.growthPercent}
                  suffix="%"
                />{" "}
                <span className="text-xs font-normal text-[#717171]">
                  pertumbuhan
                </span>
              </p>
            }
          />
          <StatCard
            label="24 jam"
            sub={`${NUHA_STATS.support.value}${NUHA_STATS.support.suffix} ${NUHA_STATS.support.label}`}
            value={NUHA_STATS.support.value}
            suffix={NUHA_STATS.support.suffix}
            accent="teal"
            delay={160}
            hideCounter
          />
          <StatCard
            label="Engineer"
            sub="Pengembang fitur terbaru"
            value={NUHA_STATS.engineers.value}
            suffix={NUHA_STATS.engineers.suffix}
            accent="green"
            delay={240}
          />
        </div>
      </section>

      {/* Clients / RS count */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#07C5BA]">
              Dipercaya di Seluruh Indonesia
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#014547] md:text-3xl">
              Lebih dari{" "}
              <AnimatedCounter
                value={NUHA_STATS.totalClients.value}
                suffix={NUHA_STATS.totalClients.suffix}
                className="text-[#639B15]"
              />{" "}
              Klien kami
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#717171] md:text-base">
              Kami telah bekerja dengan rumah sakit dan klinik di seluruh
              Indonesia — mitra yang merasakan transformasi digital bersama
              NUHA.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <ClientTypeBadge
              label={NUHA_STATS.hospitals.label}
              value={NUHA_STATS.hospitals.value}
              suffix={NUHA_STATS.hospitals.suffix}
            />
            <ClientTypeBadge
              label={NUHA_STATS.clinics.label}
              value={NUHA_STATS.clinics.value}
              suffix={NUHA_STATS.clinics.suffix}
            />
            <div className="rounded-2xl border border-[#AAE053]/50 bg-white px-6 py-4 text-center shadow-sm">
              <p className="text-xs text-[#717171]">Kepuasan mitra</p>
              <p className="mt-1 text-2xl font-bold text-[#014547]">
                <AnimatedCounter
                  value={NUHA_STATS.rating.value}
                  suffix={NUHA_STATS.rating.suffix}
                  decimals={1}
                />
              </p>
            </div>
          </div>
        </Reveal>

        <div className="nuha-marquee-mask relative mt-12 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white py-6">
          <div className="nuha-marquee-track flex gap-8">
            {[...NUHA_PARTNER_HOSPITALS, ...NUHA_PARTNER_HOSPITALS].map(
              (name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 rounded-full border border-[#E0E0E0] bg-[#F8FBF3] px-5 py-2.5 text-sm font-medium text-[#014547] whitespace-nowrap"
                >
                  {name}
                </span>
              ),
            )}
          </div>
        </div>

        <Reveal delayMs={120}>
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-[#0B1D15]/80 md:text-base">
            Bagaimana kami mendukung mitra kami di Indonesia — implementasi
            terstruktur, pelatihan berkelanjutan, dan dukungan teknis responsif
            agar setiap rumah sakit bertransformasi secara digital dengan
            percaya diri.
          </p>
        </Reveal>
      </section>

      {/* Services */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <h2 className="text-center text-2xl font-bold text-[#014547] md:text-3xl">
              Layanan Kami
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NUHA_SERVICES.map((svc, i) => (
              <Reveal key={svc.title} delayMs={i * 60}>
                <a
                  href={svc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-5 transition hover:-translate-y-1 hover:border-[#07C5BA]/40 hover:shadow-lg"
                >
                  <h3 className="font-bold text-[#014547] group-hover:text-[#07C5BA]">
                    {svc.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-[#717171]">{svc.desc}</p>
                  <span className="mt-4 text-xs font-semibold text-[#639B15]">
                    Pelajari →
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <Reveal>
          <h2 className="text-2xl font-bold text-[#014547] md:text-3xl">
            Fitur Utama Nuha
          </h2>
        </Reveal>
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {NUHA_FEATURES.map((feat, i) => (
            <Reveal key={feat} delayMs={i * 50}>
              <li className="flex gap-3 rounded-xl border border-[#AAE053]/30 bg-white p-4 text-sm shadow-sm">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] text-xs font-bold text-white">
                  ✓
                </span>
                {feat}
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Problems & Solutions */}
      <section className="bg-gradient-to-b from-[#032626] to-[#014547] py-16 text-white md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <h2 className="text-center text-2xl font-bold md:text-3xl">
              Masalah yang sering dialami?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-white/75">
              Tantangan operasional rumah sakit — kami paham, dan hadir dengan
              solusi.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {NUHA_PROBLEMS.map((p, i) => (
              <Reveal key={p.title} delayMs={i * 70}>
                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <h3 className="font-semibold text-[#AAE053]">{p.title}</h3>
                  <p className="mt-2 text-sm text-white/80">{p.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delayMs={100}>
            <h2 className="mt-16 text-center text-2xl font-bold md:text-3xl">
              Solusi terbaik dari Nuha Care
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {NUHA_SOLUTIONS.map((s, i) => (
              <Reveal key={s.title} delayMs={i * 60}>
                <article className="rounded-2xl bg-white/10 p-5 ring-1 ring-[#07C5BA]/30">
                  <h3 className="font-semibold text-[#07C5BA]">{s.title}</h3>
                  <p className="mt-2 text-sm text-white/85">{s.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6">
        <Reveal>
          <blockquote className="text-lg italic leading-relaxed text-[#014547] md:text-xl">
            &ldquo;Perkembangan industri kesehatan berkembang sangat cepat,
            apabila pelayanan kesehatan terlambat melakukan transformasi digital,
            maka akan sulit berkembang karena tidak relevan dengan
            lingkungannya&rdquo;
          </blockquote>
          <cite className="mt-4 block text-sm font-semibold not-italic text-[#717171]">
            — Dr. dr. Ediansyah, MARS, MM.
          </cite>
        </Reveal>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <h2 className="text-center text-2xl font-bold text-[#014547]">
              What Our Happy User Says
            </h2>
          </Reveal>
          <div className="relative mt-10 min-h-[220px] overflow-hidden">
            {NUHA_TESTIMONIALS.map((t, i) => (
              <article
                key={t.name}
                className={`absolute inset-x-0 top-0 rounded-2xl border border-[#E8E8E8] bg-[#F8FBF3] p-6 transition-all duration-700 md:p-8 ${
                  i === testimonialIndex
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-4 opacity-0"
                }`}
              >
                <p className="text-sm leading-relaxed text-[#0B1D15] md:text-base">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-4 border-t border-[#E8E8E8] pt-4">
                  <p className="font-semibold text-[#014547]">{t.name}</p>
                  <p className="text-xs text-[#717171]">{t.role}</p>
                </footer>
              </article>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            {NUHA_TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => setTestimonialIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === testimonialIndex
                    ? "w-8 bg-[#639B15]"
                    : "w-2 bg-[#E0E0E0]"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-[#032626] py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center md:px-6">
          <NuhaLogo inverted />
          <p className="max-w-lg text-sm text-white/75">
            Your All-in-One E-Medical Record Solution — transformasi digital
            rumah sakit bersama NUHA.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://nuha.care/client/request-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] px-6 py-3 text-sm font-semibold shadow-lg transition hover:scale-105"
            >
              Request Demo
            </a>
            <a
              href="https://nuha.care/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
            >
              Kunjungi nuha.care
            </a>
          </div>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Nuha Care. Halaman ini menampilkan
            informasi resmi dari nuha.care.
          </p>
        </div>
      </footer>
    </div>
  );
}

function NuhaLogo({ inverted = false }: { inverted?: boolean }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span
        className={`text-xl font-bold tracking-tight ${inverted ? "text-white" : "text-white"}`}
      >
        <span className="text-[#AAE053]">N</span>UHA
      </span>
    );
  }

  return (
    <Image
      src="https://nuha.care/logo-nuha.png"
      alt="Nuha"
      width={120}
      height={36}
      className={`h-8 w-auto object-contain md:h-9 ${inverted ? "brightness-0 invert" : ""}`}
      onError={() => setImgError(true)}
      unoptimized
    />
  );
}

function StatCard({
  label,
  sub,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  accent,
  delay,
  extra,
  hideCounter,
}: {
  label: string;
  sub: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent: "mint" | "green" | "teal";
  delay: number;
  extra?: ReactNode;
  hideCounter?: boolean;
}) {
  const accentMap = {
    mint: "from-[#07C5BA] to-[#0B6463]",
    green: "from-[#639B15] to-[#AAE053]",
    teal: "from-[#014547] to-[#07C5BA]",
  };

  return (
    <Reveal delayMs={delay}>
      <article className="flex h-full flex-col rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-[0_8px_32px_rgba(1,69,71,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#717171]">
          {label}
        </p>
        {hideCounter ? (
          <p className="mt-2 text-2xl font-bold text-[#014547]">{sub}</p>
        ) : (
          <p
            className={`mt-2 bg-gradient-to-r ${accentMap[accent]} bg-clip-text text-3xl font-bold text-transparent md:text-4xl`}
          >
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          </p>
        )}
        <p className="mt-1 text-xs text-[#717171]">{sub}</p>
        {extra}
      </article>
    </Reveal>
  );
}

function ClientTypeBadge({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="min-w-[140px] rounded-2xl bg-gradient-to-br from-[#032626] to-[#0B6463] px-8 py-6 text-center text-white shadow-lg">
      <p className="text-3xl font-bold md:text-4xl">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="mt-1 text-sm text-white/80">{label}</p>
    </div>
  );
}
