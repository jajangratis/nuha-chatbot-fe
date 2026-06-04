"use client";

import { useState, type ReactNode } from "react";
import { withBasePath } from "@/lib/app-path";
import { EmrSidebarFooter } from "@/components/emr/EmrSidebarFooter";
import { EMR_THEME } from "@/components/emr/emr-theme";

type MenuNode = {
  code: string;
  title: string;
  root?: boolean;
  icon?: ReactNode;
  children?: MenuNode[];
};

const MDI_DASHBOARD =
  "M16,20H20V16H16M16,14H20V10H16M10,8H14V4H10M16,8H20V4H16M10,14H14V10H10M4,14H8V10H4M4,20H8V16H4M10,20H14V16H10M4,8H8V4H4V8Z";
const MDI_MAGNIFY =
  "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z";
const MDI_HOSPITAL =
  "M2 22V7a1 1 0 0 1 1-1h4V2h10v4h4a1 1 0 0 1 1 1v15h-8v-5h-4v5zM9 4v6h2V8h2v2h2V4h-2v2h-2V4zM4 20h4v-3H4zm0-5h4v-3H4zm12 5h4v-3h-4zm0-5h4v-3h-4zm-6 0h4v-3h-4z";
const MDI_CLIPBOARD =
  "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";
const MDI_BED =
  "M19 7H5a2 2 0 0 0-2 2v9H1v2h22v-2h-2v-4.1a2 2 0 0 0-2-1.9H5V9h14v2h4V7z";
const MDI_AMBULANCE =
  "M18 18.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5m-9 0A1.5 1.5 0 0 1 7.5 17A1.5 1.5 0 0 1 9 15.5A1.5 1.5 0 0 1 10.5 17A1.5 1.5 0 0 1 9 18.5M20 8h-3V6H5v12h2a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3h2v-4l-3-4Z";
const MDI_FOLDER =
  "M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z";
const MDI_BAG =
  "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C15.4,11 16,11.6 16,12.2V15.7C16,16.4 15.4,17 14.7,17H9.3C8.6,17 8,16.4 8,15.7V12.2C8,11.6 8.6,11 9.2,11V9.5C9.2,8.1 10.6,7 12,7Z";
const MDI_STETHOSCOPE =
  "M19.8,4.93L18.37,6.36L19.79,7.79L21.21,6.37L19.8,4.93M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M4.93,4.93L3.5,6.36L4.93,7.79L6.36,6.36L4.93,4.93M5,13A7,7 0 0,0 12,20A7,7 0 0,0 19,13V16H21V13A9,9 0 0,1 12,22A9,9 0 0,1 3,13V16H5V13Z";
const MDI_FILE =
  "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z";
const MDI_TEST =
  "M7,2V4H8V18A3,3 0 0,0 11,21H13A3,3 0 0,0 16,18V4H17V2H7M11,16H13V4H11V16Z";
const MDI_PILL =
  "M4.22,11.29L11.29,4.22C13.64,1.88 17.43,1.88 19.78,4.22C22.12,6.56 22.12,10.36 19.78,12.71L12.71,19.78C10.36,22.12 6.56,22.12 4.22,19.78C1.88,17.43 1.88,13.64 4.22,11.29M5.64,12.71L8.05,15.12L15.12,8.05L12.71,5.64L5.64,12.71Z";
const MDI_CASH =
  "M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z";
const MDI_CHART =
  "M17.45 15.18L22 7.31V21H2V3h2v12.54L9.5 6L16 9.78l4.24-7.33l1.73 1l-5.23 9.05l-6.51-3.75L4.31 19h2.26l4.39-7.56z";
const MDI_LAN =
  "M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9C4,11.21 7.58,13 12,13C16.42,13 20,11.21 20,9V10.5C20,12.71 16.42,14.5 12,14.5C7.58,14.5 4,12.71 4,10.5V9M4,13.5C4,15.71 7.58,17.5 12,17.5C16.42,17.5 20,15.71 20,13.5V15C20,17.21 16.42,19 12,19C7.58,19 4,17.21 4,15V13.5Z";
