#!/usr/bin/env node
/**
 * Unduh semua media nuha.care ke public/nuha-care/ (gambar + font dari mirror CSS).
 * Jalankan saat IP bisa akses: npm run download-nuha-assets
 */
import { mkdir, writeFile, copyFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://nuha.care";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = join(ROOT, "public", "nuha-care");
const MIRROR = join(ASSET_ROOT, "mirror");
const PUBLIC = join(ROOT, "public");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const STATIC_ASSETS = [
  "/images/svg/logo.svg",
  "/images/svg/logo_white.svg",
  "/images/svg/banner-section-one.svg",
  "/images/svg/bg-section-one.svg",
  "/images/svg/bg-section-three.svg",
  "/images/svg/bg-section-seven.svg",
  "/images/svg/portrait-section-six.svg",
  "/images/svg/pyramid-section-two.svg",
  "/images/svg/pyramid-section-mobile.svg",
  "/images/svg/testimony_quote.svg",
  "/images/svg/user_profile1.svg",
  "/images/svg/section-four-list/item1.svg",
  "/images/svg/section-four-list/item2.svg",
  "/images/svg/section-four-list/item3.svg",
  "/images/svg/section-four-list/item4.svg",
  "/images/svg/section-four-list/item5.svg",
  "/images/svg/section-five-list/item1.svg",
  "/images/svg/section-five-list/item2.svg",
  "/images/svg/section-five-list/item3.svg",
  "/images/svg/section-five-list/item4.svg",
  "/images/svg/section-five-list/item5.svg",
  "/images/jpeg/dr_adrian.jpeg",
  "/images/jpeg/dr_wayan.jpeg",
  "/images/png/banner-section-one.png",
  "/favicon.ico",
];

function collectPathsFromText(text) {
  const paths = new Set();
  for (const m of text.matchAll(/(?:src|href)=["'](\/images\/[^"']+)["']/gi)) {
    paths.add(m[1]);
  }
  for (const m of text.matchAll(/url\(["']?(\/images\/[^"')]+)["']?\)/gi)) {
    paths.add(m[1]);
  }
  for (const m of text.matchAll(/url\(&#x27;(\/images\/[^&#]+)&#x27;\)/gi)) {
    paths.add(m[1]);
  }
  for (const m of text.matchAll(/\/_next\/static\/media\/[a-zA-Z0-9._-]+\.woff2/g)) {
    paths.add(m[0]);
  }
  return paths;
}

async function download(path) {
  const dest = join(ASSET_ROOT, path.replace(/^\//, ""));
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(BASE + path, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function downloadFontToMirror(fontPath) {
  const dest = join(MIRROR, fontPath.replace(/^\//, ""));
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(BASE + fontPath, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  const paths = new Set(STATIC_ASSETS);

  try {
    const home = await fetch(BASE + "/", { headers: { "User-Agent": UA } }).then((r) =>
      r.text(),
    );
    for (const p of collectPathsFromText(home)) paths.add(p);
  } catch (e) {
    console.warn("Skip live homepage scrape:", e.message);
  }

  try {
    const body = await readFile(join(MIRROR, "body.html"), "utf8");
    for (const p of collectPathsFromText(body)) {
      if (p.startsWith("/images/")) paths.add(p);
    }
  } catch {
    /* mirror belum ada */
  }

  for (const cssFile of ["css/bundle-0.css", "css/bundle-1.css", "css/bundle-2.css"]) {
    try {
      const cssPath = join(MIRROR, cssFile);
      const css = await readFile(cssPath, "utf8");
      for (const p of collectPathsFromText(css)) {
        if (p.startsWith("/_next/")) {
          try {
            const size = await downloadFontToMirror(p);
            console.log(`OK font ${String(size).padStart(7)} ${p}`);
          } catch (e) {
            console.error(`FAIL font ${p}:`, e.message);
          }
        }
      }
    } catch {
      /* css belum ada */
    }
  }

  let ok = 0;
  let fail = 0;
  for (const path of [...paths].sort()) {
    if (path.startsWith("/_next/")) continue;
    try {
      const size = await download(path);
      console.log(`OK ${String(size).padStart(7)} ${path}`);
      ok++;
    } catch (e) {
      console.error(`FAIL ${path}:`, e.message);
      fail++;
    }
  }

  const logo = join(ASSET_ROOT, "images/svg/logo.svg");
  const logoWhite = join(ASSET_ROOT, "images/svg/logo_white.svg");
  try {
    await copyFile(logo, join(PUBLIC, "logo-nuha.svg"));
    await copyFile(logoWhite, join(PUBLIC, "logo-nuha-white.svg"));
    console.log("Copied logos → public/logo-nuha.svg");
  } catch {
    console.warn("Logo copy skipped (file missing)");
  }

  console.log(`Done: ${ok} ok, ${fail} failed, ${paths.size} image paths`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
