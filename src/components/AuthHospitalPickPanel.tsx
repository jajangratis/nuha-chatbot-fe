"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth-api";
import { resolveDefaultChatHospitalId } from "@/lib/chat-hospital-default";
import { persistChatHospitalPick } from "@/lib/persist-chat-hospital";
import { fetchHospitals, type Hospital } from "@/lib/support-api";

type Props = {
  user: AuthUser;
  onSaved: (updatedUser: AuthUser) => void;
  className?: string;
  compact?: boolean;
};

function pickDescription(): string {
  return "Pilih rumah sakit Anda. Pilihan disimpan di profil sehingga tidak perlu dipilih lagi.";
}

export function AuthHospitalPickPanel({
  user,
  onSaved,
  className = "",
  compact = false,
}: Props) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [draftHospitalId, setDraftHospitalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchHospitals()
      .then((list) => {
        setHospitals(list);
        setDraftHospitalId((prev) => prev ?? resolveDefaultChatHospitalId(user, list));
      })
      .catch(() => setError("Gagal memuat daftar rumah sakit."));
  }, [user]);

  const onConfirm = async () => {
    if (!draftHospitalId) {
      setError("Pilih rumah sakit terlebih dahulu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await persistChatHospitalPick(user, draftHospitalId);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan rumah sakit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        className ||
        (compact
          ? "flex flex-1 flex-col gap-3 bg-[#F5F5F5] p-4"
          : "mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[#014547]/10 bg-white p-6 shadow-sm")
      }
    >
      <p className={compact ? "text-xs text-[#0B1D15]" : "text-sm text-[#0B1D15]"}>
        {pickDescription()}
      </p>
      <label className="text-xs font-medium text-[#014547]">
        Rumah sakit
        <select
          value={draftHospitalId ?? ""}
          onChange={(e) => setDraftHospitalId(e.target.value || null)}
          disabled={saving}
          className="mt-1 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm"
        >
          <option value="">Pilih rumah sakit</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.code})
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900">{error}</p>
      )}
      <button
        type="button"
        disabled={!draftHospitalId || saving}
        onClick={() => void onConfirm()}
        className={
          compact
            ? "mt-auto rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            : "rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        }
      >
        {saving ? "Menyimpan…" : "Mulai chat"}
      </button>
    </div>
  );
}