const MDI_CHEV_UP = "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z";
const MDI_CHEV_DOWN = "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z";

const MENU_TREE: MenuNode[] = [
  {
    code: "DASH",
    title: "Dashboard",
    root: true,
    icon: <MdiIcon path={MDI_DASHBOARD} size={14} />,
    children: [
      {
        code: "RPP_DFTR",
        title: "Daftar Ringkasan Pasien Pulang",
        icon: <MdiIcon path={MDI_CLIPBOARD} size={14} />,
      },
      { code: "RPP_MNTR", title: "Monitoring", icon: <MdiIcon path={MDI_DASHBOARD} size={14} /> },
      { code: "RPP_RJ", title: "Rawat Jalan", icon: <MdiIcon path={MDI_HOSPITAL} size={14} /> },
      { code: "RPP_RINAP", title: "Rawat INAP", icon: <MdiIcon path={MDI_BED} size={14} /> },
      { code: "RPP_IGD", title: "IGD", icon: <MdiIcon path={MDI_AMBULANCE} size={14} /> },
    ],
  },
  { code: "ADM", title: "Administrasi", root: true, icon: <MdiIcon path={MDI_FOLDER} size={14} /> },
  { code: "IGD", title: "IGD", root: true, icon: <MdiIcon path={MDI_BAG} size={14} /> },
  { code: "RJ", title: "Rawat Jalan", root: true, icon: <MdiIcon path={MDI_STETHOSCOPE} size={14} /> },
  { code: "RM3", title: "Rekam Medis v3", root: true, icon: <MdiIcon path={MDI_FILE} size={14} /> },
  { code: "REL", title: "Resume EMR Lama", root: true, icon: <MdiIcon path={MDI_FILE} size={14} /> },
  { code: "RI", title: "Rawat Inap", root: true, icon: <MdiIcon path={MDI_BED} size={14} /> },
  { code: "PM", title: "Penunjang Medis", root: true, icon: <MdiIcon path={MDI_TEST} size={14} /> },
  { code: "FR", title: "Farmasi", root: true, icon: <MdiIcon path={MDI_PILL} size={14} /> },
  { code: "KEU", title: "Keuangan", root: true, icon: <MdiIcon path={MDI_CASH} size={14} /> },
  { code: "LAP", title: "Laporan", root: true, icon: <MdiIcon path={MDI_CHART} size={14} /> },
  { code: "BRG", title: "Bridging", root: true, icon: <MdiIcon path={MDI_LAN} size={14} /> },
];

export function EmrSidebar() {
  const [query, setQuery] = useState("");
  const [expandedRoot, setExpandedRoot] = useState("DASH");
  const [activeCode, setActiveCode] = useState("RPP_DFTR");

  const filtered = filterMenu(MENU_TREE, query.toLowerCase());

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white"
      style={{ width: EMR_THEME.drawerWidth }}
      role="presentation"
    >
      <div className="mt-[0.7rem] flex justify-center px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBasePath("/logo-nuha.svg")}
          alt="NUHA"
          className="h-9 w-auto max-w-[180px]"
        />
      </div>

      <div className="mb-2 mt-4 px-3">
        <div
          className="-mt-1 flex w-full items-center gap-x-2 rounded-[4px] px-3 py-[0.35rem]"
          style={{ background: EMR_THEME.mainBg }}
        >
          <MdiIcon path={MDI_MAGNIFY} size={20} color={EMR_THEME.mainGray} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Menu"
            className="w-full bg-transparent text-[10px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <nav
        className="w-full max-w-[360px] flex-1 overflow-hidden"
        aria-labelledby="nested-list-subheader"
      >
        <div
          className="overflow-x-hidden overflow-y-auto"
          style={{ maxHeight: "78vh", minHeight: "78vh" }}
        >
          {filtered.map((item) => (
            <MenuBranch
              key={item.code}
              node={item}
              depth={0}
              expandedRoot={expandedRoot}
              activeCode={activeCode}
              onToggleRoot={(code) =>
                setExpandedRoot((prev) => (prev === code ? "" : code))
              }
              onSelect={setActiveCode}
            />
          ))}
        </div>
      </nav>

      <EmrSidebarFooter />
    </aside>
  );
}

