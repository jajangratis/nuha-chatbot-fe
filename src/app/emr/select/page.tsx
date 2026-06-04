"use client";

import { useRouter } from "next/navigation";
import { EmrAppSelectDialog, type EmrPortalApp } from "@/components/emr/EmrAppSelectDialog";
import { EmrPatternBackground } from "@/components/emr/EmrPatternBackground";
import { EmrPrototypeDisclaimer } from "@/components/emr/EmrPrototypeDisclaimer";
import { EMR_COLORS } from "@/components/emr/emr-app-icons";
import { logout } from "@/lib/auth-api";
import { clearEmrAppSelection, markEmrAppSelected } from "@/lib/emr-flow";
import { withBasePath } from "@/lib/app-path";
import { useEmrAuthGuard } from "@/hooks/use-emr-auth-guard";

/** Daftar aplikasi — nama/ikon/warna mengikuti portal NUHA (login NIK 12345). */
const PORTAL_APPS: EmrPortalApp[] = [
  {
    id: "hris",
    label: "HRIS",
    icon: "hospital",
    iconSize: 16,
    iconColor: EMR_COLORS.hospital,
    enabled: false,
  },
  {
    id: "portal",
    label: "Portal",
    icon: "hospital",
    iconSize: 16,
    iconColor: EMR_COLORS.hospital,
    enabled: false,
  },
  {
    id: "simrs",
    label: "SIMRS",
    icon: "hospital",
    iconSize: 12,
    iconColor: EMR_COLORS.hospital,
    enabled: false,
  },
  {
    id: "emr_v2",
    label: "E-Medical Record V2",
    icon: "hospital",
    iconSize: 16,
    iconColor: EMR_COLORS.hospital,
    enabled: true,
  },
  {
    id: "akses",
    label: "Manajemen Akses",
    icon: "account-plus",
    iconSize: 18,
    iconColor: EMR_COLORS.akses,
    enabled: false,
  },
  {
    id: "hris_v2",
    label: "HRIS V2",
    icon: "account-plus",
    iconSize: 16,
    iconColor: "#000000",
    enabled: false,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "chart",
    iconSize: 15,
    iconColor: EMR_COLORS.hospital,
    enabled: false,
  },
];

export default function EmrSelectAppPage() {
  const router = useRouter();
  const { ready } = useEmrAuthGuard("select");

  const onPick = (app: EmrPortalApp) => {
    if (!app.enabled) return;
    if (app.id === "emr_v2") {
      markEmrAppSelected();
      router.push(withBasePath("/emr/dashboard"));
    }
  };

  const onBack = () => {
    clearEmrAppSelection();
    logout();
    router.push(withBasePath("/emr"));
  };

  if (!ready) {
    return (
      <EmrPatternBackground className="flex items-center justify-center">
        <p className="text-sm text-gray-500">Memuat...</p>
      </EmrPatternBackground>
    );
  }

  return (
    <EmrPatternBackground className="items-center justify-center py-8">
      <EmrAppSelectDialog apps={PORTAL_APPS} onPick={onPick} onBack={onBack} />
      <EmrPrototypeDisclaimer variant="inline" />
    </EmrPatternBackground>
  );
}
