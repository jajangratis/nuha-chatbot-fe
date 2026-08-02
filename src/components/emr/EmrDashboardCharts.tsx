"use client";

import { EMR_THEME } from "@/components/emr/emr-theme";

const LEGEND = [
  { color: "#e74c3c", label: "Belum validasi dokter" },
  { color: "#b8e986", label: "Sudah validasi dokter" },
  { color: "#7ed957", label: "Belum validasi casemix" },
  { color: "#2d6a4f", label: "Sudah validasi casemix" },
];

const DONUT_GRADIENT = `conic-gradient(
  #e74c3c 0deg 72deg,
  #b8e986 72deg 180deg,
  #7ed957 180deg 288deg,
  #2d6a4f 288deg 360deg
)`;

function ChartCard({ title, total }: { title: string; total: string }) {
  return (
    <div className="h-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div
        className="px-3 py-1.5 text-xs font-bold text-white"
        style={{ background: EMR_THEME.mainBlue }}
      >
        {title}
      </div>
      <div className="overflow-hidden px-2 py-2">
        <div className="mb-2 flex items-center justify-end">
          <span className="text-[10px] text-gray-400">Total: {total}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-[110px] w-[110px] shrink-0">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: DONUT_GRADIENT }}
              aria-hidden
            />
            <div className="absolute inset-[28%] rounded-full bg-white" aria-hidden />
          </div>
          <ul className="min-w-[130px] space-y-1 text-[10px] text-gray-600">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function EmrDashboardCharts() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-sm font-bold" style={{ color: EMR_THEME.textBlack }}>
          Ringkasan Pasien Pulang
        </h1>
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
          <span>
            {fmt(start)} sampai {fmt(today)}
          </span>
          <FilterIcon />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-x-3 gap-y-3">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ChartCard title="Validasi Resume" total="128" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ChartCard title="Status Casemix" total="96" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ChartCard title="Belum Lengkap" total="42" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ChartCard title="Sudah Pulang" total="210" />
        </div>
      </div>
    </>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af" aria-hidden>
      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
    </svg>
  );
}
