import { fetchNuhaCareHtml, isBlockedNuhaResponse } from "@/lib/nuha-fetch";
import { transformNuhaDocument } from "@/lib/nuha-mirror";

function errorHtml(message: string, status?: number) {
  const detail = status ? ` (${status})` : "";
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/><base href="https://nuha.care/"></head>
<body style="font-family:Montserrat,sans-serif;padding:2rem;color:#014547;text-align:center">
<h1 style="font-size:1.25rem">Gagal memuat nuha.care${detail}</h1>
<p style="color:#717171;font-size:0.9rem">${message}</p>
<p style="margin-top:1.5rem"><a href="https://nuha.care/" style="color:#07C5BA">Buka nuha.care langsung</a></p>
<script>
  if (window.parent !== window) {
    window.parent.postMessage({ type: "nuha-proxy-failed" }, "*");
  }
</script>
</body></html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? "/";
  const incomingCookie = request.headers.get("cookie") ?? "";

  const result = await fetchNuhaCareHtml(path, {
    cookie: incomingCookie,
    retries: 3,
  });

  if (!result.ok) {
    const msg =
      result.reason === "network"
        ? "Koneksi ke nuha.care gagal. Coba muat ulang atau buka situs langsung."
        : "Akses diblokir sementara (WAF). Halaman akan mencoba sumber alternatif.";
    return new Response(errorHtml(msg, result.status), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Nuha-Proxy": "failed",
        "Cache-Control": "no-store",
      },
    });
  }

  const html = transformNuhaDocument(result.html);

  if (isBlockedNuhaResponse(html, 200)) {
    return new Response(
      errorHtml("Respons tidak valid dari nuha.care.", 403),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Nuha-Proxy": "failed",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Nuha-Proxy": "ok",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
