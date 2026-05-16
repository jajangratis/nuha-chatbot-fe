"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F5F5] px-4 text-center text-[#014547]">
      <h1 className="text-2xl font-semibold">Gagal memuat halaman Nuha</h1>
      <p className="max-w-md text-sm text-[#717171]">
        Periksa koneksi internet Anda, lalu coba muat ulang.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] px-6 py-2 text-sm font-medium text-white"
      >
        Muat ulang
      </button>
    </div>
  );
}
