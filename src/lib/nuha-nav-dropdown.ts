import {
  NUHA_NAV_ASSET_PATHS,
  NUHA_NAV_DROPDOWN_LABELS,
  NUHA_NAV_DROPDOWNS,
  type NuhaNavDropdownLabel,
  type NuhaNavMenuItem,
} from "@/lib/nuha-nav-menu-data";

export { NUHA_NAV_DROPDOWN_LABELS, NUHA_NAV_ASSET_PATHS };
export type { NuhaNavDropdownLabel };

export function normalizeNavLabel(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function triggerMatchesLabel(
  trigger: Element,
  label: NuhaNavDropdownLabel,
): boolean {
  const raw = trigger.textContent ?? "";
  return normalizeNavLabel(raw).startsWith(label);
}

/** Prefix path app (mis. /chatbot) dari logo yang sudah di-render di mirror. */
export function getNuhaAssetBase(root: HTMLElement): string {
  const logo = root.querySelector('img[src*="/nuha-care/images/"]');
  if (logo instanceof HTMLImageElement) {
    const src = logo.getAttribute("src") ?? "";
    const idx = src.indexOf("/nuha-care/");
    if (idx >= 0) return src.slice(0, idx);
  }
  return "";
}

export function nuhaCareAssetUrl(root: HTMLElement, assetPath: string): string {
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${getNuhaAssetBase(root)}/nuha-care${normalized}`;
}

function resolveNavHref(root: HTMLElement, href: string): string {
  if (href === "/client/articles" || href === "/client/faq") {
    return "#bantuan";
  }
  if (href === "/client/request-demo") {
    return "#hubungi";
  }
  const base = getNuhaAssetBase(root);
  return href.startsWith("http") ? href : `${base}${href}`;
}

function createNavMenuLink(root: HTMLElement, item: NuhaNavMenuItem): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = resolveNavHref(root, item.href);
  a.className =
    "nuha-nav-dropdown-link group flex gap-3 items-start rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50";

  const img = document.createElement("img");
  img.src = nuhaCareAssetUrl(root, item.logo);
  img.alt = "";
  img.width = 40;
  img.height = 40;
  img.className = "nuha-nav-item-icon h-10 w-10 shrink-0 object-contain";
  img.loading = "lazy";
  img.decoding = "async";

  const body = document.createElement("div");
  body.className = "min-w-0 flex-1";

  const title = document.createElement("span");
  title.className =
    "block text-sm font-medium text-[#014547] group-hover:text-[#07C5BA]";
  title.textContent = item.title;

  const desc = document.createElement("p");
  desc.className =
    "mt-1 text-sm leading-snug text-gray-500 group-hover:text-gray-600 line-clamp-2 pr-1";
  desc.textContent = item.description;

  body.appendChild(title);
  body.appendChild(desc);
  a.appendChild(img);
  a.appendChild(body);
  return a;
}

export function buildDesktopDropdownPanel(
  root: HTMLElement,
  label: NuhaNavDropdownLabel,
): HTMLElement {
  const group = NUHA_NAV_DROPDOWNS[label];

  const shell = document.createElement("div");
  shell.className =
    "nuha-nav-dropdown pointer-events-none invisible absolute left-1/2 top-full z-[70] w-[min(calc(100vw-2rem),600px)] -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-200 ease-out";

  const card = document.createElement("div");
  card.className =
    "nuha-nav-dropdown-card overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]";

  const inner = document.createElement("div");
  inner.className = "nuha-nav-dropdown-inner font-montserrat";

  const heading = document.createElement("p");
  heading.className = "mb-3 text-sm font-medium text-gray-500";
  heading.textContent = group.sectionTitle;

  const grid = document.createElement("div");
  grid.className = "grid gap-1 sm:grid-cols-2";

  for (const item of group.items) {
    grid.appendChild(createNavMenuLink(root, item));
  }

  inner.appendChild(heading);
  inner.appendChild(grid);
  card.appendChild(inner);
  shell.appendChild(card);
  return shell;
}

/** Tambah ikon pada link accordion menu mobile (konten sama, dengan logo). */
export function enhanceMobileNavIcons(root: HTMLElement): void {
  const drawer = Array.from(root.querySelectorAll(".fixed.inset-y-0.right-0")).find(
    (el) => el.className.includes("max-w-sm"),
  );
  if (!drawer) return;

  const hrefToItem = new Map<string, NuhaNavMenuItem>();
  for (const group of Object.values(NUHA_NAV_DROPDOWNS)) {
    for (const item of group.items) {
      hrefToItem.set(item.href, item);
      if (item.href === "/client/articles") hrefToItem.set("#bantuan", item);
      if (item.href === "/client/faq") hrefToItem.set("#bantuan", { ...item, title: "FAQ" });
    }
  }

  drawer.querySelectorAll("a[href]").forEach((a) => {
    if (!(a instanceof HTMLAnchorElement)) return;
    if (a.querySelector(".nuha-nav-item-icon")) return;

    const href = a.getAttribute("href") ?? "";
    const item =
      hrefToItem.get(href) ??
      [...hrefToItem.entries()].find(([k]) => href.includes(k))?.[1];
    if (!item) return;

    const img = document.createElement("img");
    img.src = nuhaCareAssetUrl(root, item.logo);
    img.alt = "";
    img.width = 36;
    img.height = 36;
    img.className = "nuha-nav-item-icon mr-3 h-9 w-9 shrink-0 object-contain float-left";
    img.loading = "lazy";

    const children = [...a.childNodes];
    a.textContent = "";

    a.classList.add("flex", "gap-3", "items-start");
    a.appendChild(img);

    const wrap = document.createElement("div");
    wrap.className = "min-w-0 flex-1";

    let hasTitle = false;
    for (const child of children) {
      if (child instanceof HTMLElement && child.tagName === "P") {
        wrap.appendChild(child);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (!text) continue;
        const span = document.createElement("span");
        span.className = "block text-sm font-medium text-[#014547]";
        span.textContent = text;
        wrap.appendChild(span);
        hasTitle = true;
      }
    }
    if (!hasTitle) {
      const span = document.createElement("span");
      span.className = "block text-sm font-medium text-[#014547]";
      span.textContent = item.title;
      wrap.insertBefore(span, wrap.firstChild);
    }

    a.appendChild(wrap);
  });
}

export function mountDesktopNavDropdowns(root: HTMLElement): () => void {
  const desktopWrap = Array.from(root.querySelectorAll("div")).find(
    (el) =>
      el.classList.contains("hidden") &&
      el.classList.contains("lg:flex") &&
      el.querySelector('nav[aria-label="Main"]'),
  );
  const nav = desktopWrap?.querySelector('nav[aria-label="Main"]');
  if (!nav) return () => {};

  enhanceMobileNavIcons(root);

  const mounted: HTMLElement[] = [];

  nav.querySelectorAll('[data-slot="navigation-menu-item"]').forEach((item) => {
    if (!(item instanceof HTMLElement)) return;
    const trigger = item.querySelector('[data-slot="navigation-menu-trigger"]');
    if (!trigger) return;

    const label = NUHA_NAV_DROPDOWN_LABELS.find((l) =>
      triggerMatchesLabel(trigger, l),
    );
    if (!label) return;

    const dropdown = buildDesktopDropdownPanel(root, label);
    item.classList.add("nuha-nav-dropdown-wrap");
    if (!item.classList.contains("relative")) item.classList.add("relative");
    item.appendChild(dropdown);
    mounted.push(dropdown);

    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("data-state", "closed");

    const open = () => {
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("data-state", "open");
    };
    const close = () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("data-state", "closed");
    };

    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", close);
    item.addEventListener("focusin", open);
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget as Node)) close();
    });
  });

  return () => {
    mounted.forEach((el) => el.remove());
    nav
      .querySelectorAll(".nuha-nav-dropdown-wrap")
      .forEach((el) => el.classList.remove("nuha-nav-dropdown-wrap"));
  };
}
