"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { EmrAuthCard } from "@/components/emr/EmrAuthCard";
import { EmrNuhaLogo } from "@/components/emr/EmrNuhaLogo";
import { EmrPatternBackground } from "@/components/emr/EmrPatternBackground";
import { login } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { useEmrAuthGuard } from "@/hooks/use-emr-auth-guard";

export default function EmrLoginPage() {
  const router = useRouter();
  const { ready } = useEmrAuthGuard("login");
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(nik.trim(), password);
      router.push(withBasePath("/emr/select"));
    } catch {
      setError("NIK atau kata sandi salah.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <EmrPatternBackground className="flex items-center justify-center">
        <p className="text-sm text-gray-500">Memuat...</p>
      </EmrPatternBackground>
    );
  }

  return (
    <EmrPatternBackground>
      <EmrAuthCard>
        <div className="flex flex-col justify-center items-center">
          <EmrNuhaLogo size="lg" />
          <p className="font-medium xl:w-10/12 w-12/12 text-center text-sm text-gray-600 mt-3">
            Silahkan masukkan NIK dan kata sandi anda untuk melanjutkan
          </p>

          {error ? (
            <p className="mt-3 w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {error}
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="mt-3 grid w-full gap-y-5">
            <label className="block text-xs font-medium text-gray-700">
              NIK
              <div className="mt-1.5 flex items-center rounded-md border border-gray-200">
                <span className="pl-3 text-gray-400">
                  <PersonIcon />
                </span>
                <input
                  required
                  autoComplete="username"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="Masukan NIK (Nomor Induk Kepegawaian)"
                  className="py-[0.5rem] text-sm outline-0 border-none flex-1 w-full pr-3 bg-transparent"
                />
              </div>
            </label>
            <label className="block text-xs font-medium text-gray-700">
              Kata Sandi
              <div className="mt-1.5 flex items-center rounded-md border border-gray-200">
                <span className="pl-3 text-gray-400">
                  <LockIcon />
                </span>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="py-[0.5rem] text-sm outline-0 border-none flex-1 w-full pr-3 bg-transparent"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </EmrAuthCard>
    </EmrPatternBackground>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3-9H9V6a3 3 0 016 0v2z" />
    </svg>
  );
}
