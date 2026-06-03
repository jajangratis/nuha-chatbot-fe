/** Ikon MDI — path sama dengan portal NUHA (iconify--mdi di ref/login-emr.html). */

export const EMR_COLORS = {
  mainYellow: "#eab308",
  mainGreen: "#14b8a6",
  hospital: "#0A8FDC",
  akses: "#03AC0E",
} as const;

export function EmrAppsGridIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" role="presentation" className={className} aria-hidden>
      <path
        d="M16,20H20V16H16M16,14H20V10H16M10,8H14V4H10M16,8H20V4H16M10,14H14V10H10M4,14H8V10H4M4,20H8V16H4M10,20H14V16H10M4,8H8V4H4V8Z"
        fill={EMR_COLORS.mainYellow}
      />
    </svg>
  );
}

type MdiIconProps = {
  sizePx: number;
  color: string;
  path: string;
};

export function EmrMdiIcon({ sizePx, color, path }: MdiIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      viewBox="0 0 24 24"
      className="shrink-0 transition-colors group-hover:text-white"
      style={{ width: sizePx, height: sizePx, color }}
    >
      <path fill="currentColor" d={path} />
    </svg>
  );
}

/** mdi-hospital-building */
export const MDI_HOSPITAL =
  "M2 22V7a1 1 0 0 1 1-1h4V2h10v4h4a1 1 0 0 1 1 1v15h-8v-5h-4v5zM9 4v6h2V8h2v2h2V4h-2v2h-2V4zM4 20h4v-3H4zm0-5h4v-3H4zm12 5h4v-3h-4zm0-5h4v-3h-4zm-6 0h4v-3h-4z";

/** mdi-account-multiple-plus */
export const MDI_ACCOUNT_MULTIPLE_PLUS =
  "M19 17v2H7v-2s0-4 6-4s6 4 6 4m-3-9a3 3 0 1 0-3 3a3 3 0 0 0 3-3m3.2 5.06A5.6 5.6 0 0 1 21 17v2h3v-2s0-3.45-4.8-3.94M18 5a2.9 2.9 0 0 0-.89.14a5 5 0 0 1 0 5.72A2.9 2.9 0 0 0 18 11a3 3 0 0 0 0-6M8 10H5V7H3v3H0v2h3v3h2v-3h3Z";

/** mdi-chart-areaspline */
export const MDI_CHART_AREASPLINE =
  "M17.45 15.18L22 7.31V21H2V3h2v12.54L9.5 6L16 9.78l4.24-7.33l1.73 1l-5.23 9.05l-6.51-3.75L4.31 19h2.26l4.39-7.56z";
