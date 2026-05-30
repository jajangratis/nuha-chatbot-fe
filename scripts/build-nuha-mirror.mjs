#!/usr/bin/env node
/**
 * Snapshot HTML + CSS nuha.care untuk clone offline (tanpa iframe).
 * Jalankan saat IP bisa akses: npm run build-nuha-mirror
 */
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://nuha.care";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const MIRROR = join(PUBLIC, "nuha-care", "mirror");
const ASSET_ROOT = join(PUBLIC, "nuha-care");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const PARTNER_TILES = [
  "RS AN-Nisa",
  "RS Elim Rantepao",
  "RS Ari Canti",
  "RS Hermina",
  "RS Mitra Keluarga",
  "RS Awal Bros",
  "RS EMC",
  "RS Kasih Ibu",
  "RS Pelita Insani",
  "RS Bhayangkara",
  "RSUD Regional",
  "Klinik Sehat",
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function fetchBinary(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  await mkdir(dirname(dest), { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

function decodeNextImageUrl(src) {
  const m = src.match(/[?&]url=([^&]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

function rewriteAssetPaths(html) {
  let out = html;

  out = out.replace(
    /src="\/_next\/image\?[^"]+"/gi,
    (tag) => {
      const path = decodeNextImageUrl(tag);
      if (!path) return tag;
      return `src="__NUHA_BASE__/nuha-care${path}"`;
    },
  );

  out = out.replace(
    /srcset="([^"]+)"/gi,
    (_, srcset) => {
      const fixed = srcset
        .split(",")
        .map((part) => {
          const pieces = part.trim().split(/\s+/);
          const url = pieces[0] ?? "";
          const path = decodeNextImageUrl(url) || url.replace(BASE, "");
          const local = path.startsWith("/")
            ? `__NUHA_BASE__/nuha-care${path}`
            : path;
          const descriptor = pieces.slice(1).join(" ");
          return descriptor ? `${local} ${descriptor}` : local;
        })
        .join(", ");
      return `srcset="${fixed}"`;
    },
  );

  out = out.replace(/src="\/images\//gi, 'src="__NUHA_BASE__/nuha-care/images/');
  out = out.replace(
    /url\(&#x27;\/images\/([^&#]+)&#x27;\)/g,
    "url('__NUHA_BASE__/nuha-care/images/$1')",
  );
  out = out.replace(
    /url\('\/images\/([^')]+)'\)/g,
    "url('__NUHA_BASE__/nuha-care/images/$1')",
  );
  out = out.replace(/url\(\/images\//g, "url(__NUHA_BASE__/nuha-care/images/");
  out = out.replace(
    /url\(__NUHA_BASE__\/nuha-care\/images\/([^)]+)\)/g,
    "url('__NUHA_BASE__/nuha-care/images/$1')",
  );
  out = out.replace(/href="\/images\//gi, 'href="__NUHA_BASE__/nuha-care/images/');

  return out;
}

function patchCloneHtml(html) {
  let out = html;

  out = out.replace(/<div hidden="">[\s\S]*?<\/div>/, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");

  out = out.replace(
    /opacity-0 transition-opacity duration-1000/g,
    "opacity-100",
  );

  out = out.replace(
    /Lebih dari <!-- -->0<!-- -->\+/g,
    "Lebih dari 70+",
  );

  let partnerIdx = 0;
  out = out.replace(
    /<div class="w-24 h-24 bg-gray-200 animate-pulse rounded-lg"><\/div>/g,
    () => {
      const name = PARTNER_TILES[partnerIdx % PARTNER_TILES.length];
      partnerIdx += 1;
      return `<div class="flex h-24 w-24 items-center justify-center rounded-lg border border-[#E0E0E0] bg-white p-2 text-center text-[10px] font-semibold leading-tight text-[#014547]">${name}</div>`;
    },
  );

  out = out.replace(
    /<div class="relative w-full h-\[300px\]"><div class="absolute inset-0 bg-gray-200 animate-pulse rounded-lg"><\/div><\/div>/,
    `<div class="relative w-full h-[300px] flex items-center justify-center rounded-lg bg-gradient-to-br from-[#032626]/10 to-[#07C5BA]/10 p-6"><p class="text-center text-lg font-medium text-[#014547]">Transformasi digital RS &amp; klinik bersama NUHA</p></div>`,
  );

  const checkSvg = `<span class="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] text-2xl font-bold text-white">✓</span>`;
  out = out.replace(
    /<div class="relative w-\[60px\] h-\[60px\]"><\/div>/g,
    checkSvg,
  );

  out = out.replace(/href="\/client\/request-demo"/g, 'href="#hubungi"');
  out = out.replace(/href="\/client\/articles"/g, 'href="#bantuan"');
  out = out.replace(/href="\/client\/faq"/g, 'href="#bantuan"');
  out = out.replace(/href="\/"/g, 'href="__NUHA_BASE__/"');

  if (!out.includes('id="hubungi"')) {
    out = out.replace(/<footer/i, '<footer id="hubungi"');
  }
  if (!out.includes('id="bantuan"')) {
    out = out.replace(/href="\/client\/articles"/g, 'href="#bantuan" id="bantuan"');
  }

  out = out.replace(
    /<section aria-label="Notifications alt\+T"[\s\S]*?<\/section>/,
    "",
  );

  return out;
}

/** Path relatif dari `mirror/css/` agar font/gambar jalan dengan basePath subpath. */
function rewriteCssToRelative(css) {
  return css
    .replace(
      /url\((['"]?)\/_next\/static\/media\//g,
      "url($1../_next/static/media/",
    )
    .replace(/url\((['"]?)\/images\//g, "url($1../../images/");
}

async function syncImagesFromHtml(html) {
  const paths = new Set();
  for (const m of html.matchAll(/(?:src|href)=["'](\/images\/[^"']+)["']/gi)) {
    paths.add(m[1]);
  }
  for (const m of html.matchAll(/url\([^)]*\/images\/([^)]+)\)/gi)) {
    const chunk = m[0].match(/\/images\/[^)'"]+/);
    if (chunk) paths.add(chunk[0]);
  }

  let ok = 0;
  for (const path of paths) {
    const dest = join(ASSET_ROOT, path.replace(/^\//, ""));
    try {
      const size = await fetchBinary(`${BASE}${path}`, dest);
      console.log(`  asset ${String(size).padStart(7)} ${path}`);
      ok++;
    } catch (e) {
      console.warn(`  skip asset ${path}:`, e.message);
    }
  }
  return ok;
}

async function downloadCss(href, name) {
  const url = href.startsWith("http") ? href : `${BASE}${href}`;
  let css = await fetchText(url);

  const fontUrls = [
    ...css.matchAll(/url\((['"]?)(\/_next\/static\/media\/[^)'"]+)\1\)/g),
  ];
  for (const [, , fontPath] of fontUrls) {
    const fontDest = join(MIRROR, fontPath.replace(/^\//, ""));
    try {
      await fetchBinary(`${BASE}${fontPath}`, fontDest);
      console.log(`  font ${fontPath}`);
    } catch (e) {
      console.warn(`  skip font ${fontPath}:`, e.message);
    }
  }

  css = rewriteCssToRelative(css);
  const dest = join(MIRROR, "css", name);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, css);

  return dest;
}

async function main() {
  console.log("Fetching nuha.care…");
  const html = await fetchText(`${BASE}/`);
  console.log("Syncing /images from homepage…");
  await syncImagesFromHtml(html);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error("No <body> in homepage");

  let body = bodyMatch[1];
  const pageMatch = body.match(
    /<div class="min-h-screen[\s\S]*<\/footer>\s*<\/div>/i,
  );
  if (!pageMatch) throw new Error("Could not extract min-h-screen page root");
  body = pageMatch[0];

  body = patchCloneHtml(body);
  body = rewriteAssetPaths(body);

  await mkdir(MIRROR, { recursive: true });
  await writeFile(join(MIRROR, "body.html"), body, "utf8");
  console.log(`Wrote body.html (${body.length} chars)`);

  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  let i = 0;
  for (const tag of html.match(linkRegex) ?? []) {
    const hrefM = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefM) continue;
    const name = `bundle-${i++}.css`;
    console.log(`CSS ${hrefM[1]}`);
    await downloadCss(hrefM[1], name);
  }

  const overrides = `/* Clone overrides — nuha-chatbot-fe */
.nuha-clone-root {
  isolation: isolate;
  font-family: var(--font-montserrat), Montserrat, Arial, sans-serif;
}
.nuha-clone-root a[href^="https://nuha.care"] {
  pointer-events: auto;
}
.nuha-clone-root [data-slot="carousel"] {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
.nuha-clone-root [data-slot="carousel-content"] > .flex {
  scroll-snap-align: start;
}
`;
  await writeFile(join(MIRROR, "clone-overrides.css"), overrides);

  const manifest = {
    css: ["css/bundle-0.css", "css/bundle-1.css", "css/bundle-2.css"].filter(
      (_, idx) => idx < i,
    ),
    builtAt: new Date().toISOString(),
  };
  await writeFile(join(MIRROR, "manifest.json"), JSON.stringify(manifest, null, 2));

  const logo = join(ASSET_ROOT, "images/svg/logo.svg");
  const logoWhite = join(ASSET_ROOT, "images/svg/logo_white.svg");
  try {
    await copyFile(logo, join(PUBLIC, "logo-nuha.svg"));
    await copyFile(logoWhite, join(PUBLIC, "logo-nuha-white.svg"));
    console.log("Copied logos → public/");
  } catch (e) {
    console.warn("Logo copy:", e.message);
  }

  console.log("Done. Run: npm run download-nuha-assets (opsional refresh)");
  console.log("Then: npm run dev");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
