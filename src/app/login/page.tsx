"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user } = await login(username, password);

      if (user.role === "user") {
        router.push(withBasePath("/support"));
        return;
      }

      if (user.role === "agent" || user.role === "admin") {
        router.push(withBasePath("/agent"));
        return;
      }

      if (user.role === "developer") {
        router.push(withBasePath("/tickets"));
        return;
      }

      router.push(withBasePath("/support"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-[#F5F5F5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#014547]/10 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-[#014547]">Masuk Nuha Care Support</h1>
        <p className="mt-1 text-sm text-[#717171]">
          Dev: <code className="text-xs">awan</code> (user),{" "}
          <code className="text-xs">apoy</code>/<code className="text-xs">ilham</code> (agent) — password{" "}
          <code className="text-xs">password</code>
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-[#014547]">
            Username
            <input
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-[#014547]">
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#717171]">
          Belum punya akun?{" "}
          <Link href={withBasePath("/")} className="text-[#07C5BA] hover:underline">
            Chat sebagai tamu
          </Link>
        </p>
      </div>
    </main>
  );
}