function filterMenu(nodes: MenuNode[], q: string): MenuNode[] {
  if (!q) return nodes;
  const out: MenuNode[] = [];
  for (const node of nodes) {
    const titleMatch = node.title.toLowerCase().includes(q);
    const children = node.children ? filterMenu(node.children, q) : [];
    if (titleMatch || children.length > 0) {
      out.push({
        ...node,
        children: children.length > 0 ? children : node.children,
      });
    }
  }
  return out;
}

function MenuBranch({
  node,
  depth,
  expandedRoot,
  activeCode,
  onToggleRoot,
  onSelect,
}: {
  node: MenuNode;
  depth: number;
  expandedRoot: string;
  activeCode: string;
  onToggleRoot: (code: string) => void;
  onSelect: (code: string) => void;
}) {
  const isRootOpen = expandedRoot === node.code;
  const hasChildren = (node.children?.length ?? 0) > 0;

  const handleClick = () => {
    if (node.root && hasChildren) {
      onToggleRoot(node.code);
      return;
    }
    onSelect(node.code);
  };

  return (
    <>
      <MenuRow
        node={node}
        depth={depth}
        active={activeCode === node.code}
        onClick={handleClick}
        showChevron={Boolean(node.root)}
        chevronUp={isRootOpen}
      />
      {hasChildren && isRootOpen ? (
        <div
          className="ml-[5px] border-l border-solid"
          style={{ borderColor: EMR_THEME.mainGray, borderWidth: "0.5px" }}
        >
          {node.children!.map((child) => (
            <MenuRow
              key={child.code}
              node={child}
              depth={depth + 1}
              active={activeCode === child.code}
              onClick={() => onSelect(child.code)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

function MenuRow({
  node,
  depth,
  active,
  onClick,
  showChevron = false,
  chevronUp = false,
}: {
  node: MenuNode;
  depth: number;
  active?: boolean;
  onClick?: () => void;
  showChevron?: boolean;
  chevronUp?: boolean;
}) {
  const pl = depth === 0 ? "pl-4" : "pl-6";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-[30px] w-full items-center py-0 text-left text-gray-900 transition-colors hover:bg-sky-500 hover:text-white ${pl} pr-3 ${
        active ? "font-semibold" : "font-medium"
      }`}
    >
      {active ? (
        <span
          className="absolute bottom-0 left-0 top-0 w-[3px]"
          style={{ background: EMR_THEME.mainBlue }}
          aria-hidden
        />
      ) : null}
      <span
        className={`mr-[0.4rem] shrink-0 group-hover:text-white [&_svg]:group-hover:text-white ${
          active ? "text-[#1e293b]" : "text-[#1e293b]"
        }`}
      >
        {node.icon}
      </span>
      <span
        className="flex-1 leading-none group-hover:text-white"
        style={{ fontSize: EMR_THEME.menuFontSize }}
      >
        {node.title}
      </span>
      {showChevron ? (
        <span className="shrink-0 text-slate-600 group-hover:text-white">
          <MdiIcon
            path={chevronUp ? MDI_CHEV_UP : MDI_CHEV_DOWN}
            size={20}
            color="currentColor"
          />
        </span>
      ) : null}
    </button>
  );
}

function MdiIcon({
  path,
  size,
  color = EMR_THEME.iconColor,
  className = "",
}: {
  path: string;
  size: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ color }}
      aria-hidden
    >
      <path fill="currentColor" d={path} />
    </svg>
  );
}
