"use client";

import type { ReactNode } from "react";
import {
  EMR_COLORS,
  EmrAppsGridIcon,
  EmrMdiIcon,
  MDI_ACCOUNT_MULTIPLE_PLUS,
  MDI_CHART_AREASPLINE,
  MDI_HOSPITAL,
} from "@/components/emr/emr-app-icons";

export type EmrPortalApp = {
  id: string;
  label: string;
  icon: "hospital" | "akses" | "account-plus" | "chart";
  iconSize: number;
  iconColor: string;
  enabled: boolean;
};

type Props = {
  apps: EmrPortalApp[];
  onPick: (app: EmrPortalApp) => void;
  onBack: () => void;
  stepLabel?: string;
  backDisabled?: boolean;
};

/** Popup pilih aplikasi — meniru MuiDialog portal NUHA (ref/login-emr.html). */
export function EmrAppSelectDialog({
  apps,
  onPick,
  onBack,
  stepLabel = "1 / 2",
  backDisabled = false,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div
        role="dialog"
        aria-labelledby="emr-app-select-title"
        aria-describedby="emr-app-select-desc"
        className="relative z-[1201] w-full max-w-[480px] overflow-hidden rounded-lg bg-white shadow-[0px_11px_15px_-7px_rgba(0,0,0,0.2),0px_24px_38px_3px_rgba(0,0,0,0.14),0px_9px_46px_8px_rgba(0,0,0,0.12)]"
      >
        <div className="px-6 pb-2 pt-6">
          <div className="flex w-full flex-col items-center justify-center">
            <EmrAppsGridIcon />
            <p
              id="emr-app-select-title"
              className="mt-2 text-center text-xl font-semibold text-gray-900"
            >
              Silahkan Pilih Aplikasi
            </p>
            <p id="emr-app-select-desc" className="text-center text-gray-800">
              Silahkan pilih aplikasi sesuai kebutuhan anda{" "}
            </p>
          </div>

          <div className="mt-4">
            <div
              className="max-h-[350px] overflow-x-hidden overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {apps.map((app) => (
                <EmrAppRow key={app.id} app={app} onPick={() => onPick(app)} />
              ))}
            </div>

            <p className="mt-4 px-4 font-medium text-gray-800">
              Kamu wajib memilih menu sebelum ke tahap selanjutnya,
              <span style={{ color: EMR_COLORS.mainGreen }}> baca kebijakan </span>
              dalam memilih menu.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1">
          <button
            type="button"
            onClick={onBack}
            disabled={backDisabled}
            className="inline-flex items-center gap-0.5 rounded px-3 py-1.5 text-sm font-medium text-sky-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronBackIcon />
            Back
          </button>
          <span className="pr-4 text-sm text-gray-800">{stepLabel}</span>
        </div>
      </div>
    </div>
  );
}

function EmrAppRow({ app, onPick }: { app: EmrPortalApp; onPick: () => void }) {
  const icon = appIcon(app);

  return (
    <div
      id={app.label}
      className={`transition-all duration-300 ${
        app.enabled
          ? "cursor-pointer px-4 hover:bg-[#14b8a6] hover:text-white group"
          : "cursor-not-allowed px-4 opacity-55"
      }`}
    >
      <button
        type="button"
        disabled={!app.enabled}
        onClick={onPick}
        className="flex w-full items-center gap-x-4 py-3 text-left disabled:cursor-not-allowed"
      >
        <div className="shrink-0">{icon}</div>
        <p className="font-semibold capitalize text-gray-900 group-hover:text-white">
          {app.label}
        </p>
      </button>
      <hr className="m-0 border-0 border-t border-gray-200" />
    </div>
  );
}

function appIcon(app: EmrPortalApp): ReactNode {
  const path =
    app.icon === "chart"
      ? MDI_CHART_AREASPLINE
      : app.icon === "account-plus"
        ? MDI_ACCOUNT_MULTIPLE_PLUS
        : MDI_HOSPITAL;

  return (
    <EmrMdiIcon
      sizePx={app.iconSize}
      color={app.iconColor}
      path={path}
    />
  );
}

function ChevronBackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-300"
    >
      <path
        fill="currentColor"
        d="M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6l6 6z"
      />
    </svg>
  );
}
