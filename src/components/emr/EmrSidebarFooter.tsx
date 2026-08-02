"use client";

import { EMR_THEME } from "@/components/emr/emr-theme";

const MDI_FILE = "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z";
const MDI_ANDROID =
  "M16,12H15V7H13V12H11V7H9V12H8V10.5C8,9.67 8.67,9 9.5,9H14.5C15.33,9 16,9.67 16,10.5V12M17.5,17C15.57,17 14,15.43 14,13.5C14,11.57 15.57,10 17.5,10C19.43,10 21,11.57 21,13.5C21,15.43 19.43,17 17.5,17M6.5,17C4.57,17 3,15.43 3,13.5C3,11.57 4.57,10 6.5,10C8.43,10 10,11.57 10,13.5C10,15.43 8.43,17 6.5,17Z";
const MDI_APPLE =
  "M18.71,19.5C17.86,20.5 16.16,21.88 14.14,21.94C12.44,22 11.76,21.19 9.64,21.19C7.5,21.19 6.79,21.94 5.14,22C3.25,22.06 1.45,20.47 0.5,18.5C-1.54,14.36 0.12,8.22 2.16,4.84C3.16,3.28 4.86,2.26 6.71,2.25C8.56,2.24 10.14,3.13 11.29,3.13C12.44,3.13 14.36,2.06 16.54,2.25C17.74,2.41 19.5,2.94 20.5,4.34C20.41,4.4 18.3,5.5 18.32,8.12C18.34,11.06 20.8,12.19 20.82,12.2C20.79,12.28 20.4,13.59 19.5,14.94C18.67,16.19 17.7,17.38 16.5,17.5C15.3,17.62 14.8,17 13.5,17C12.2,17 11.5,17.5 10.36,17.5C9.22,17.5 8.5,17 7.14,17C5.78,17 4.5,17.5 3.29,17.5Z";

function MdiIcon({ path, size }: { path: string; size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="currentColor" d={path} />
    </svg>
  );
}

/** Footer drawer — selaras portal (badge versi + ikon platform). */
export function EmrSidebarFooter() {
  return (
    <div className="-mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
      <a
        href="https://nuha.care"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-medium hover:underline"
        style={{ color: EMR_THEME.mainBlue }}
      >
        ✨ Baru di v2.8.0
      </a>
      <div className="flex items-center gap-2 text-[#94a3b8]">
        <MdiIcon path={MDI_FILE} size={16} />
        <MdiIcon path={MDI_ANDROID} size={16} />
        <MdiIcon path={MDI_APPLE} size={16} />
      </div>
    </div>
  );
}
