import { fetchNuhaCareHtml } from "@/lib/nuha-fetch";

/** Cek apakah proxy server bisa mengakses nuha.care (untuk pilih iframe src di client) */
export async function GET() {
  const result = await fetchNuhaCareHtml("/", { retries: 2 });

  return Response.json(
    {
      available: result.ok,
      reason: result.ok ? null : result.reason,
      status: result.ok ? 200 : result.status,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
